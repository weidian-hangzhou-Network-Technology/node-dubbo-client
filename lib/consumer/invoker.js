/* eslint-disable no-underscore-dangle */
const URL = require('url');
const QS = require('querystring');
const InvokerBase = require('../common/invokerBase');
const logger = require('../common/logHelper').getLogger('consumer-invoker');
const registry = require('../registry');
const Provider = require('./provider');
const config = require('../config');
const checkValue = require('../utils/checkValue');

/**
 * @class Invoker
 * @extends InvokerBase
 */
class Invoker extends InvokerBase {
  /**
   * @param {{ service: string, group: string, version: string }} serviceInfo
   * @return {Invoker}
   */
  static create(serviceInfo) {
    return new Invoker(serviceInfo);
  }

  /**
   * init invoker with base info
   * @param {{ service: string, group: string, version: string }} serviceInfo
   */
  constructor(serviceInfo) {
    super();

    checkValue(serviceInfo, 'service');
    checkValue(serviceInfo, 'group');
    checkValue(serviceInfo, 'version');

    this.ready = false;
    this._initQueue = [];

    this.service = serviceInfo.service;
    this.group = serviceInfo.group;
    this.version = serviceInfo.version;

    this.providers = new Map();

    this._setupPath();
    setImmediate(() => {
      this._init();
    });
  }

  _setupPath() {
    super.setupPath();
    const param = Object.assign({
      group: this.group,
      version: this.version,
      side: 'consumer',
      category: 'consumers',
    }, config.getDescription());
    const desc = `consumer://${config.ip}/${this.service}?${QS.stringify(param)}`;

    this.fullPath = `${this.path.consumer}/${encodeURIComponent(desc)}`;
  }

  /**
   * set all service registered providers
   * @param {Array<string>} providers
   * @return {Invoker}
   */
  _setProviders(providers) {
    const _providers = providers
      .map((item) => decodeURIComponent(item))
      .filter((item) => new RegExp(`default.version=${this.version}`).test(item));

    if (config.debug()) {
      logger(`providers ${JSON.stringify(_providers)}`);
    }

    _providers.forEach((str) => {
      const item = URL.parse(str);
      const existProvider = this.providers.get(item.host);
      if (existProvider) {
        existProvider.config(item);
      } else {
        const newProvider = new Provider(item);
        this.providers.set(newProvider.host, newProvider);
      }
    });

    return this;
  }

  /**
   * cover provider info with given config
   * @param {Array<string>} configs
   * @return {Invoker}
   */
  _configProviders(configs) {
    const _configs = configs
      .map((item) => decodeURIComponent(item))
      .filter((item) => new RegExp(`version=${this.version}`).test(item));

    if (config.debug()) {
      logger(`configs ${JSON.stringify(_configs)}`);
    }

    if (_configs.length === 0) {
      [...this.providers.values()].forEach((provider) => {
        if (provider.protocol === 'override') {
          this.providers.delete(provider.host);
        } else {
          provider.resume();
        }
      });
    } else {
      // reset all valid provider status before new setting setup
      [...this.providers.values()].forEach((provider) => {
        if (provider.protocol !== 'override') {
          provider.resume();
        }
      });

      const configParsed = _configs.map((item) => URL.parse(item));
      configParsed.forEach((conf) => {
        const existProvider = this.providers.get(conf.host);
        // if configed provider exist, override provider info
        // else create new provider
        if (existProvider) {
          existProvider.config(conf);
        } else {
          const newProvider = new Provider(conf);
          this.providers.set(newProvider.host, newProvider);
        }
      });
    }

    return this;
  }

  _getValidProviders(protocol) {
    return [...this.providers.values()]
      .filter((provider) => provider.canUse() && provider.protocol === protocol);
  }

  /**
   * get all valid provider
   * if registry is not ready, returned Promise will wait for it.
   * @param {string} protocol
   * @return {Promise<Array<Provider>>}
   */
  getProviders(protocol) {
    return new Promise((resolve) => {
      if (this.ready) {
        resolve(this._getValidProviders(protocol));
      } else {
        this._initQueue.push([resolve, protocol]);
      }
    });
  }

  /**
   * disable provider with rewrite protocol
   * @param {string} host
   */
  disableProvider(host) {
    const provider = this.providers.get(host);
    if (provider) {
      provider.down();
    }
  }

  /**
   * first time init should subscribe provider and configurator in order
   */
  _init() {
    // get service provider base connection info
    registry.once(registry.EVENTS.SUBSCRIBE(this.path.provider), (providers) => {
      this._setProviders(providers);

      // get service provider configuration
      registry.once(registry.EVENTS.SUBSCRIBE(this.path.configurator), (configurators) => {
        this._configProviders(configurators);

        // after all init subscribe finished, publish current node
        registry.publish(this.path.consumer, this.fullPath);
        // and continue event listeners
        this._bindEvents();

        // setup all outside called function
        this.ready = true;
        while (this._initQueue.length > 0) {
          const [resolve, protocol] = this._initQueue.shift();
          resolve(this._getValidProviders(protocol));
        }
      });
      registry.subscribe(this.path.configurator);
    });

    registry.on(registry.EVENTS.ERROR(this.path.provider), (err) => {
      logger(`registry provider got error: ${err.message}`);
    });

    registry.on(registry.EVENTS.ERROR(this.path.configurator), (err) => {
      logger(`registry configurator got error: ${err.message}`);
    });

    registry.subscribe(this.path.provider);
  }

  /**
   * keep listening changes of provider info
   */
  _bindEvents() {
    registry.on(registry.EVENTS.SUBSCRIBE(this.path.provider), (providers) => {
      this._setProviders(providers);
    });

    registry.on(registry.EVENTS.SUBSCRIBE(this.path.configurator), (configurators) => {
      this._configProviders(configurators);
    });
  }
}

module.exports = Invoker;
