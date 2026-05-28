/**
 * Winston Logger Utility
 * Centralized logging for production and development environments
 */
import winston from 'winston';
export declare const logger: winston.Logger;
export declare const logInfo: (message: string, meta?: Record<string, unknown>) => winston.Logger;
export declare const logWarn: (message: string, meta?: Record<string, unknown>) => winston.Logger;
export declare const logError: (message: string, meta?: Record<string, unknown>) => winston.Logger;
export declare const logDebug: (message: string, meta?: Record<string, unknown>) => winston.Logger;
//# sourceMappingURL=logger.d.ts.map