const QS = require('querystring');
const Config = require('../config');

const GETREGISTRYPATH = Symbol('GETREGISTRYPATH');

class Invoker {
  constructor({ serviceName, group, version, methods, protocols }) {
    this.serviceName = serviceName;
    this.group = group;
    this.version = version;
    this.methods = methods;
    this.protocols = protocols;
    this.registryPaths = this[GETREGISTRYPATH]();
  }

  /**
   * 获取当前invoker的注册地址
   * @return {Array}
   */
  [GETREGISTRYPATH]() {
    const param = Object.assign({
      group: this.group,
      interface: this.serviceName,
      methods: this.methods.join(','),
    }, Config.getDescription());

    let paths = [];

    this.protocols.forEach((protocol) => {
      const descriptions = `protocol://${Config.ip}/${this.serviceName}?${QS.stringify(param)}`;
      paths.push(`/dubbo/${this.serviceName}/providers/${encodeURIComponent(descriptions)}`);
    });

    return paths;
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
