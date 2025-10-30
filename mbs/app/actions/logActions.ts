'use server';

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';
export type LogData = Record<string, unknown> | string | number | boolean | null | undefined;

export async function writeLog(level: LogLevel, message: string, data?: LogData) {
  try {
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

    // 開発環境ではコンソールにも出力
    if (process.env.NODE_ENV === 'development') {
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

    return { success: true };
  } catch (error) {
    console.error('Failed to write log:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}