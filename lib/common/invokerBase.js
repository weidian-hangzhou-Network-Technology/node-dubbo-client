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
    this.path = {
      configurator: `/dubbo/${this.service}/configurators`,
      provider: `/dubbo/${this.service}/providers`,
      consumer: `/dubbo/${this.service}/consumers`,
    };
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
