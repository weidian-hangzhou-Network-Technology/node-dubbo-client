const { EventEmitter } = require('events');
const ZOO = require('./zoo');
const NacosRegistry = require('./nacos');
const logger = require('../common/logHelper').getLogger('registry');
const EVENTS = require('./events');

class Registry extends EventEmitter {
  constructor() {
    super();
    this.ready = false;
    this.registryType = 'zookeeper';
    this.client = null;
  }

  getRegistryPath(service, version) {
    if (this.isZookeeper()) {
      return ZOO.getRegistryPath(service);
    } else {
      return NacosRegistry.getRegistryPath(service, version);
    }
  }

  init(config) {
    this.registryType = config.registryType || 'zookeeper';
    if (this.isZookeeper()) {
      this.client = ZOO.initClient(config);
    } else {
      this.client = NacosRegistry.initClient(config);
    }

    return new Promise((resolve) => {
      this.client.once('init', () => {
        logger('registry initiated.');
        /**
         * @event registry#ready
         */
        this.emit('ready');
        this.ready = true;
        resolve();
      });
    });
  }

  isZookeeper() {
    return this.registryType === 'zookeeper';
  }

  /**
   * remove node from registry
   * @param {object} options
   * @param {string} options.path
   * @param {string} options.fullPath
   * @param {string} options.ip
   * @param {string} options.port
   * @return {Promise.<void>}
   */
  async remove(options) {
    if (!this.ready) {
      throw new Error('client has not ready.');
    }
    await this.client.removePath(options);
  }

  /**
   * @description publish service to registry
   * @param {object} options
   * @param {string} path
   * @param {string} fullPath
   * @param {string} mode
   * @param {string} ip
   * @param {number} port
   * @param {object} metadata
   */
  async publish(options) {
    if (!this.ready) {
      throw new Error('client has not ready.');
    }

    try {
      await this.client.publish(options);
      this.emit(EVENTS.PUBLISH(options.path));
    } catch (error) {
      this.emit(EVENTS.ERROR(options.path), error);
    }
  }

  subscribe({ path }) {
    if (!this.ready) {
      throw new Error('client has not ready.');
    }
    this.client.subscribe(path, (eventPath, data) => {
      this.emit(eventPath, data);
    }, (eventPath, err) => {
      this.emit(eventPath, err);
    });
  }

  /**
   * @return {Promise.<void>}
   */
  dispose() {
    if (!this.ready) {
      throw new Error('client has not ready.');
    }
    return this.client.dispose();
  }
}

const registry = new Registry();

/**
 * events name
 * use path to define event name
 * @type {{ERROR: (function(string): string), SUBSCRIBE: (function(string): string), PUBLISH: (function(string):
 *   string)}}
 */
registry.EVENTS = EVENTS;

module.exports = registry;
