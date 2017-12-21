/* eslint-disable no-underscore-dangle */
const { EventEmitter } = require('events');
const Zookeeper = require('node-zookeeper-client');
const logger = require('../common/logHelper').getLogger('zookeeper');

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
      .then((client) => (
        new Promise((resolve, reject) => {
          client.exists(path, (error) => {
            if (error) {
              return reject(new Error(`Registry:register path does not exist. ${error.message}`));
            }
            client.mkdirp(path, Zookeeper.CreateMode.PERSISTENT, (err) => {
              if (err) {
                return reject(new Error(`Registry:mkdirp fail. msg:${err.message} path:${path}`));
              }
              client.mkdirp(fullpath, nodeCreateMode, (e) => {
                if (e) {
                  return reject(new Error(`Registry:mkdirp fail. msg:${e.message} path:${fullpath}`));
                }
                resolve('Registry:mkdirp success.');
              });
            });
          });
        })
      ));
  }

  /**
   * remove node from zookeeper
   * @param {string} fullpath
   * @return {Promise.<void>}
   */
  removePath(fullpath) {
    return this
      .getClient()
      .then((client) => new Promise((resolve, reject) => {
        client.remove(fullpath, (err) => {
          if (err) {
            reject(new Error(`Registry:remove invoker fail. msg:${err.message} path:${fullpath}`));
          } else {
            resolve();
          }
        });
      }));
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
