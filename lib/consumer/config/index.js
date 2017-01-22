const getLocalIp = require('../../utils/getLocalIp');
const deepExtend = require('../../utils/deepExtend');
const deepFreeze = require('../../utils/deepFreeze');
const Check = require('./check');

const optionsName = Symbol('options');

class Config {
  constructor() {
    this.ip = getLocalIp();
  }

  setOptions(options) {
    let _options = Check(deepExtend({
      dubbo: {
        providerTimeout: 45 * 1000,
        weight: 100,
      },
      registry: {
        options: {
          sessionTimeout: 30 * 1000,
          spinDelay: 1000,
          retries: 0,
        },
      },
      loadBalance: 'round',
    }, options));

    this[optionsName] = deepFreeze(_options);
  }

  getOptions() {
    return this[optionsName];
  }

  getRegistry() {
    return this[optionsName].registry;
  }

  getLoadBalance() {
    return this[optionsName].loadBalance;
  }

  getDubboConfig() {
    return this[optionsName].dubbo;
  }

  getDescription() {
    return this[optionsName].description;
  }
}

module.exports = new Config();
