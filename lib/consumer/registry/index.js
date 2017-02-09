const Registry = require('../../common/registry');
const Logger = require('../consumerLog');

const registry = new Registry(Logger);

exports.init = (...arg) => registry.init(...arg);

exports.close = () => registry.close();

const listener = ({ path, invokerDescription, client, handler }) => {
  const _listener = ({ path, invokerDescription, client, handler }) => {
    client.getChildren(
      path,
      function (event) {
        if (event.getType() === Registry.ZOEVENT.NODE_CHILDREN_CHANGED) {
          _listener({ path, invokerDescription, client, handler });
        }
      },

      function (err, childrens) {
        Logger.debug(childrens);
        let estr = handler(err, childrens);
        if (estr) {
          Logger.error(estr);
        }
      }
    );
  };

  return new Promise((resolve, reject) => {
    client.getChildren(
      path,
      function (event) {
        if (event.getType() === Registry.ZOEVENT.NODE_CHILDREN_CHANGED) {
          _listener({ path, invokerDescription, client, handler });
        }
      },

      function (err, childrens) {
        let estr = handler(err, childrens);
        estr ? reject(new Error(estr)) : resolve(client);
      }
    );
  });
};

exports.register = (invoker) => {
  invoker.lock();//锁定注册者
  return registry
    .getZookeeper()
    .then((client) => listener({
      path: invoker.providerPath,
      invokerDescription: invoker.toString(),
      client,
      handler: (err, childrens) => {
        if (err) {
          return `Registry:subscribe error [${invoker.toString()}]	${err.message}`;
        } else {
          invoker.setProviders(childrens);
        }
      },
    }))
    .then((client) => listener({
      path: invoker.configuratorsPath,
      invokerDescription: invoker.toString(),
      client,
      handler: (err, childrens) => {
        if (err) {
          invoker.configProviders();
        } else {
          invoker.configProviders(childrens);
        }
      },
    }))
    .then((client) => registry.registerInvoker(invoker, client))//注册消费者
    .then((info) => {
      Logger.debug(info);
      return invoker.unlock();//解锁
    });
};
