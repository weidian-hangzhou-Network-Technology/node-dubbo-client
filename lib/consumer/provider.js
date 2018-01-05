const QS = require('querystring');

const writableProperties = {
  enabled: (value) => value === 'true',
  disabled: (value) => value === 'true',
  weight: (value) => parseInt(value),
};

/**
 * @class Provider
 */
class Provider {
  /**
   * init provider with url object
   * @param {Url} dataUrl
   */
  constructor(dataUrl) {
    this.enabled = true;
    this.disabled = false;
    this.weight = 1;
    this.dubbo = {};
    this.methods = [];
    this.protocol = 'override';

    this.host = dataUrl.host;
    this.hostname = dataUrl.hostname;
    this.port = dataUrl.port;

    this.config(dataUrl);
  }

  /**
   * merge provider config
   * @param {Url} dataUrl
   */
  config(dataUrl) {
    const options = QS.parse(dataUrl.query);
    if (this.protocol === 'override') {
      this.protocol = dataUrl.protocol.replace(/:/, '');
      this.dubbo = Object.assign({}, options);
    }

    if (options.methods) {
      this.methods = options.methods.split(',');
    }

    Object.keys(options).forEach((key) => {
      const typeConverter = writableProperties[key];
      if (typeConverter) {
        this[key] = typeConverter(options[key]);
      }
    });
  }

  /**
   * @param {string} method
   * @return {boolean}
   */
  hasMethod(method) {
    return this.methods.includes(method);
  }

  resume() {
    this.enabled = true;
    this.disabled = false;
  }

  /**
   * @return {boolean}
   */
  canUse() {
    return this.enabled && !this.disabled;
  }
}

module.exports = Provider;
