const QS = require('querystring');
const URL = require('url');
const Config = require('../config');
const Provider = require('./provider');
const cluster = require('./cluster');

const PROVIDERS = Symbol('PROVIDERS');
const SIGNLOCK = Symbol('SIGNLOCK');
const LOCKQUEUE = Symbol('LOCKQUEUE');
const VERSIONTESTER = Symbol('VERSIONTESTER');

const GETREGISTRYPATH = Symbol('GETREGISTRYPATH');
const GETALLPROVIDERS = Symbol('GETALLPROVIDERS');
const RESUMEPROVIDERS = Symbol('RESUMEPROVIDERS');
const ADDPROVIDER = Symbol('ADDPROVIDER');
const OVERRIDEPROVIDER = Symbol('OVERRIDEPROVIDER');

class Invoker {
  constructor(serviceName, group, version) {
    this.serviceName = serviceName;
    this.group = group;
    this.version = version;
    this.registryPath = this[GETREGISTRYPATH]();
    this.providerPath = `/dubbo/${serviceName}/providers`;
    this.configuratorsPath = `/dubbo/${serviceName}/configurators`;
    this[PROVIDERS] = new Map();
    this[SIGNLOCK] = true;
    this[LOCKQUEUE] = [];
    this[VERSIONTESTER] = new RegExp(`default.version=${version}`, 'g');
  }

  /**
   * 获取所有的provider
   * @return {Promise}
   */
  [GETALLPROVIDERS]() {
    return new Promise((resolve) => {
      if (this[SIGNLOCK]) {
        this[LOCKQUEUE].push(resolve);
      } else {
        resolve(this[PROVIDERS]);
      }
    });
  }

  /**
   * 获取当前invoker的注册地址
   * @return {string}
   */
  [GETREGISTRYPATH]() {
    const param = Object.assign({ group: this.group }, Config.getDescription());
    const descriptions = `consumer://${Config.ip}/${this.serviceName}?${QS.stringify(param)}`;
    return `/dubbo/${this.serviceName}/consumers/${encodeURIComponent(descriptions)}`;
  }

  /**
   * 添加新的provider
   * @param providerString provider配置链接地址
   */
  [ADDPROVIDER](providerString) {
    //判断provider的版本是否和当前invoker版本一致
    if (this[VERSIONTESTER].test(providerString)) {
      let provider = new Provider(providerString);
      if (!this[PROVIDERS].has(provider.toString())) {
        this[PROVIDERS].set(provider.toString(), provider);
      } else {
        provider = null;
      }
    }
  }

  /**
   * 覆盖provider配置信息
   * @param overrideString
   */
  [OVERRIDEPROVIDER](overrideString) {
    let configUrl = URL.parse(overrideString);
    if (this[PROVIDERS].has(configUrl.host)) {
      this[PROVIDERS].get(configUrl.host).override(QS.parse(configUrl.query));
    }
  }

  /**
   * 恢复所有提供者
   * 将锁定状态,down状态恢复为正常
   */
  [RESUMEPROVIDERS]() {
    [...this[PROVIDERS].values()].forEach((provider) => provider.resume());
  }

  lock() {
    this[SIGNLOCK] = true;
    return this;
  }

  /**
   * 解锁当前实例的锁定状态
   * 并将恢复执行所有锁定期间的请求
   */
  unlock() {
    this[SIGNLOCK] = false;
    while (this[LOCKQUEUE].length > 0) {
      Reflect.apply(this[LOCKQUEUE].shift(), null, [this[PROVIDERS]]);
    }

    return this;
  }

  /**
   * 新增提供者
   * @param providers
   */
  setProviders(providers) {
    this.lock();
    providers.forEach((desc) => this[ADDPROVIDER](desc));
    this.unlock();
    return this;
  }

  /**
   * 配置所有的提供者
   * @param configs
   */
  configProviders(configs = []) {
    this.lock();
    configs.forEach((conf) => this[OVERRIDEPROVIDER](conf));

    if (configs.length === 0) {
      this[RESUMEPROVIDERS]();
    }

    this.unlock();
    return this;
  }

  toString() {
    return Invoker.getDescription(this.serviceName, this.group, this.version);
  }

  getProvider(protocol) {
    return this[GETALLPROVIDERS]()
      .then((providers) =>
        cluster(
          this.toString(),
          [...providers.values()].filter((provider) => provider.protocol === protocol && provider.canUse())
        )
      );
  }

  /**
   * 描述信息
   * @return {string}
   */
  static getDescription(serviceName, group, version) {
    return `${serviceName}_${group}_${version}`;
  }
}

module.exports = Invoker;
