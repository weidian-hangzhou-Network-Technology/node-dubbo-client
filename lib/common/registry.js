const Zookeeper = require('node-zookeeper-client');

const CLIENT = Symbol('CLIENT');
const ISINITIALIZING = Symbol('ISINITIALIZING');
const INITQUEUE = Symbol('INITQUEUE');
const LOGGER = Symbol('LOGGER');

class Registry {
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
        Reflect.apply(this[INITQUEUE].shift(), null, [zookeeper]);
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
        resolve(zookeeper);
      }
    });
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

  subscribe(invoker, client) {
    const _subscribe = (invoker, client) => {
      client.getChildren(
        invoker.providerPath,
        function (event) {
          if (event.getType() === Zookeeper.Event.NODE_CHILDREN_CHANGED) {
            _subscribe(invoker, client);
          }
        },

        function (err, childrens) {
          if (err) {
            this[LOGGER].error(`Registry:resubscribe error [${invoker.toString()}]	${err.message}`);
          } else {
            invoker.setProviders(childrens);
          }
        }
      );
    };

    return new Promise((resolve, reject) => {
      client.getChildren(
        invoker.providerPath,
        function (event) {
          if (event.getType() === Zookeeper.Event.NODE_CHILDREN_CHANGED) {
            _subscribe(invoker, client);
          }
        },

        function (err, childrens) {
          if (err) {
            reject(new Error(`Registry:subscribe error [${invoker.toString()}]	${err.message}`));
          } else {
            invoker.setProviders(childrens);
            resolve(client);
          }
        }
      );
    });
  }

  configurators(invoker, client) {
    const _configurators = (invoker, client) => {
      client.getChildren(
        invoker.configuratorsPath,
        function (event) {
          if (event.getType() === Zookeeper.Event.NODE_CHILDREN_CHANGED) {
            _configurators(invoker, client);
          }
        },

        function (err, childrens) {
          if (err) {
            this[LOGGER].error(`Registry:reconfigurators error [${invoker.toString()}]	${err.message}`);
          } else {
            invoker.configProviders(childrens);
          }
        }
      );
    };

    return new Promise((resolve, reject) => {
      client.getChildren(
        invoker.configuratorsPath,
        function (event) {
          if (event.getType() === Zookeeper.Event.NODE_CHILDREN_CHANGED) {
            _configurators(invoker, client);
          }
        },

        function (err, childrens) {
          if (err) {
            reject(new Error(`Registry:configurators error [${invoker.toString()}]	${err.message}`));
          } else {
            invoker.configProviders(childrens);
            resolve(client);
          }
        }
      );
    });
  }

  createInvoker(invoker, client) {
    return new Promise((resolve, reject) => {
      client.exists(invoker.registryPath, function (error, state) {
        if (error) {
          reject(`Registry:register error [${invoker.toString()}]	${error.message}`);
        }

        const func = state ? 'mkdirp' : 'create';
        client[func](
          invoker.registryPath,
          null,
          Zookeeper.CreateMode.EPHEMERAL,
          function (err) {
            if (err) {
              reject(new Error(`Registry:${func} error [${invoker.toString()}]\t${err.message}`));
            } else {
              this[LOGGER].debug(`Registry:register path ${func} success [${invoker.toString()}]`);
              resolve();
            }
          }
        );
      });
    });
  }
}

module.exports = Registry;
