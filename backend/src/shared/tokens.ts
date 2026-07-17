/**
 * Nest injection tokens for ports (DIP).
 * Interfaces erase at compile time — use these symbols for @Inject().
 */
export const STORAGE_SERVICE = Symbol('STORAGE_SERVICE');
export const EMAIL_TRANSPORTS = Symbol('EMAIL_TRANSPORTS');
