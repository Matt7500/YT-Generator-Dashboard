const winston = require('winston');
const path = require('path');

// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

// Define colors for each level
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};

// Tell winston about our colors
winston.addColors(colors);

// Define the format for our logs
const format = winston.format.combine(
    // Add timestamp
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    // Add colors
    winston.format.colorize({ all: true }),
    // Define the format of the message showing the timestamp, the level and the message
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}${info.splat !== undefined ? `${info.splat}` : ''} ${info.metadata ? JSON.stringify(info.metadata) : ''}`
    )
);

// Define which transports the logger must use to print out messages
const transports = [
    // Console transport
    new winston.transports.Console(),
    // File transport for all logs
    new winston.transports.File({
        filename: path.join(__dirname, '../../../logs/all.log'),
    }),
    // File transport for error logs
    new winston.transports.File({
        filename: path.join(__dirname, '../../../logs/error.log'),
        level: 'error',
    }),
];

// Create the logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'debug',
    levels,
    format,
    transports,
});

module.exports = logger; 