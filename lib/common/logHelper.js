const debug = require('debug');

const LOGGER = Symbol('LOGGER');

class LogHelper {
  constructor() {
    this[LOGGER] = null;
  }

  /**
   * custom log function
   * @param {function} logger
   */
  setLogger(logger) {
    if (typeof logger !== 'function') {
      throw new Error('logger should be a function.');
    }

    this[LOGGER] = logger;
  }

  /**
   * get categorize log function
   * @param category
   * @return {function(...[string])}
   */
  getLogger(category) {
    /**
     * @param {string} msg
     * @return {void}
     */
    return (...msg) => {
      if (this[LOGGER]) {
        this[LOGGER](`[${category}] ${msg.join(' ')}`);
      } else {
        debug(category)(msg.join(' '));
      }
    };
  }
}

module.exports = new LogHelper();
