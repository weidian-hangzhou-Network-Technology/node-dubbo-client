/* eslint-disable no-underscore-dangle */
const { EventEmitter } = require('events');
const { NacosNamingClient } = require('nacos');
const QS = require('querystring');
const util = require('../utils/utils');
const logger = require('../common/logHelper').getLogger('nacos');
const EVENTS = require('./events');

class NacosRegistry extends EventEmitter {
  constructor(props) {
    NacosRegistry._checkProps(props);
    super();
    this.client = null;
    this.nacosProps = props;

    this.ready = false;

    this._init();
  }

  static createInstance(config) {
    return new NacosRegistry(config);
  }

  static getRegistryPath(service, version) {
    return {
      configurator: `configurators:${service}:${version}`,
      provider: `providers:${service}:${version}:`,
      consumer: `consumers:${service}:${version}:`,
    };
  }

  static _checkProps(props) {
    if (!props.url) {
      throw new Error('Please specify nacos props, url is required');
    }
    if (!util.isString(props.url)) {
      throw new Error('Please specify nacos props, url should be a string');
    }
    if (props.namespace && !util.isString(props.namespace)) {
      throw new Error('Please specify nacos props, namespace should be a string');
    }
    if (!props.logger) {
      throw new Error('Please specify nacos props, logger is required');
    }
  }

  static initClient(config) {
    const nacos = NacosRegistry.createInstance(Object.assign({ logger: console }, config));
    return nacos;
  }

  async _init() {
    const serverList = this.nacosProps.url.split(',');
    const namespace = this.nacosProps.namespace || 'public';
    const nacosLogger = this.nacosProps.logger || console;

    this.client = new NacosNamingClient({
      serverList,
      namespace,
      logger: nacosLogger,
    });

    try {
      await this.client.ready();
      this.ready = true;
      this.emit('init');
    } catch (err) {
      logger('init error', err);
    }
  }

  async removePath({ path, ip, port }) {
    if (!this.ready) {
      throw new Error('nacos has not initiated.');
    }
    await this.client.deregisterInstance(path, {
      ip,
      port,
    });
  }

  dispose() {
    if (!this.ready) {
      throw new Error('nacos has not initiated.');
    }
    return this.client._close();
  }

  getClient() {
    return this.client;
  }

  publish({
    path, ip, port, metadata,
  }) {
    if (!this.ready) {
      throw new Error('nacos has not initiated.');
    }
    return this.client.registerInstance(path, {
      ip,
      port: port || 80,
      metadata,
    });
  }

  subscribe(path, successListener) {
    if (!this.ready) {
      throw new Error('nacos has not initiated.');
    }
    this.client.subscribe(path, (dubboServiceUrls) => {
      const urls = dubboServiceUrls.map((item) => {
        const {
          ip, port,
          serviceName: interfaceName,
          metadata,
        } = item;
        const inf = interfaceName.split('@@')[1];
        return `${metadata.protocol || 'jsonrpc'}://${ip}:${port}/${inf}?${QS.stringify(metadata)}`;
      });
      successListener(EVENTS.SUBSCRIBE(path), urls);
    });
  }
}

module.exports = NacosRegistry;
