const { EventEmitter } = require('events');
const ZOO = require('./zoo');
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
  }

  /**
   * init zoo client
   * @param {ZooConfig} zooConfig
   * @return {Promise.<void>}
   */
  init(zooConfig) {
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

  /**
   * remove node from zookeeper
   * @param {string} fullpath
   * @return {Promise.<void>}
   */
  remove(fullpath) {
    return this.zoo.removePath(fullpath);
  }

  /**
   * create node to zookeeper
   * @param {string} path
   * @param {string} fullpath
   * @param {string} [mode]
   */
  publish(path, fullpath, mode = 'auto') {
    if (!this.zoo) {
      throw new Error('zookeeper has not initiated.');
    }

    this
      .zoo.createPath(path, fullpath, mode === 'long' ? ZOO.ZOO_CREATEMODE.PERSISTENT : ZOO.ZOO_CREATEMODE.EPHEMERAL)
      .then(() => {
        this.emit(EVENTS.PUBLISH(path));
      })
      .catch((err) => {
        this.emit(EVENTS.ERROR(path), err);
      });
  }

  /**
   * subscribe zookeeper node
   * @param {string} path
   */
  subscribe(path) {
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

  /**
   * @return {Promise.<void>}
   */
  dispose() {
    return this.zoo.dispose();
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
