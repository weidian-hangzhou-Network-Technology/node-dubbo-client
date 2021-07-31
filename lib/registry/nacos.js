/* eslint-disable no-underscore-dangle */
const { EventEmitter } = require('events');
const { NacosNamingClient } = require('nacos');
const util = require('../utils/utils');

class NacosRegistry extends EventEmitter {
  constructor(props) {
    NacosRegistry._checkProps(props);
    super();
    this.client = null;
    this.nacosProps = props;

    this.readyPromise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });

    this._init();
  }

  static createInstance(config) {
    return new NacosRegistry(config);
  }

  ready() {
    return this.readyPromise;
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
      this.resolve();
      this.emit('init');
    } catch (err) {
      this.reject(err);
    }
  }

  async remove(path, ip, port) {
    if (!this.client) {
      throw new Error('nacos has not initiated.');
    }
    await this.client.deregisterInstance(path, {
      ip,
      port,
    });
  }

  dispose() {
    if (this.client) {
      return this.client._close();
    }
    return Promise.resolve();
  }

  getClient() {
    return this.client;
  }
}

module.exports = NacosRegistry;
