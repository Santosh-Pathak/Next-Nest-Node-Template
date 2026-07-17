import mongoose, { Schema, Document, Model, ClientSession } from 'mongoose';
import { HttpStatus } from '@nestjs/common';
import { AppError } from '../errors/app-error';
import { FactoryService } from '@shared/services/factory.service';

/**
 * Mongoose plugins cannot use Nest DI.
 * Shared DocumentDao instance is intentional for plugin hooks only.
 */
const factoryService = new FactoryService();

interface DependencyRule {
  model: string;
  field: string;
  customMessage?: string;
  condition?: Record<string, unknown>; // Additional conditions (e.g., only check active records)
  allowIfSoftDeleted?: boolean; // Allow deletion if dependent docs are soft-deleted
  severity?: 'error' | 'warning'; // Error blocks deletion, warning just notifies
  countOnly?: boolean; // Only count, don't fetch documents (performance)
}

interface DependencyOptions {
  rules: DependencyRule[];
  throwOnDelete?: boolean;
  useTransaction?: boolean;
  softDeleteField?: string;
  cacheTimeout?: number; // Cache validation results (ms)
  onValidation?: (result: DependencyValidationResult) => void;
}

interface DependencyValidationResult {
  canDelete: boolean;
  dependencies: Array<{
    model: string;
    field: string;
    count: number;
    message: string;
    severity: 'error' | 'warning';
    sampleIds?: string[]; // Sample IDs of dependent documents
  }>;
  warnings: string[];
  errors: string[];
}

type DependencyInfo = DependencyValidationResult['dependencies'][number];

/**
 * Advanced Dependency Checking Plugin
 *
 * Enhanced features:
 * - Transaction support
 * - Soft delete awareness
 * - Warning vs Error severity levels
 * - Conditional dependency checks
 * - Performance optimizations with caching
 * - Batch validation
 * - Sample document references
 *
 * Usage:
 * schema.plugin(dependencyPlugin, {
 *   rules: [
 *     { model: 'Product', field: 'provider', severity: 'error' },
 *     { model: 'Contract', field: 'provider', condition: { status: 'active' } },
 *     { model: 'Review', field: 'provider', severity: 'warning', allowIfSoftDeleted: true }
 *   ],
 *   throwOnDelete: true,
 *   useTransaction: true,
 *   softDeleteField: 'deletedAt',
 *   cacheTimeout: 5000
 * });
 */
function dependencyPlugin<T extends Document>(schema: Schema<T>, options: DependencyOptions) {
  const {
    rules,
    throwOnDelete = true,
    useTransaction = false,
    softDeleteField = 'deletedAt',
    cacheTimeout = 0,
    onValidation,
  } = options;

  // Store dependency rules in a custom property
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (schema as any).dependencyRules = rules;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (schema as any).dependencyOptions = options;

  // Cache for validation results
  const validationCache = new Map<
    string,
    { result: DependencyValidationResult; timestamp: number }
  >();

  const checkWithCache = async (doc: Document, session?: ClientSession) => {
    const cacheKey = `${doc._id}`;

    if (cacheTimeout > 0) {
      const cached = validationCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cacheTimeout) {
        return cached.result;
      }
    }

    const result = await checkDependencies(doc, rules, false, {
      session,
      softDeleteField,
      onValidation,
    });

    if (cacheTimeout > 0) {
      validationCache.set(cacheKey, { result, timestamp: Date.now() });
    }

    return result;
  };

  // Pre-remove hook for findOneAndDelete
  schema.pre('findOneAndDelete', async function () {
    if (!throwOnDelete) return;

    const doc = await factoryService.findOne(this.model, this.getQuery());
    if (doc) {
      await checkDependencies(doc, rules, true, {
        softDeleteField,
        onValidation,
      });
    }
  });

  // Pre-remove hook for deleteOne
  schema.pre('deleteOne', async function () {
    if (!throwOnDelete) return;

    const doc = await factoryService.findOne(this.model, this.getQuery());
    if (doc) {
      await checkDependencies(doc, rules, true, {
        softDeleteField,
        onValidation,
      });
    }
  });

  // Pre-deleteMany hook
  schema.pre('deleteMany', async function () {
    if (!throwOnDelete) return;

    const docs = await factoryService.findMany(this.model, this.getQuery());

    for (const doc of docs) {
      await checkDependencies(doc, rules, true, {
        softDeleteField,
        onValidation,
      });
    }
  });

  // Instance method for checking dependencies without throwing
  schema.methods.checkDependencies = async function (
    useSession?: boolean,
  ): Promise<DependencyValidationResult> {
    const session = useSession && useTransaction ? await mongoose.startSession() : undefined;
    try {
      return await checkWithCache(this, session);
    } finally {
      if (session) await session.endSession();
    }
  };

  // Instance method for getting detailed dependency information
  schema.methods.getDependencyDetails = async function (): Promise<{
    canDelete: boolean;
    summary: string;
    details: Array<{ model: string; count: number; message: string; severity: string }>;
    warnings: string[];
    errors: string[];
  }> {
    const validation = await this.checkDependencies();

    if (validation.canDelete) {
      return {
        canDelete: true,
        summary: 'Item can be safely deleted',
        details: [],
        warnings: validation.warnings,
        errors: [],
      };
    }

    const errorDeps = validation.dependencies.filter((d: DependencyInfo) => d.severity === 'error');
    const totalCount = errorDeps.reduce((sum: number, dep: DependencyInfo) => sum + dep.count, 0);
    const modelTypes = [...new Set(errorDeps.map((dep: DependencyInfo) => dep.model))];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const modelName = (this as any).constructor.modelName || 'Item';

    return {
      canDelete: false,
      summary: `Cannot delete ${modelName}. Referenced by ${totalCount} record(s) in ${modelTypes.join(', ')}`,
      details: validation.dependencies.map((dep: DependencyInfo) => ({
        model: dep.model,
        count: dep.count,
        message: dep.message,
        severity: dep.severity,
      })),
      warnings: validation.warnings,
      errors: validation.errors,
    };
  };

  // Instance method for safe delete with dependency check
  schema.methods.safeDelete = async function (force: boolean = false): Promise<{
    success: boolean;
    message?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dependencies?: any;
    warnings?: string[];
  }> {
    const session = useTransaction ? await mongoose.startSession() : undefined;

    try {
      const validation = await checkDependencies(this, rules, false, {
        session,
        softDeleteField,
        onValidation,
      });

      if (!validation.canDelete && !force) {
        return {
          success: false,
          message: 'Cannot delete due to dependencies',
          dependencies: validation.dependencies,
          warnings: validation.warnings,
        };
      }

      if (session) {
        await session.withTransaction(async () => {
          await this.deleteOne({ session });
        });
      } else {
        await this.deleteOne();
      }

      return {
        success: true,
        warnings: validation.warnings.length > 0 ? validation.warnings : undefined,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof AppError ? error.message : 'Unknown error occurred',
      };
    } finally {
      if (session) await session.endSession();
    }
  };

  // Batch validation method
  schema.statics.validateBatchDelete = async function (ids: string[]): Promise<{
    canDeleteAll: boolean;
    results: Map<string, DependencyValidationResult>;
    summary: { canDelete: number; blocked: number; warnings: number };
  }> {
    const results = new Map<string, DependencyValidationResult>();
    let canDelete = 0;
    let blocked = 0;
    let warnings = 0;

    const session = useTransaction ? await mongoose.startSession() : undefined;

    try {
      const docs = await this.find({ _id: { $in: ids } }).session(session || null);

      for (const doc of docs) {
        const validation = await checkDependencies(doc, rules, false, {
          session,
          softDeleteField,
          onValidation,
        });
        results.set(doc._id.toString(), validation);

        if (validation.canDelete) {
          canDelete++;
        } else {
          blocked++;
        }

        if (validation.warnings.length > 0) {
          warnings++;
        }
      }

      return {
        canDeleteAll: blocked === 0,
        results,
        summary: { canDelete, blocked, warnings },
      };
    } finally {
      if (session) await session.endSession();
    }
  };

  // Clear validation cache
  schema.methods.clearDependencyCache = function () {
    validationCache.delete(`${this._id}`);
  };

  schema.statics.clearAllDependencyCache = function () {
    validationCache.clear();
  };
}

interface DependencyCheckContext {
  session?: ClientSession;
  softDeleteField?: string;
  onValidation?: (result: DependencyValidationResult) => void;
}

async function checkDependencies(
  doc: Document,
  rules: DependencyRule[],
  shouldThrow: boolean,
  context: DependencyCheckContext = {},
): Promise<DependencyValidationResult> {
  const { softDeleteField = 'deletedAt', onValidation } = context;
  const dependencies: DependencyValidationResult['dependencies'] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  for (const rule of rules) {
    try {
      // Get the model from the document's connection instead of global mongoose
      const connection = (doc as any).db || mongoose.connection;
      const TargetModel = connection.model(rule.model);
      const severity = rule.severity || 'error';

      // Build base query
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query: any = { [rule.field]: doc._id };

      // Add additional conditions
      if (rule.condition) {
        query = { ...query, ...rule.condition };
      }

      // Handle soft delete awareness
      if (rule.allowIfSoftDeleted && softDeleteField) {
        query[softDeleteField] = { $exists: false };
      }

      // Count or fetch depending on countOnly flag
      let count: number;
      let sampleIds: string[] | undefined;

      if (rule.countOnly) {
        count = await factoryService.countDocuments(TargetModel, query);
      } else {
        const docs = await factoryService.findMany(TargetModel, query, {
          select: '_id',
          limit: 10,
        });
        count = docs.length;

        // If we got 10, there might be more - do a count
        if (count === 10) {
          count = await factoryService.countDocuments(TargetModel, query);
        }

        sampleIds = docs.slice(0, 5).map((d) => d._id.toString());
      }

      if (count > 0) {
        const modelName = (doc as any).constructor.modelName || 'Document';
        const defaultMessage =
          rule.customMessage || `${modelName} is referenced by ${count} ${rule.model}(s)`;

        const dependency = {
          model: rule.model,
          field: rule.field,
          count,
          message: defaultMessage,
          severity,
          sampleIds,
        };

        dependencies.push(dependency);

        if (severity === 'error') {
          errors.push(defaultMessage);
        } else {
          warnings.push(defaultMessage);
        }
      }
    } catch (error) {
      // If model doesn't exist, log warning and continue
      const errorMsg = `Dependency check failed for rule ${JSON.stringify(rule)}: ${error}`;
      console.warn(errorMsg);
      warnings.push(errorMsg);
    }
  }

  // Only error-level dependencies block deletion
  const errorDependencies = dependencies.filter((d) => d.severity === 'error');
  const canDelete = errorDependencies.length === 0;

  const result: DependencyValidationResult = {
    canDelete,
    dependencies,
    warnings,
    errors,
  };

  // Call validation callback
  if (onValidation) {
    onValidation(result);
  }

  if (!canDelete && shouldThrow) {
    // Create a more structured error message
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const modelName = (doc as any).constructor.modelName || 'Item';
    const dependencyCount = errorDependencies.reduce((sum, dep) => sum + dep.count, 0);
    const modelTypes = [...new Set(errorDependencies.map((dep) => dep.model))];

    let errorMessage;
    if (modelTypes.length === 1) {
      errorMessage = `Cannot delete ${modelName}. It is referenced by ${dependencyCount} ${modelTypes[0]}(s). Please remove the references first.`;
    } else {
      const modelList = modelTypes.join(', ');
      errorMessage = `Cannot delete ${modelName}. It is referenced by ${dependencyCount} record(s) across these models: ${modelList}. Please remove the references first.`;
    }

    // Include sample IDs in error for debugging
    const samplesInfo = errorDependencies
      .filter((d) => d.sampleIds && d.sampleIds.length > 0)
      .map((d) => `${d.model}: [${d.sampleIds!.join(', ')}]`)
      .join('; ');

    if (samplesInfo) {
      errorMessage += ` Sample references: ${samplesInfo}`;
    }

    throw new AppError(errorMessage, HttpStatus.BAD_REQUEST);
  }

  return result;
}

// Helper function to get dependency rules from a model
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getDependencyRules(model: Model<any>): DependencyRule[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (model.schema as any).dependencyRules || [];
}

// Helper function to check if a model has dependency rules
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function hasDependencyRules(model: Model<any>): boolean {
  const rules = getDependencyRules(model);
  return rules.length > 0;
}

// Helper function to manually check dependencies for any document
export async function checkDocumentDependencies(
  doc: Document,
  rules: DependencyRule[],
): Promise<DependencyValidationResult> {
  return checkDependencies(doc, rules, false);
}

export default dependencyPlugin;
export type { DependencyRule, DependencyOptions, DependencyValidationResult };
