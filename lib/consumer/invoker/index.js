const QS = require('querystring');
const URL = require('url');
const Config = require('../config');
const Provider = require('./provider');
const cluster = require('./cluster');
const InvokerBase = require('../../common/invokerBase');

const PROVIDERS = Symbol('PROVIDERS');
const LOCKSIGN = Symbol('LOCKSIGN');
const LOCKQUEUE = Symbol('LOCKQUEUE');
const VERSIONTESTER = Symbol('VERSIONTESTER');

const GETALLPROVIDERS = Symbol('GETALLPROVIDERS');
const RESUMEPROVIDERS = Symbol('RESUMEPROVIDERS');
const ADDPROVIDER = Symbol('ADDPROVIDER');

class Invoker extends InvokerBase {
  constructor({ serviceName, group, version }) {
    super();
    this.serviceName = serviceName;
    this.group = group;
    this.version = version;
    this.providerPath = `/dubbo/${serviceName}/providers`;
    this.configuratorsPath = `/dubbo/${serviceName}/configurators`;
    this[PROVIDERS] = new Map();
    this[LOCKSIGN] = true;
    this[LOCKQUEUE] = [];
    this[VERSIONTESTER] = new RegExp(`version=${version}`, 'g');
  }

  /**
   * 获取所有的provider
   * @return {Promise}
   */
  [GETALLPROVIDERS]() {
    return new Promise((resolve) => {
      if (this[LOCKSIGN]) {
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
  getRegistryPath() {
    const param = Object.assign({ group: this.group, version: this.version }, Config.getDescription());
    const descriptions = `consumer://${Config.ip}/${this.serviceName}?${QS.stringify(param)}`;
    return `/dubbo/${this.serviceName}/consumers/${encodeURIComponent(descriptions)}`;
  }

  getRegistryFolder() {
    return `/dubbo/${this.serviceName}/consumers`;
  }

  /**
   * 添加新的provider
   * @param providerString provider配置链接地址
   */
  [ADDPROVIDER](providerString) {
    let provider = new Provider(decodeURIComponent(providerString));
    if (!this[PROVIDERS].has(provider.toString())) {
      this[PROVIDERS].set(provider.toString(), provider);
    } else {
      provider = null;
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
    this[LOCKSIGN] = true;
    return this;
  }

  /**
   * 解锁当前实例的锁定状态
   * 并将恢复执行所有锁定期间的请求
   */
  unlock() {
    this[LOCKSIGN] = false;
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
    this[PROVIDERS].clear();
    providers.forEach((desc) => this[ADDPROVIDER](desc));
    return this;
  }

  /**
   * 配置所有的提供者
   * @param configs
   */
  configProviders(configs = []) {
    const confs = configs.map((conf) => URL.parse(decodeURIComponent(conf)));
    if (confs.length === 0) {
      this[RESUMEPROVIDERS]();
    } else {
      [...this[PROVIDERS].values()].forEach((provider) => {
        const config = confs.find((conf) => provider.host === conf.host);
        if (config) {
          provider.override(QS.parse(config.query));
        } else {
          provider.resume();
        }
      });
    }

    return this;
  }

  getProvider(protocol) {
    return this[GETALLPROVIDERS]()
      .then((providers) => (
        cluster(
          this.toString(),
          [...providers.values()].filter((provider) => provider.protocol === protocol && provider.canUse()))
      ));
  }

  getAllProviders() {
    return this[GETALLPROVIDERS]();
  }
}

module.exports = Invoker;
