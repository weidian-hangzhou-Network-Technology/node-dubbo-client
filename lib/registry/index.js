const { EventEmitter } = require('events');
const QS = require('querystring');
const ZOO = require('./zoo');
const NacosRegistry = require('./nacos');
const logger = require('../common/logHelper').getLogger('registry');

const EVENTS = {
  ERROR: (path) => `[Error]${path}`,
  SUBSCRIBE: (path) => `[Subscribe]${path}`,
  PUBLISH: (path) => `[Publish]${path}`,
};

class Registry extends EventEmitter {
  constructor() {
    super();
    this.ready = false;
    this.registryType = null;
  }

  /**
   * init zoo client
   * @param {ZooConfig} zooConfig
   * @return {Promise.<void>}
   */
  initZookeeper(zooConfig) {
    return new Promise((resolve) => {
      const zoo = ZOO.createInstance(zooConfig);
      zoo.once('init', () => {
        logger('registry inited.');
        /**
         * @event registry#ready
         */
        this.emit('ready');
        this.ready = true;
        resolve();
      });
      this.zoo = zoo;
    });
  }

  initNacos(config) {
    return new Promise(async (resolve) => {
      const nacos = NacosRegistry.createInstance(Object.assign({ logger: console }, config));
      nacos.once('init', () => {
        this.emit('ready');
        this.ready = true;
        resolve();
      });
      this.nacos = nacos;
    });
  }

  init(config) {
    this.registryType = config.registryType || 'zookeeper';
    if (this.isZookeeper()) {
      return this.initZookeeper(config);
    } else {
      return this.initNacos(config);
    }
  }

  isZookeeper() {
    return this.registryType === 'zookeeper';
  }

  /**
   * remove node from zookeeper
   * @param {string} fullPath
   * @return {Promise.<void>}
   */
  async remove({
    path,
    fullPath,
    ip,
    port,
  }) {
    if (this.isZookeeper()) {
      await this.zoo.removePath(fullPath);
    } else {
      await this.nacos.remove(path, ip, port);
    }
  }

  /**
   * create node to zookeeper
   * @param {string} path
   * @param {string} fullPath
   * @param {string} [mode]
   */
  publishZookeeper(path, fullPath, mode = 'auto') {
    if (!this.zoo) {
      throw new Error('zookeeper has not initiated.');
    }

    this
      .zoo.createPath(path, fullPath, mode === 'long' ? ZOO.ZOO_CREATEMODE.PERSISTENT : ZOO.ZOO_CREATEMODE.EPHEMERAL)
      .then(() => {
        this.emit(EVENTS.PUBLISH(path));
      })
      .catch((err) => {
        this.emit(EVENTS.ERROR(path), err);
      });
  }

  async publishNacos(path, ip, port, metadata) {
    if (!this.nacos) {
      throw new Error('nacos has not initiated.');
    }
    await this.nacos.client.registerInstance(path, {
      ip,
      port: port || 80,
      metadata,
    });
  }

  publish({
    path,
    fullPath,
    mode = 'auto',
    ip,
    port = 80,
    metadata,
  }) {
    if (this.isZookeeper()) {
      this.publishZookeeper(path, fullPath, mode);
    } else {
      this.publishNacos(path, ip, port, metadata)
        .then(() => {
          this.emit(EVENTS.PUBLISH(path));
        })
        .catch((err) => {
          this.emit(EVENTS.ERROR(path), err);
        });
    }
  }

  /**
   * subscribe zookeeper node
   * @param {string} path
   */
  subscribeZookeeper(path) {
    if (!this.zoo) {
      throw new Error('zookeeper has not initiated.');
    }

    const watcher = () => {
      this
        .zoo.getClient()
        .then((client) => {
          client.getChildren(path, (event) => {
            if (event.getType() === ZOO.ZOOEVENT.NODE_CHILDREN_CHANGED) {
              watcher();
            }
          }, (err, childrens) => {
            if (err) {
              this.emit(EVENTS.ERROR(path), err);
            } else {
              this.emit(EVENTS.SUBSCRIBE(path), childrens);
            }
          });
        })
        .catch((err) => {
          this.emit(EVENTS.ERROR(path), err);
        });
    };

    watcher();
  }

  subscribeNacos(path) {
    this.nacos.client.subscribe(path, (dubboServiceUrls) => {
      const urls = dubboServiceUrls.map((item) => {
        const {
          ip, port,
          serviceName: interfaceName,
          metadata,
        } = item;
        const inf = interfaceName.split('@@')[1];
        return `${metadata.protocol || 'jsonrpc'}://${ip}:${port}/${inf}?${QS.stringify(metadata)}`;
      });
      logger('urls => ', urls);
      this.emit(EVENTS.SUBSCRIBE(path), urls);
    });
  }

  subscribe({ path }) {
    if (this.isZookeeper()) {
      this.subscribeZookeeper(path);
    } else {
      this.subscribeNacos(path);
    }
  }

  /**
   * @return {Promise.<void>}
   */
  dispose() {
    if (this.isZookeeper()) {
      return this.zoo.dispose();
    } else {
      return this.nacos.dispose();
    }
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
