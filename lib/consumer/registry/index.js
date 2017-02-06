const Registry = require('../../common/registry');
const Logger = require('../consumerLog');

const registry = new Registry(Logger);

exports.init = (...arg) => registry.init(...arg);

exports.close = () => registry.close();

const subscribe = (invoker, client) => {
  const _subscribe = (invoker, client) => {
    client.getChildren(
      invoker.providerPath,
      function (event) {
        if (event.getType() === Registry.ZOEVENT.NODE_CHILDREN_CHANGED) {
          _subscribe(invoker, client);
        }
      },

      function (err, childrens) {
        if (err) {
          Logger.error(`Registry:resubscribe error [${invoker.toString()}]	${err.message}`);
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
        if (event.getType() === Registry.ZOEVENT.NODE_CHILDREN_CHANGED) {
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
};

const configurators = (invoker, client) => {
  const _configurators = (invoker, client) => {
    client.getChildren(
      invoker.configuratorsPath,
      function (event) {
        if (event.getType() === Registry.ZOEVENT.NODE_CHILDREN_CHANGED) {
          _configurators(invoker, client);
        }
      },

      function (err, childrens) {
        if (err) {
          Logger.error(`Registry:reconfigurators error [${invoker.toString()}]	${err.message}`);
        } else {
          invoker.configProviders(childrens);
        }
      }
    );
  };

  return new Promise((resolve) => {
    client.getChildren(
      invoker.configuratorsPath,
      function (event) {
        if (event.getType() === Registry.ZOEVENT.NODE_CHILDREN_CHANGED) {
          _configurators(invoker, client);
        }
      },

      function (err, childrens) {
        if (err) {
          invoker.configProviders();
        } else {
          invoker.configProviders(childrens);
        }

        resolve(client);
      }
    );
  });
};

exports.register = (invoker) => {
  invoker.lock();//锁定注册者
  return registry
    .getZookeeper()
    .then((client) => subscribe(invoker, client))//订阅提供者
    .then((client) => configurators(invoker, client))//订阅动态配置更改
    .then((client) => registry.registerInvoker(invoker, client))//注册消费者
    .then((info) => {
      Logger.debug(info);
      return invoker.unlock();//解锁
    })
    .catch((err) => Promise.reject(err));
};
