const Zookeeper = require('node-zookeeper-client');
const Log = require('../../log');

let zookeeper = null;
let isInitializing = true;
let initQueue = [];

function getZookeeper() {
  return new Promise((resolve) => {
    if (isInitializing) {
      initQueue.push(resolve);
    } else {
      resolve(zookeeper);
    }
  });
}

function subscribe(invoker, client) {

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
          Log.error(`Registry:resubscribe error [${invoker.toString()}]	${err.message}`);
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

function configurators(invoker, client) {

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
          Log.error(`Registry:reconfigurators error [${invoker.toString()}]	${err.message}`);
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

function registerInvoker(invoker, client) {
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
            reject(new Error(`Registry:${func} error [${invoker.toString()}]	${err.message}`));
          } else {
            Log.debug(`Registry:register path ${func} success [${invoker.toString()}]`);
            resolve();
          }
        }
      );
    });
  });
}

exports.init = (url, options) => {
  zookeeper = Zookeeper.createClient(url, options);
  zookeeper.once('connected', () => {
    while (initQueue.length > 0) {
      Reflect.apply(initQueue.shift(), null, [zookeeper]);
    }

    isInitializing = false;
    Log.debug('已连接上zookeeper');
  });
  zookeeper.connect();
};

exports.register = (invoker) => {
  invoker.lock();//锁定注册者
  return getZookeeper()
    .then((client) => subscribe(invoker, client))//订阅提供者
    .then((client) => configurators(invoker, client))//订阅动态配置更改
    .then((client) => registerInvoker(invoker, client))//注册消费者
    .then(() => invoker.unlock())//解锁
    .catch((err) => {
      Log.error(err.message);
      return Promise.reject(err);
    });
};
