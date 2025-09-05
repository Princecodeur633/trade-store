// src/utils/logger.ts
import fs from 'fs';
import path from 'path';

type Meta = Record<string, any>;

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

class Logger {
  static log(level: 'info' | 'error' | 'warn' | 'debug', message: string, meta: Meta = {}): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...meta
    };

    // Console output
    console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`, meta);

    // File output
    const logFile = path.join(logsDir, `${level}.log`);
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
  }

  static info(message: string, meta: Meta = {}): void {
    this.log('info', message, meta);
  }

  static error(message: string, meta: Meta = {}): void {
    this.log('error', message, meta);
  }

  static warn(message: string, meta: Meta = {}): void {
    this.log('warn', message, meta);
  }

  static debug(message: string, meta: Meta = {}): void {
    if (process.env.NODE_ENV === 'development') {
      this.log('debug', message, meta);
    }
  }
}

export default Logger;
