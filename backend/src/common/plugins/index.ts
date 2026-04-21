// Plugin exports
export { default as cascadePlugin, getCascadeRules, hasCascadeRules } from './cascade.plugin';
export type { CascadeRule, CascadeOptions } from './cascade.plugin';

export {
  default as dependencyPlugin,
  getDependencyRules,
  hasDependencyRules,
  checkDocumentDependencies,
} from './dependency.plugin';
export type {
  DependencyRule,
  DependencyOptions,
  DependencyValidationResult,
} from './dependency.plugin';

// Utility functions and classes
export { PluginConfigBuilder, ModelRelationshipManager, relationshipManager } from './utils';
