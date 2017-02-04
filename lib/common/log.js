const logFuncs = ['info', 'error', 'debug'];

const LOG = Symbol('LOG');
const DEBUG = Symbol('DEBUG');

class Log {
  constructor() {
    this[LOG] = console;
    this[DEBUG] = false;
  }

  setLog(logger, debug = false) {
    for (let index = 0; index < logFuncs.length; index++) {
      if (!logger[logFuncs[index]]) {
        throw new Error('dubbo log must init with object contains function named [info,error,debug].' +
          'logger does not contain function ' +
          logFuncs[index]);
      }
    }

    this[LOG] = logger;
    this[DEBUG] = debug;
  }

  info(...args) {
    this[LOG].info(...args);
  }

  error(...args) {
    this[LOG].error(...args);
  }

  debug(...args) {
    if (this[DEBUG]) {
      this[LOG].debug(...args);
    }
  }
}

module.exports = Log;
