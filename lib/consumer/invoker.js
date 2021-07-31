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
    let type;
    if (config && config.getRegistry) {
      type = config.getRegistry().registryType;
    }
    super.setupPath(type);
    const param = Object.assign({
      group: this.group,
      version: this.version,
      side: 'consumer',
      category: 'consumers',
    }, config.getDescription());
    const desc = `consumer://${config.ip}/${this.service}?${QS.stringify(param)}`;

    this.ip = config.ip;
    this.metadata = param;
    this.fullPath = `${this.path.consumer}/${encodeURIComponent(desc)}`;
  }

  /**
   * set all service registered providers
   * @param {Array<string>} providerStrs
   * @return {Invoker}
   */
  _setProviders(providerStrs) {
    const providers = providerStrs
      .map((item) => decodeURIComponent(item))
      .filter((item) => new RegExp(`version=${this.version}`).test(item));

    if (config.debug()) {
      logger(`providers ${JSON.stringify(providers)}`);
    }

    // set all provider into down status before init provider
    [...this.providers.values()].forEach((provider) => {
      provider.down();
    });

    providers.forEach((str) => {
      const item = URL.parse(str);
      let provider = this.providers.get(item.host);
      if (!provider) {
        provider = new Provider(item.host);
        this.providers.set(item.host, provider);
      }
      provider.init(item);
    });

    this._checkoutProviders();

    return this;
  }

  /**
   * cover provider info with given config
   * @param {Array<string>} configStrs
   * @return {Invoker}
   */
  _configProviders(configStrs) {
    const configs = configStrs
      .map((item) => decodeURIComponent(item))
      .filter((item) => new RegExp(`version=${this.version}`).test(item));

    if (config.debug()) {
      logger(`configs ${JSON.stringify(configs)}`);
    }

    // clear all provider config info before new config info write to provider
    [...this.providers.values()].forEach((provider) => {
      provider.clearSetup();
    });

    if (configs.length > 0) {
      configs.forEach((str) => {
        const item = URL.parse(str);
        let provider = this.providers.get(item.host);
        if (!provider) {
          provider = new Provider(item.host);
          this.providers.set(item.host, provider);
        }
        provider.setup(item);
      });
    }

    this._checkoutProviders();

    return this;
  }

  /**
   * if provider config and baseInfo is null, should be removed.
   * @private
   */
  _checkoutProviders() {
    [...this.providers.entries()].forEach(([host, provider]) => {
      if (provider.invalid) {
        this.providers.delete(host);
      }
    });
  }

  _getValidProviders(protocol) {
    return [...this.providers.values()]
      .filter((provider) => provider.canUse() && provider.getProtocol() === protocol);
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
        registry.publish({
          path: this.path.consumer,
          fullPath: this.fullPath,
          serviceName: this.service,
          ip: this.ip,
          metadata: this.metadata,
        });
        // and continue event listeners
        this._bindEvents();

        // setup all outside called function
        this.ready = true;
        while (this._initQueue.length > 0) {
          const [resolve, protocol] = this._initQueue.shift();
          resolve(this._getValidProviders(protocol));
        }
      });
      registry.subscribe({ path: this.path.configurator });
    });

    registry.on(registry.EVENTS.ERROR(this.path.provider), (err) => {
      logger(`registry provider got error: ${err.message}`);
    });

    registry.on(registry.EVENTS.ERROR(this.path.configurator), (err) => {
      logger(`registry configurator got error: ${err.message}`);
    });

    registry.subscribe({ path: this.path.provider });
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
