const logFuncs = ['info', 'error', 'debug'];

let _logger = console;
let _debug = false;

exports.setLog = (logger, debug) => {
  _logger = logger;
  _debug = debug;
  for (let index = 0; index < logFuncs.length; index++) {
    if (!_logger[logFuncs[index]]) {
      throw new Error('dubbo log must init with object contains function named [info,error,debug].' +
        'logger does not contain function ' +
        logFuncs[index]);
    }
  }
};

exports.info = (message) => {
  _logger.log(message);
};

exports.error = (message) => {
  _logger.log(message);
};

exports.debug = (message) => {
  if (_debug) {
    _logger.log(message);
  }
};
