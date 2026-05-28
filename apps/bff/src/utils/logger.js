/**
 * Winston Logger Utility
 * Centralized logging for production and development environments
 */
import winston from 'winston';
const { combine, timestamp, errors, json, printf, colorize } = winston.format;
// Custom format for development
const devFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
        msg += ` ${JSON.stringify(metadata)}`;
    }
    if (stack) {
        msg += `\n${stack}`;
    }
    return msg;
});
// Create the logger instance
export const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    defaultMeta: {
        service: 'mineecho-bff',
    },
    transports: [
        new winston.transports.Console({
            format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), process.env.NODE_ENV === 'production' ? json() : combine(colorize(), devFormat)),
        }),
    ],
});
// Export convenience methods
export const logInfo = (message, meta) => logger.info(message, meta);
export const logWarn = (message, meta) => logger.warn(message, meta);
export const logError = (message, meta) => logger.error(message, meta);
export const logDebug = (message, meta) => logger.debug(message, meta);
//# sourceMappingURL=logger.js.map