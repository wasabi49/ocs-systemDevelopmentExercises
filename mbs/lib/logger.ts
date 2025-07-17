type LogLevel = 'info' | 'warn' | 'error' | 'debug';

// ログデータの型定義
type LogData = Record<string, unknown> | string | number | boolean | null | undefined;

class Logger {
  private isServer: boolean;

  constructor() {
    this.isServer = typeof window === 'undefined';
  }

  private async writeLogToFile(level: LogLevel, message: string, data?: LogData) {
    if (!this.isServer || typeof window !== 'undefined' || typeof process === 'undefined') return;

    try {
      const fs = await import('fs');
      const path = await import('path');
      const { writeFileSync, existsSync, mkdirSync } = fs;
      const { join } = path;

      const logDir = join(process.cwd(), 'logs');

      if (!existsSync(logDir)) {
        mkdirSync(logDir, { recursive: true });
      }

      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const logFileName = `${year}${month}${day}.log`;
      const logFilePath = join(logDir, logFileName);

      const timestamp = new Date().toISOString();
      const logEntry = {
        timestamp,
        level,
        message,
        ...(data && { data }),
      };

      const logLine = JSON.stringify(logEntry) + '\n';
      writeFileSync(logFilePath, logLine, { flag: 'a' });
    } catch (error) {
      console.error('Failed to write log:', error);
    }
  }

  private logToConsole(level: LogLevel, message: string, data?: LogData) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;

    switch (level) {
      case 'error':
        console.error(logMessage, data || '');
        break;
      case 'warn':
        console.warn(logMessage, data || '');
        break;
      case 'debug':
        console.debug(logMessage, data || '');
        break;
      default:
        console.log(logMessage, data || '');
    }
  }

  private async writeLog(level: LogLevel, message: string, data?: LogData) {
    // サーバーサイドではファイルに書き込み
    if (this.isServer && typeof window === 'undefined' && typeof process !== 'undefined') {
      await this.writeLogToFile(level, message, data);
    }

    // 開発環境ではコンソールにも出力
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
      this.logToConsole(level, message, data);
    }
  }

  info(message: string, data?: LogData) {
    this.writeLog('info', message, data);
  }

  warn(message: string, data?: LogData) {
    this.writeLog('warn', message, data);
  }

  error(message: string, data?: LogData) {
    this.writeLog('error', message, data);
  }

  debug(message: string, data?: LogData) {
    this.writeLog('debug', message, data);
  }
}

export const logger = new Logger();
