const URL = require('url');
const QS = require('querystring');
const Config = require('../config');

const INIT = Symbol('INIT');

const writableProperties = {
  enabled: (value) => value === 'true',
  disabled: (value) => value === 'true',
  weight: (value) => parseInt(value),
};

class Provider {
  constructor(optionsString) {
    this.enabled = true;
    this.disabled = false;

    this.weight = Config.getDubboConfig().weight;

    this[INIT](optionsString);
  }

  [INIT](optionsString) {
    let optionUrl = URL.parse(optionsString);
    let query = QS.parse(optionUrl.query);

    this.host = optionUrl.host;
    this.hostname = optionUrl.hostname;
    this.port = optionUrl.port;
    this.protocol = optionUrl.protocol.replace(/:/, '');

    this.methods = new Set(query.methods.split(','));
    this.dubbo = Object.assign({}, query);
  }

  override(options) {
    Object.keys(options).forEach((key) => {
      let typeConverter = writableProperties[key];
      if (typeConverter) {
        this[key] = typeConverter(options[key]);
      }
    });
  }

  hasMethod(method) {
    return this.methods && this.methods.has(method);
  }

  resume() {
    this.enabled = true;
    this.disabled = false;
  }

  canUse() {
    return this.enabled && !this.disabled;
  }

  toString() {
    return this.host;
  }
}

module.exports = Provider;
