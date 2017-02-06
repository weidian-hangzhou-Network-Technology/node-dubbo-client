const QS = require('querystring');
const Config = require('../config');
const InvokerBase = require('../../common/invokerBase');

class Invoker extends InvokerBase {
  constructor({ serviceName, group, version, methods, port }) {
    super();
    this.serviceName = serviceName;
    this.group = group;
    this.version = version;
    this.methods = Object.keys(methods);
    this.methodsListeners = methods;
    this.host = `${Config.ip}:${port}`;
  }

  /**
   * 获取当前invoker的注册地址
   * @return {String}
   */
  getRegistryPath(protocol = 'jsonrpc') {
    const param = Object.assign({
      'default.group': this.group,
      'default.version': this.version,
      interface: this.serviceName,
      methods: this.methods.join(','),
    }, Config.getDescription());

    const descriptions = `${protocol}://${this.host}/${this.serviceName}?${QS.stringify(param)}`;

    return `/dubbo/${this.serviceName}/providers/${encodeURIComponent(descriptions)}`;
  }

  getRegistryFolder() {
    return `/dubbo/${this.serviceName}/providers`;
  }
}

module.exports = Invoker;
