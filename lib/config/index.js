/* eslint-disable no-underscore-dangle */
const getLocalIp = require('../utils/getLocalIp');
const deepExtend = require('../utils/deepExtend');
const deepFreeze = require('../utils/deepFreeze');
const configCheck = require('../utils/configCheck');
const schema = require('./schema.json');

class Config {
  constructor() {
    this.ip = getLocalIp();
  }

  setOptions(opts) {
    const defaultOpts = {
      description: {},
      dubbo: {
        timeout: 45 * 1000,
        keepAlive: false,
        protocol: 'jsonrpc',
      },
      registry: {
        // use zookeeper config
        // https://github.com/alexguan/node-zookeeper-client#client-createclientconnectionstring-options
        options: {
          sessionTimeout: 30 * 1000,
          spinDelay: 1000,
          retries: 0,
        },
      },
      loadBalance: 'round',
      debug: false,
    };

    const checkedOpts = configCheck(deepExtend(defaultOpts, opts), schema);
    this._options = deepFreeze(checkedOpts);
  }

  _getOptions() {
    if (!this._options) {
      throw new Error('library is not ready, you should setOptions before call service.');
    }
    return this._options;
  }

  debug() {
    return this._getOptions().debug;
  }

  getRegistry() {
    return this._getOptions().registry;
  }

  getDubboConfig() {
    return this._getOptions().dubbo;
  }

  getDescription() {
    return this._getOptions().description;
  }

  getLoadBalance() {
    return this._getOptions().loadBalance;
  }
}

module.exports = new Config();
