const URL = require('url');
const QS = require('querystring');
const { PROTOCOL } = require('../../constants');
const Config = require('../config');

const INIT = Symbol('INIT');

const writableProperties = ['enable', 'disable', 'weight'];

class Provider {
  constructor(optionsString) {
    this.host = '';
    this.hostname = '';
    this.port = '';
    this.protocol = '';

    this.enable = true;
    this.disable = false;

    this.weight = Config.getDubboConfig().weight;
    this.dubbo = {};

    this[INIT](optionsString);
  }

  [INIT](optionsString) {
    let optionUrl = URL.parse(optionsString);
    let query = QS.parse(optionUrl.query);

    this.host = optionUrl.host;
    this.hostname = optionUrl.hostname;
    this.port = optionUrl.port;

    let _protocol = optionUrl.protocol.replace(/:/, '');
    if (_protocol === 'jsonrpc') {
      this.protocol = PROTOCOL.JSONRPC;
    } else if (_protocol === 'dubbo') {
      this.protocol = PROTOCOL.HESSIAN;
    }

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
