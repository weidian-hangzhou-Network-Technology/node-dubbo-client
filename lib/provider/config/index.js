const getLocalIp = require('../../utils/getLocalIp');
const deepExtend = require('../../utils/deepExtend');
const deepFreeze = require('../../utils/deepFreeze');
const configCheck = require('../../common/configCheck');
const schema = require('./schema.json');

const OPTIONS = Symbol('options');

class Config {
  constructor() {
    this.ip = getLocalIp();
  }

  setOptions(options) {
    const opts = configCheck(deepExtend({
      description: {
        server: 'express',
        side: 'provider',
        category: 'providers',
      },
      registry: {
        options: {
          sessionTimeout: 30 * 1000,
          spinDelay: 1000,
          retries: 0,
        },
      },
      debug: false,
    }, options), schema);

    this[OPTIONS] = deepFreeze(opts);
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
