const QS = require('querystring');
const deepCopy = require('../utils/deepCopy');

const writableProperties = {
  enabled: (value) => value === 'true',
  disabled: (value) => value === 'true',
  weight: (value) => parseInt(value),
};

const DEFAULT_WEIGHT = 100;

/**
 * @class Provider
 */
class Provider {
  get invalid() {
    return !this.configs && !this.baseInfo;
  }

  /**
   * init provider with url object
   * @param {string} host
   */
  constructor(host) {
    /**
     * configs {object}
     * @property {boolean} enabled
     * @property {boolean} disabled
     * @property {number} weight
     */
    this.configs = null;
    /**
     * baseInfo {object}
     * @property {string} protocol
     * @property {object} dubbo
     * @property {Array<string>} methods
     */
    this.baseInfo = null;
    this.host = host;
  }

  /**
   * set configurators info
   * @param {Url} dataUrl
   */
  setup(dataUrl) {
    const options = QS.parse(dataUrl.query);
    Object.keys(options).forEach((key) => {
      const typeConverter = writableProperties[key];
      if (typeConverter) {
        if (this.configs === null) {
          this.configs = {};
        }
        this.configs[key] = typeConverter(options[key]);
      }
    });
  }

  /**
   * reset provider config
   */
  clearSetup() {
    this.configs = null;
  }

  /**
   * setup provider base info
   * @param {Url} dataUrl
   */
  init(dataUrl) {
    const options = QS.parse(dataUrl.query);
    this.baseInfo = {
      protocol: dataUrl.protocol.replace(/:/, ''),
      dubbo: deepCopy(options),
      methods: (options.methods || '').split(','),
    };
  }

  down() {
    this.baseInfo = null;
  }

  /**
   * @param {string} method
   * @return {boolean}
   */
  hasMethod(method) {
    return this.baseInfo && (this.baseInfo.methods || []).includes(method);
  }

  /**
   * @return {string}
   */
  getProtocol() {
    return this.baseInfo ? this.baseInfo.protocol : '';
  }

  /**
   * @return {number}
   */
  getWeight() {
    return this.configs ? (this.configs.weight || DEFAULT_WEIGHT) : DEFAULT_WEIGHT;
  }

  /**
   * @return {boolean}
   */
  canUse() {
    return !this.configs || (this.configs.enabled && !this.configs.disabled);
  }
}

module.exports = Provider;
