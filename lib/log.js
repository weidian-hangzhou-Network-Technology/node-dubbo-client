let logger = console;

exports.setLog = (_logger) => {
  logger = _logger;
};

exports.info = (message) => {
  logger.log(message);
};

exports.error = (message) => {
  logger.log(message);
};

exports.debug = (message) => {
  logger.log(message);
};
