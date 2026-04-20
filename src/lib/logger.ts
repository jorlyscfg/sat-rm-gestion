type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

class Logger {
  private isDev = process.env.NODE_ENV === 'development';

  private formatMessage(level: LogLevel, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}]`;
    return { prefix, message, data };
  }

  debug(message: string, data?: any) {
    if (!this.isDev) return;
    const { prefix, message: msg, data: d } = this.formatMessage('DEBUG', message, data);
    console.debug(prefix, msg, d !== undefined ? d : '');
  }

  info(message: string, data?: any) {
    if (!this.isDev) return;
    const { prefix, message: msg, data: d } = this.formatMessage('INFO', message, data);
    console.info(prefix, msg, d !== undefined ? d : '');
  }

  warn(message: string, data?: any) {
    if (!this.isDev) return;
    const { prefix, message: msg, data: d } = this.formatMessage('WARN', message, data);
    console.warn(prefix, msg, d !== undefined ? d : '');
  }

  error(message: string, data?: any) {
    // We might want to log errors even in production in a real app,
    // but for now let's keep it dev-focused or as per requirements.
    const { prefix, message: msg, data: d } = this.formatMessage('ERROR', message, data);
    console.error(prefix, msg, d !== undefined ? d : '');
  }
}

export const logger = new Logger();
