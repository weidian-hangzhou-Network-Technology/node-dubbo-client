/**
 * @class InvokerBase
 */
class InvokerBase {
  static getDescription({ service, group, version }) {
    return `${service}_${group}_${version}`;
  }

  constructor() {
    this.serviceName = '';
    this.group = '';
    this.version = '';
  }

  setupPath() {
    this.path = {
      configurator: `/dubbo/${this.serviceName}/configurators`,
      provider: `/dubbo/${this.serviceName}/providers`,
      consumer: `/dubbo/${this.serviceName}/consumers`,
    };
  }

  toString() {
    return InvokerBase.getDescription({
      service: this.serviceName,
      group: this.group,
      version: this.version,
    });
  }
}

module.exports = InvokerBase;
