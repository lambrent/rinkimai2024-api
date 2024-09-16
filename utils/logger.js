const { format, createLogger, transports } = require('winston');
// const { LoggingWinston } = require('@google-cloud/logging-winston');

const MESSAGE = Symbol.for('message');

// const loggingWinston = new LoggingWinston({ projectId: 'rinkimai2023' });

const jsonFormatter = (logEntry) => {
  const base = { timestamp: new Date() };
  const json = Object.assign(base, logEntry)
  logEntry[MESSAGE] = JSON.stringify(json);
  return logEntry;
}

// Create a Winston logger that streams to Cloud Logging
// Logs will be written to: "projects/YOUR_PROJECT_ID/logs/winston_log"
const logger = createLogger({
  level: 'info',
  format: format(jsonFormatter)(),
  transports: [
    new transports.Console(),
    // Add Cloud Logging
    // loggingWinston,
  ],
});

exports.logger = logger;

//logger.info('message content', { "context": "index.js", "metric": 1 })