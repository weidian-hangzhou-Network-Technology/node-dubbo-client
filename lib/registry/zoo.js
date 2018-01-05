/* eslint-disable no-underscore-dangle */
const { EventEmitter } = require('events');
const Zookeeper = require('node-zookeeper-client');
const logger = require('../common/logHelper').getLogger('zookeeper');

const zPromise = (client) => ({
  exists: (path) =>
    new Promise((resolve, reject) => {
      client.exists(path, (error, stat) => {
        if (error) {
          reject(error);
        } else {
          resolve(stat);
        }
      });
    }),
  mkdirp: (path, mode) =>
    new Promise((resolve, reject) => {
      client.mkdirp(path, mode, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    }),
  remove: (path) =>
    new Promise((resolve, reject) => {
      client.remove(path, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    }),
});

/**
 * @typedef {Object} ZooConfig
 * @property {string} url
 * @property {Object} [options]
 * @property {number} options.sessionTimeout
 * @property {number} options.spinDelay
 * @property {number} options.retries
 */

class Zoo extends EventEmitter {
  static get ZOOEVENT() {
    return Zookeeper.Event;
  }

  static get ZOO_CREATEMODE() {
    return Zookeeper.CreateMode;
  }

  static createInstance(zooConfig) {
    return new Zoo(zooConfig);
  }

  /**
   * create instance
   * @param {ZooConfig} zooConfig
   * @return {void}
   */
  constructor(zooConfig) {
    super();
    this.client = null;
    this.ready = false;
    this._initQueue = [];

    this._init(zooConfig);
  }

  /**
   * init zookeeper connection
   * @param {ZooConfig} zooConfig
   * @private
   */
  _init(zooConfig) {
    this.client = Zookeeper.createClient(zooConfig.url, zooConfig.options);
    this.client.once('connected', () => {
      this.ready = true;
      // clear init queue with connected client
      while (this._initQueue.length > 0) {
        this._initQueue.shift()(this.client);
      }

      /**
       * @event Registry#init
       */
      this.emit('init');
    });

    this
      .client
      .on('connected', () => {
        logger('connected');
      })
      .on('disconnected', () => {
        logger('disconnected');
      })
      .on('connectedReadOnly', () => {
        logger('connected to a readonly server');
      })
      .on('expired', () => {
        logger('session expired');
      })
      .on('authenticationFailed', () => {
        logger('Failed to authenticate with the server');
      });

    this.client.connect();
  }

  /**
   * get zookeeper connected client
   * if zookeeper is not ready, push current state into queue
   * @return {Promise.<Client>}
   */
  getClient() {
    return new Promise((resolve) => {
      if (this.ready) {
        resolve(this.client);
      } else {
        this._initQueue.push(resolve);
      }
    });
  }

  /**
   * add new node to zookeeper
   * @param {string} path
   * @param {string} fullpath
   * @param {number} [nodeCreateMode]
   * @return {Promise.<string>}
   */
  createPath(path, fullpath, nodeCreateMode = Zoo.ZOO_CREATEMODE.EPHEMERAL) {
    return this
      .getClient()
      .then((client) => {
        const p = zPromise(client);
        return p
          .exists(path)
          .then((stat) => {
            if (!stat) {
              return p.mkdirp(path, Zookeeper.CreateMode.PERSISTENT);
            }
          })
          .then(() => p.exists(fullpath))
          .then((stat) => {
            if (!stat) {
              return p.mkdirp(fullpath, nodeCreateMode);
            }
          })
          .catch((err) => Promise.reject(new Error(`Registry:createPath fail. \npath:${path} fullpath:${fullpath}\nmsg:${err.message}`)));
      });
  }

  /**
   * remove node from zookeeper
   * @param {string} fullpath
   * @return {Promise.<void>}
   */
  removePath(fullpath) {
    return this
      .getClient()
      .then((client) => zPromise(client)
        .remove(fullpath)
        .catch((err) => Promise.reject(new Error(`Registry:remove invoker fail.\nfullpath:${fullpath}\nmsg:${err.message}`))));
  }

  /**
   * close zookeeper client
   * @return {Promise.<void>}
   */
  dispose() {
    if (!this.ready) {
      this.client = null;
      return Promise.resolve();
    } else {
      return new Promise((resolve) => {
        this.client.once('disconnected', () => {
          this.client = null;
          resolve();
        });
        this.client.close();
      });
    }
  }
}

module.exports = Zoo;
