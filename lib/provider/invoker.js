const QS = require('querystring');
const config = require('../config');
const registry = require('../registry');
const InvokerBase = require('../common/invokerBase');
const logger = require('../common/logHelper').getLogger('provider-invoker');
const checkValue = require('../utils/checkValue');

class Invoker extends InvokerBase {
  static createInstance(serviceInfo) {
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

    this.service = serviceInfo.service;
    this.group = serviceInfo.group;
    this.version = serviceInfo.version;
    this.protocol = 'jsonrpc';

    this.methods = [];
    super.setupPath(registry.getRegistryPath);
  }

  setPort(port) {
    this.port = port;
    this.ip = config.ip;
    this.host = `${config.ip}:${port}`;
  }

  init() {
    if (this.methods.length === 0) {
      throw new Error('method should not be empty.');
    }

    if (!this.port) {
      throw new Error('init should called after setPort');
    }

    const param = Object.assign({
      'default.group': this.group,
      'default.version': this.version,
      protocol: this.protocol,
      interface: this.service,
      methods: this.methods.join(','),
      server: 'node',
      side: 'provider',
      category: 'providers',
    }, config.getDescription());
    const descriptions = `${this.protocol}://${this.host}/${this.service}?${QS.stringify(param)}`;
    this.metadata = param;
    this.fullPath = `${this.path.provider}/${encodeURIComponent(descriptions)}`;

    registry.publish({
      path: this.path.provider,
      fullPath: this.fullPath,
      serviceName: this.service,
      ip: this.ip,
      port: this.port,
      metadata: this.metadata,
    });
    registry.on(registry.EVENTS.PUBLISH(this.path.provider), () => {
      logger(`service published ${this.toString()}`);
    });
  }

  /**
   * @return {Promise.<void>}
   */
  dispose() {
    if (!this.fullPath) {
      return registry.dispose();
    }

    return registry
      .remove({
        path: this.path.provider,
        fullPath: this.fullPath,
        serviceName: this.service,
        ip: this.ip,
        port: this.port,
      })
      .then(() => registry.dispose());
  }

  addMethod(name) {
    if (this.methods.includes(name)) {
      throw new Error(`method:${name} has been added.`);
    } else {
      this.methods.push(name);
    }
  }
}

module.exports = Invoker;
