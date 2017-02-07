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
    let _options = configCheck(deepExtend({
      description: {
        side: 'consumer',
        category: 'consumers',
      },
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
      debug: false,
    }, options), schema);

    this[OPTIONS] = deepFreeze(_options);
  }

  getOptions() {
    return this[OPTIONS];
  }

  getRegistry() {
    return this[OPTIONS].registry;
  }

  getLoadBalance() {
    return this[OPTIONS].loadBalance;
  }

  getDubboConfig() {
    return this[OPTIONS].dubbo;
  }

  getDescription() {
    return this[OPTIONS].description;
  }
}

module.exports = new Config();
