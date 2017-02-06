const Zookeeper = require('node-zookeeper-client');

const CLIENT = Symbol('CLIENT');
const ISINITIALIZING = Symbol('ISINITIALIZING');
const INITQUEUE = Symbol('INITQUEUE');
const LOGGER = Symbol('LOGGER');

class Registry {
  static get ZOEVENT() {
    return Zookeeper.Event;
  }

  constructor(logger) {
    this[CLIENT] = null;
    this[ISINITIALIZING] = true;
    this[INITQUEUE] = [];
    this[LOGGER] = logger;
  }

  init(url, options) {
    this[CLIENT] = Zookeeper.createClient(url, options);
    this[CLIENT].once('connected', () => {
      while (this[INITQUEUE].length > 0) {
        Reflect.apply(this[INITQUEUE].shift(), null, [this[CLIENT]]);
      }

      this[ISINITIALIZING] = false;
      this[LOGGER].info('已连接上zookeeper');
    });
    this[CLIENT].connect();
  }

  getZookeeper() {
    return new Promise((resolve) => {
      if (this[ISINITIALIZING]) {
        this[INITQUEUE].push(resolve);
      } else {
        resolve(this[CLIENT]);
      }
    });
  }

  registerInvoker(invoker, client) {
    return new Promise((resolve, reject) => {
      client.exists(invoker.getRegistryFolder(), function (error) {
        if (error) {
          reject(`Registry:register error [${invoker.toString()}]	${error.message}`);
        }

        client.mkdirp(
          invoker.getRegistryFolder(),
          Zookeeper.CreateMode.PERSISTENT,
          function (error) {
            client.mkdirp(
              invoker.getRegistryPath(),
              Zookeeper.CreateMode.EPHEMERAL,
              function (err) {
                if (err) {
                  reject(new Error(`Registry:mkdirp error [${invoker.toString()}]\t${err.message}`));
                } else {
                  resolve(`Registry:register path mkdirp success [${invoker.toString()}]`);
                }
              }
            );
          }
        );
      });
    });
  }

  removeInvoker(invoker) {
    return this
      .getZookeeper()
      .then((client) =>
        new Promise((resolve, reject) => {
          client.remove(
            invoker.getRegistryPath(),
            function (err) {
              if (err) {
                reject(new Error(`Registry:remove error [${invoker.toString()}]\t${err.message}`));
              } else {
                resolve();
              }
            }
          );
        })
      );
  }

  close() {
    return this
      .getZookeeper()
      .then((client) => {
        let promise = new Promise((resolve) => client.once('disconnected', () => resolve()));
        client.close();
        return promise;
      });
  }
}

module.exports = Registry;
