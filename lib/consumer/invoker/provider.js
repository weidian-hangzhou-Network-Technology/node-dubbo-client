const URL = require('url');
const QS = require('querystring');
const Config = require('../config');

const INIT = Symbol('INIT');

const writableProperties = ['enable', 'disable', 'weight'];

class Provider {
  constructor(optionsString) {
    this.enable = true;
    this.disable = false;

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
      if (writableProperties.includes(key)) {
        this[key] = options[key];
      }
    });
  }

  hasMethod(method) {
    return this.methods && this.methods.has(method);
  }

  resume() {
    this.enable = true;
    this.disable = false;
  }

  canUse() {
    return this.enable && !this.disable;
  }

  toString() {
    return this.host;
  }
}

module.exports = Provider;
