import mongoose, { Schema, Document, Model, ClientSession } from 'mongoose';
import { HttpStatus } from '@nestjs/common';
import { AppError } from '../errors/app-error';
import { FactoryService } from '@shared/services/factory.service';

const factoryService = new FactoryService();

interface CascadeRule {
  model: string;
  field: string;
  action: 'delete' | 'nullify' | 'restrict' | 'soft-delete';
  condition?: Record<string, unknown>; // Additional query conditions
  batchSize?: number; // For large datasets
  beforeCascade?: (doc: Document, relatedDocs: Document[]) => Promise<void>; // Hook
  afterCascade?: (doc: Document, relatedDocs: Document[]) => Promise<void>; // Hook
}

interface CascadeOptions {
  rules: CascadeRule[];
  useTransaction?: boolean; // Enable transaction support
  softDeleteField?: string; // Field name for soft deletes (e.g., 'deletedAt')
  cascadeDepth?: number; // Max depth for nested cascades (prevent infinite loops)
  parallel?: boolean; // Execute rules in parallel
  onError?: (error: Error, rule: CascadeRule) => void; // Error handler
}

/**
 * Advanced Cascade Plugin
 *
 * This plugin enables dynamic cascading operations with advanced features:
 * - Transaction support for atomic operations
 * - Soft delete integration
 * - Batch processing for performance
 * - Event hooks (before/after cascade)
 * - Circular dependency detection
 * - Parallel execution option
 *
 * Usage:
 * schema.plugin(cascadePlugin, {
 *   rules: [
 *     { model: 'Product', field: 'provider', action: 'delete' },
 *     { model: 'Product', field: 'provider', action: 'soft-delete' },
 *     { model: 'Product', field: 'provider', action: 'nullify', condition: { status: 'active' } }
 *   ],
 *   useTransaction: true,
 *   softDeleteField: 'deletedAt',
 *   parallel: false
 * });
 */
function cascadePlugin<T extends Document>(schema: Schema<T>, options: CascadeOptions) {
  const {
    rules,
    useTransaction = false,
    softDeleteField = 'deletedAt',
    cascadeDepth = 5,
    parallel = false,
    onError,
  } = options;

  // Store cascade configuration
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (schema as any).cascadeRules = rules;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (schema as any).cascadeOptions = options;

  // Track cascade depth to prevent infinite loops
  const cascadeContext = new Map<string, number>();

  // Pre-remove hook for findOneAndDelete
  schema.pre('findOneAndDelete', async function () {
    const doc = await factoryService.findOne(this.model, this.getQuery());
    if (doc) {
      const session = useTransaction ? await mongoose.startSession() : null;
      try {
        if (session) {
          await session.withTransaction(async () => {
            await performCascadeOperations(doc, rules, {
              session,
              softDeleteField,
              cascadeDepth,
              cascadeContext,
              parallel,
              onError,
            });
          });
        } else {
          await performCascadeOperations(doc, rules, {
            softDeleteField,
            cascadeDepth,
            cascadeContext,
            parallel,
            onError,
          });
        }
      } finally {
        if (session) await session.endSession();
      }
    }
  });

  // Pre-remove hook for deleteOne
  schema.pre('deleteOne', async function () {
    const doc = await factoryService.findOne(this.model, this.getQuery());
    if (doc) {
      const session = useTransaction ? await mongoose.startSession() : null;
      try {
        if (session) {
          await session.withTransaction(async () => {
            await performCascadeOperations(doc, rules, {
              session,
              softDeleteField,
              cascadeDepth,
              cascadeContext,
              parallel,
              onError,
            });
          });
        } else {
          await performCascadeOperations(doc, rules, {
            softDeleteField,
            cascadeDepth,
            cascadeContext,
            parallel,
            onError,
          });
        }
      } finally {
        if (session) await session.endSession();
      }
    }
  });

  // Pre-deleteMany hook with batch processing
  schema.pre('deleteMany', async function () {
    const docs = await factoryService.findMany(this.model, this.getQuery());
    const session = useTransaction ? await mongoose.startSession() : null;

    try {
      if (session) {
        await session.withTransaction(async () => {
          for (const doc of docs) {
            await performCascadeOperations(doc, rules, {
              session,
              softDeleteField,
              cascadeDepth,
              cascadeContext,
              parallel,
              onError,
            });
          }
        });
      } else {
        for (const doc of docs) {
          await performCascadeOperations(doc, rules, {
            softDeleteField,
            cascadeDepth,
            cascadeContext,
            parallel,
            onError,
          });
        }
      }
    } finally {
      if (session) await session.endSession();
    }
  });

  // Instance method for manual cascade with transaction support
  schema.methods.cascadeDelete = async function (useTransactionOverride?: boolean) {
    const shouldUseTransaction =
      useTransactionOverride !== undefined ? useTransactionOverride : useTransaction;
    const session = shouldUseTransaction ? await mongoose.startSession() : null;

    try {
      if (session) {
        await session.withTransaction(async () => {
          await performCascadeOperations(this, rules, {
            session,
            softDeleteField,
            cascadeDepth,
            cascadeContext,
            parallel,
            onError,
          });
          await this.deleteOne({ session });
        });
      } else {
        await performCascadeOperations(this, rules, {
          softDeleteField,
          cascadeDepth,
          cascadeContext,
          parallel,
          onError,
        });
        await this.deleteOne();
      }
    } finally {
      if (session) await session.endSession();
    }
  };

  // Advanced method: Get cascade impact analysis
  schema.methods.getCascadeImpact = async function () {
    return analyzeCascadeImpact(this, rules);
  };

  // Advanced method: Dry run to see what would be affected
  schema.methods.cascadeDryRun = async function () {
    return performCascadeOperations(this, rules, {
      dryRun: true,
      softDeleteField,
      cascadeDepth,
      cascadeContext: new Map(),
      parallel,
      onError,
    });
  };
}

interface CascadeContext {
  session?: ClientSession;
  softDeleteField?: string;
  cascadeDepth?: number;
  cascadeContext?: Map<string, number>;
  parallel?: boolean;
  onError?: (error: Error, rule: CascadeRule) => void;
  dryRun?: boolean;
}

interface CascadeImpact {
  model: string;
  field: string;
  action: string;
  affectedCount: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  documents?: any[];
}

async function performCascadeOperations(
  doc: Document,
  rules: CascadeRule[],
  context: CascadeContext = {},
): Promise<CascadeImpact[]> {
  const {
    session,
    softDeleteField = 'deletedAt',
    cascadeDepth = 5,
    cascadeContext = new Map(),
    parallel = false,
    onError,
    dryRun = false,
  } = context;

  const impacts: CascadeImpact[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const docKey = `${(doc as any).constructor.modelName}:${doc._id}`;

  // Check cascade depth to prevent infinite loops
  const currentDepth = cascadeContext.get(docKey) || 0;
  if (currentDepth >= cascadeDepth) {
    console.warn(`Maximum cascade depth (${cascadeDepth}) reached for ${docKey}`);
    return impacts;
  }
  cascadeContext.set(docKey, currentDepth + 1);

  const executeRule = async (rule: CascadeRule) => {
    try {
      // Get the model from the document's connection instead of global mongoose
      const connection = (doc as any).db || mongoose.connection;
      const TargetModel = connection.model(rule.model);
      const batchSize = rule.batchSize || 1000;

      // Build query with optional conditions
      const baseQuery = { [rule.field]: doc._id };
      const query = rule.condition ? { ...baseQuery, ...rule.condition } : baseQuery;

      // Get related documents
      const relatedDocs = await factoryService.findMany(TargetModel, query, {
        session: session || undefined,
      });
      const relatedCount = relatedDocs.length;

      if (relatedCount === 0) {
        return;
      }

      // Execute before hook
      if (rule.beforeCascade) {
        await rule.beforeCascade(doc, relatedDocs);
      }

      const impact: CascadeImpact = {
        model: rule.model,
        field: rule.field,
        action: rule.action,
        affectedCount: relatedCount,
        documents: dryRun ? relatedDocs.map((d) => d._id) : undefined,
      };

      if (!dryRun) {
        switch (rule.action) {
          case 'delete':
            // Batch delete for performance
            if (relatedCount <= batchSize) {
              await factoryService.deleteMany(TargetModel, query);
            } else {
              // Process in batches
              for (let i = 0; i < relatedCount; i += batchSize) {
                const batch = relatedDocs.slice(i, i + batchSize);
                const ids = batch.map((d) => d._id);
                await factoryService.deleteMany(TargetModel, { _id: { $in: ids } });
              }
            }
            break;

          case 'soft-delete':
            // Soft delete: set deletedAt timestamp
            await factoryService.updateMany(TargetModel, query, {
              $set: { [softDeleteField]: new Date() },
            });
            break;

          case 'nullify':
            // Set the reference field to null
            await factoryService.updateMany(TargetModel, query, { $unset: { [rule.field]: 1 } });
            break;

          case 'restrict':
            // Check if any related documents exist and throw error if found
            if (relatedCount > 0) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const modelName = (doc as any).constructor.modelName || 'Document';
              throw new AppError(
                `Cannot delete ${modelName} because it is referenced by ${relatedCount} ${rule.model}(s). ` +
                  `Please delete the related ${rule.model}(s) first.`,
                HttpStatus.BAD_REQUEST,
              );
            }
            break;
        }

        // Execute after hook
        if (rule.afterCascade) {
          await rule.afterCascade(doc, relatedDocs);
        }
      }

      impacts.push(impact);
    } catch (error) {
      // If it's our custom restriction error, re-throw it
      if (error instanceof AppError && error.message.includes('Cannot delete')) {
        throw error;
      }

      // Handle errors
      if (onError) {
        onError(error as Error, rule);
      } else {
        console.warn(`Cascade operation failed for rule ${JSON.stringify(rule)}:`, error);
      }
    }
  };

  // Execute rules in parallel or sequentially
  if (parallel) {
    await Promise.all(rules.map((rule) => executeRule(rule)));
  } else {
    for (const rule of rules) {
      await executeRule(rule);
    }
  }

  // Clean up cascade context
  cascadeContext.delete(docKey);

  return impacts;
}

async function analyzeCascadeImpact(
  doc: Document,
  rules: CascadeRule[],
): Promise<{
  totalAffected: number;
  impacts: CascadeImpact[];
  estimatedTime: number;
}> {
  const startTime = Date.now();
  const impacts: CascadeImpact[] = [];
  let totalAffected = 0;

  for (const rule of rules) {
    try {
      // Get the model from the document's connection instead of global mongoose
      const connection = (doc as any).db || mongoose.connection;
      const TargetModel = connection.model(rule.model);
      const query = rule.condition
        ? { [rule.field]: doc._id, ...rule.condition }
        : { [rule.field]: doc._id };

      const count = await factoryService.countDocuments(TargetModel, query);

      if (count > 0) {
        impacts.push({
          model: rule.model,
          field: rule.field,
          action: rule.action,
          affectedCount: count,
        });
        totalAffected += count;
      }
    } catch (error) {
      console.warn(`Failed to analyze impact for ${rule.model}:`, error);
    }
  }

  const estimatedTime = Date.now() - startTime;

  return {
    totalAffected,
    impacts,
    estimatedTime,
  };
}

// Helper function to get cascade rules from a model
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getCascadeRules(model: Model<any>): CascadeRule[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (model.schema as any).cascadeRules || [];
}

// Helper function to check if a model has cascade rules
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function hasCascadeRules(model: Model<any>): boolean {
  const rules = getCascadeRules(model);
  return rules.length > 0;
}

export default cascadePlugin;
export type { CascadeRule, CascadeOptions };
