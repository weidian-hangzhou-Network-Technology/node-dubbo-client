const Registry = require('../../common/registry');
const Logger = require('../consumerLog');

const registry = new Registry(Logger);

exports.init = (...arg) => registry.init(...arg);

exports.close = () => registry.close();

const watcherHandler = ({ path, invokerDescription, client, handler }, canLock = false) => {
  client.getChildren(
    path,
    (event) => {
      if (event.getType() === Registry.ZOEVENT.NODE_CHILDREN_CHANGED) {
        watcherHandler({ path, invokerDescription, client, handler }, canLock);
      }
    },
    (err, childrens) => {
      Logger.debug(childrens);
      const estr = handler(err, childrens, canLock);
      if (estr) {
        Logger.error(estr);
      }
    });
};

const listener = ({ path, invokerDescription, client, handler }) =>
  new Promise((resolve, reject) => {
    client.getChildren(
      path,
      (event) => {
        if (event.getType() === Registry.ZOEVENT.NODE_CHILDREN_CHANGED) {
          watcherHandler({ path, invokerDescription, client, handler }, true);
        }
      },
      (err, childrens) => {
        Logger.debug(childrens);
        const errstr = handler(err, childrens);
        if (errstr) {
          reject(new Error(errstr));
        } else {
          resolve(client);
        }
      });
  });

exports.register = (invoker) => {
  invoker.lock(); // 锁定注册者
  return registry
    .getZookeeper()
    .then((client) => listener({
      path: invoker.providerPath,
      invokerDescription: invoker.toString(),
      client,
      handler: (err, childrens, canLock) => {
        if (err) {
          return `Registry:subscribe error [${invoker.toString()}] ${err.message}`;
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
    .then(() => registry.registerInvoker(invoker)) // 注册消费者
    .then((info) => {
      Logger.debug(info);
      return invoker.unlock(); // 解锁
    });
};
