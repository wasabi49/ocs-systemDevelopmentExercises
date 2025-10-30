import { writeLog, type LogLevel, type LogData } from '@/app/actions/logActions';

class Logger {
  private isServer: boolean;

  constructor() {
    this.isServer = typeof window === 'undefined';
  }

  private logToConsole(level: LogLevel, message: string, data?: LogData) {
    // クライアントサイドでのコンソール出力（開発環境のみ）
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
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
  }

  private async log(level: LogLevel, message: string, data?: LogData) {
    // クライアントサイドでもコンソール出力
    this.logToConsole(level, message, data);

    // サーバーサイドまたはServer Action経由でファイルに書き込み
    if (this.isServer) {
      // サーバーコンポーネントから直接呼ばれた場合
      await writeLog(level, message, data);
    } else {
      // クライアントコンポーネントから呼ばれた場合
      // Server Actionを非同期で実行（エラーは無視）
      writeLog(level, message, data).catch(() => {
        // ログ書き込みエラーは無視
      });
    }
  }

  info(message: string, data?: LogData) {
    this.log('info', message, data);
  }

  warn(message: string, data?: LogData) {
    this.log('warn', message, data);
  }

  error(message: string, data?: LogData) {
    this.log('error', message, data);
  }

  debug(message: string, data?: LogData) {
    this.log('debug', message, data);
  }
}

export const logger = new Logger();
