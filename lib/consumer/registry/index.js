const Registry = require('../../common/registry');
const Logger = require('../consumerLog');

const registry = new Registry(Logger);

exports.init = registry.init;

exports.close = registry.close;

exports.register = (invoker) => {
  invoker.lock();//锁定注册者
  return registry
    .getZookeeper()
    .then((client) => registry.subscribe(invoker, client))//订阅提供者
    .then((client) => registry.configurators(invoker, client))//订阅动态配置更改
    .then((client) => registry.createInvoker(invoker, client))//注册消费者
    .then(() => invoker.unlock())//解锁
    .catch((err) => {
      Logger.error(err.message);
      return Promise.reject(err);
    });
};
