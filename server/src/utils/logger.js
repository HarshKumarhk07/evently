/* Minimal colored logger — no dependency, works in any terminal. */
const colors = {
  reset: '\x1b[0m',
  gray: '\x1b[90m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function stamp() {
  return new Date().toISOString().split('T')[1].replace('Z', '');
}

function log(color, label, msg) {
  console.log(`${colors.gray}${stamp()}${colors.reset} ${color}${label}${colors.reset} ${msg}`);
}

const logger = {
  info: (msg) => log(colors.cyan, 'INFO ', msg),
  success: (msg) => log(colors.green, 'OK   ', msg),
  warn: (msg) => log(colors.yellow, 'WARN ', msg),
  error: (msg) => log(colors.red, 'ERROR', msg),
};

export default logger;
