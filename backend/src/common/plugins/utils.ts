import mongoose, { Model } from 'mongoose';
import { HttpStatus } from '@nestjs/common';
import { AppError } from '../errors/app-error';
import { FactoryService } from '@shared/services/factory.service';
import { getCascadeRules, hasCascadeRules, CascadeRule } from './cascade.plugin';
import {
  getDependencyRules,
  hasDependencyRules,
  checkDocumentDependencies,
  DependencyRule,
  DependencyValidationResult,
} from './dependency.plugin';

/**
 * Plugin Configuration Builder
 * Helps configure multiple plugins for a model with related dependencies
 */
export class PluginConfigBuilder {
  private cascadeRules: CascadeRule[] = [];
  private dependencyRules: DependencyRule[] = [];

  /**
   * Add a cascade rule
   */
  addCascadeRule(model: string, field: string, action: 'delete' | 'nullify' | 'restrict'): this {
    this.cascadeRules.push({ model, field, action });
    return this;
  }

  /**
   * Add a dependency rule
   */
  addDependencyRule(model: string, field: string, customMessage?: string): this {
    this.dependencyRules.push({ model, field, customMessage });
    return this;
  }

  /**
   * Get cascade plugin configuration
   */
  getCascadeConfig() {
    return { rules: this.cascadeRules };
  }

  /**
   * Get dependency plugin configuration
   */
  getDependencyConfig() {
    return { rules: this.dependencyRules };
  }

  /**
   * Clear all rules
   */
  clear(): this {
    this.cascadeRules = [];
    this.dependencyRules = [];
    return this;
  }
}

/**
 * Model Relationship Manager
 * Provides utilities for managing model relationships and dependencies
 */
export class ModelRelationshipManager {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private models: Map<string, Model<any>> = new Map();
  /** Plugin helper — Nest DI unavailable in Mongoose plugin context */
  private documentDao = new FactoryService();

  constructor() {
    this.discoverModels();
  }

  /**
   * Discover all registered Mongoose models
   */
  private discoverModels(): void {
    const modelNames = mongoose.modelNames();
    for (const modelName of modelNames) {
      try {
        const model = mongoose.model(modelName);
        this.models.set(modelName, model);
      } catch (error) {
        console.warn(`Could not load model ${modelName}:`, error);
      }
    }
  }

  /**
   * Get all models with cascade rules
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getModelsWithCascadeRules(): Array<{ name: string; model: Model<any>; rules: CascadeRule[] }> {
    const result = [];
    for (const [name, model] of this.models) {
      if (hasCascadeRules(model)) {
        result.push({
          name,
          model,
          rules: getCascadeRules(model),
        });
      }
    }
    return result;
  }

  /**
   * Get all models with dependency rules
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getModelsWithDependencyRules(): Array<{
    name: string;
    model: Model<any>;
    rules: DependencyRule[];
  }> {
    const result = [];
    for (const [name, model] of this.models) {
      if (hasDependencyRules(model)) {
        result.push({
          name,
          model,
          rules: getDependencyRules(model),
        });
      }
    }
    return result;
  }

  /**
   * Check if a document can be safely deleted across all relationships
   */
  async canSafelyDelete(
    modelName: string,
    documentId: string,
  ): Promise<DependencyValidationResult> {
    try {
      const model = this.models.get(modelName);
      if (!model) {
        throw new AppError(`Model ${modelName} not found`, HttpStatus.NOT_FOUND);
      }

      const doc = await this.documentDao.findById(model, documentId);
      if (!doc) {
        throw new AppError(
          `Document with ID ${documentId} not found in ${modelName}`,
          HttpStatus.NOT_FOUND,
        );
      }

      // Check if the model has dependency rules
      if (hasDependencyRules(model)) {
        const rules = getDependencyRules(model);
        return await checkDocumentDependencies(doc, rules);
      }

      // If no dependency rules, it can be deleted
      return {
        canDelete: true,
        dependencies: [],
        warnings: [],
        errors: [],
      };
    } catch (error) {
      return {
        canDelete: false,
        dependencies: [
          {
            model: 'Error',
            field: 'unknown',
            count: 0,
            message: error instanceof AppError ? error.message : 'Unknown error occurred',
            severity: 'error' as const,
          },
        ],
        warnings: [],
        errors: [error instanceof AppError ? error.message : 'Unknown error occurred'],
      };
    }
  }

  /**
   * Get relationship graph for a model
   */
  getRelationshipGraph(modelName: string): {
    incoming: Array<{ from: string; field: string; type: 'cascade' | 'dependency' }>;
    outgoing: Array<{ to: string; field: string; type: 'cascade' | 'dependency' }>;
  } {
    const result = {
      incoming: [] as Array<{ from: string; field: string; type: 'cascade' | 'dependency' }>,
      outgoing: [] as Array<{ to: string; field: string; type: 'cascade' | 'dependency' }>,
    };

    // Find incoming relationships (other models that reference this model)
    for (const [name, model] of this.models) {
      if (name === modelName) continue;

      // Check cascade rules
      const cascadeRules = getCascadeRules(model);
      for (const rule of cascadeRules) {
        if (rule.model === modelName) {
          result.incoming.push({
            from: name,
            field: rule.field,
            type: 'cascade',
          });
        }
      }

      // Check dependency rules
      const dependencyRules = getDependencyRules(model);
      for (const rule of dependencyRules) {
        if (rule.model === modelName) {
          result.incoming.push({
            from: name,
            field: rule.field,
            type: 'dependency',
          });
        }
      }
    }

    // Find outgoing relationships (this model references other models)
    const model = this.models.get(modelName);
    if (model) {
      const cascadeRules = getCascadeRules(model);
      for (const rule of cascadeRules) {
        result.outgoing.push({
          to: rule.model,
          field: rule.field,
          type: 'cascade',
        });
      }

      const dependencyRules = getDependencyRules(model);
      for (const rule of dependencyRules) {
        result.outgoing.push({
          to: rule.model,
          field: rule.field,
          type: 'dependency',
        });
      }
    }

    return result;
  }
}

// Singleton instance
export const relationshipManager = new ModelRelationshipManager();
