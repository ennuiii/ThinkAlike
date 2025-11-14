// Simple logger that can be disabled for performance
const DEBUG = false; // Set to true to enable debug logging

export const logger = {
  log: (...args: any[]) => {
    if (DEBUG) console.log(...args);
  },
  error: (...args: any[]) => {
    if (DEBUG) console.error(...args);
  },
  warn: (...args: any[]) => {
    if (DEBUG) console.warn(...args);
  },
  info: (...args: any[]) => {
    if (DEBUG) console.info(...args);
  }
};