/* eslint-disable no-underscore-dangle */
const debug = require('debug');

class LogHelper {
  constructor() {
    this._logger = null;
  }

  /**
   * custom log function
   * @param {function} calbak
   */
  setLogger(calbak) {
    if (typeof calbak !== 'function') {
      throw new Error('logger should be a function.');
    }

    this._logger = calbak;
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
      if (this._logger) {
        this._logger(`[${category}] ${msg.join(' ')}`);
      } else {
        debug(category)(msg.join(' '));
      }
    };
  }
}

module.exports = new LogHelper();
