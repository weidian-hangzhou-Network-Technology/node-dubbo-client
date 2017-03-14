const Registry = require('../../common/registry');
const Logger = require('../consumerLog');

const registry = new Registry(Logger);

exports.init = (...arg) => registry.init(...arg);

exports.close = () => registry.close();

const listener = ({ path, invokerDescription, client, handler }) => {
  const _listener = function ({ path, invokerDescription, client, handler }, canLock = false) {
    client.getChildren(
      path,
      function (event) {
        if (event.getType() === Registry.ZOEVENT.NODE_CHILDREN_CHANGED) {
          _listener({ path, invokerDescription, client, handler }, canLock);
        }
      },

      function (err, childrens) {
        Logger.debug(childrens);
        let estr = handler(err, childrens, canLock);
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
          _listener({ path, invokerDescription, client, handler }, true);
        }
      },

      function (err, childrens) {
        Logger.debug(childrens);
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
      handler: (err, childrens, canLock) => {
        if (err) {
          return `Registry:subscribe error [${invoker.toString()}]	${err.message}`;
        } else {
          if (canLock) {
            invoker.lock();
          }

          invoker.setProviders(childrens);

          if (canLock) {
            invoker.unlock();
          }
        }
      },
    }))
    .then((client) => listener({
      path: invoker.configuratorsPath,
      invokerDescription: invoker.toString(),
      client,
      handler: (err, childrens, canLock) => {
        if (canLock) {
          invoker.lock();
        }

        if (err) {
          invoker.configProviders();
        } else {
          invoker.configProviders(childrens);
        }

        if (canLock) {
          invoker.unlock();
        }
      },
    }))
    .then((client) => registry.registerInvoker(invoker, client))//注册消费者
    .then((info) => {
      Logger.debug(info);
      return invoker.unlock();//解锁
    });
};
