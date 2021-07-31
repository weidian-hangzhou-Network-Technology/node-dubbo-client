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

  setupPath(type = 'zookeeper') {
    if (type === 'zookeeper') {
      this.path = {
        configurator: `/dubbo/${this.service}/configurators`,
        provider: `/dubbo/${this.service}/providers`,
        consumer: `/dubbo/${this.service}/consumers`,
      };
    } else {
      this.path = {
        configurator: `configurators:${this.service}:${this.version}`,
        provider: `providers:${this.service}:${this.version}:`,
        consumer: `consumers:${this.service}:${this.version}:`,
      };
    }
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
