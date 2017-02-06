const getLocalIp = require('../../utils/getLocalIp');
const deepExtend = require('../../utils/deepExtend');
const deepFreeze = require('../../utils/deepFreeze');
const Check = require('./check');

const OPTIONS = Symbol('options');

class Config {
  constructor() {
    this.ip = getLocalIp();
  }

  setOptions(options) {
    let _options = Check(deepExtend({
      description: {
        server: 'express',
      },
      registry: {
        options: {
          sessionTimeout: 30 * 1000,
          spinDelay: 1000,
          retries: 0,
        },
      },
      debug: false,
    }, options));

    this[OPTIONS] = deepFreeze(_options);
  }

  getPort() {
    return this[OPTIONS].port;
  }

  getOptions() {
    return this[OPTIONS];
  }

  getRegistry() {
    return this[OPTIONS].registry;
  }

  getDescription() {
    return this[OPTIONS].description;
  }
}

module.exports = new Config();
