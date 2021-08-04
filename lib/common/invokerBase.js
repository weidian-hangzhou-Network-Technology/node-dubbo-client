const registry = require('../registry');
/**
 * @class InvokerBase
 */
class InvokerBase {
  static getDescription({ service, group, version }) {
    return `${service}_${group}_${version}`;
  }

  constructor() {
    this.service = '';
    this.group = '';
    this.version = '';
  }

  setupPath() {
    this.path = registry.getRegistryPath(this.service, this.version);
  }

  toString() {
    return InvokerBase.getDescription({
      service: this.service,
      group: this.group,
      version: this.version,
    });
  }
}

module.exports = InvokerBase;
