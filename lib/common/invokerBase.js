class InvokerBase {
  toString() {
    return InvokerBase.getDescription({
      serviceName: this.serviceName,
      group: this.group,
      version: this.version,
    });
  }

  /**
   * 描述信息
   * @return {string}
   */
  static getDescription({ serviceName, group, version }) {
    return `${serviceName}_${group}_${version}`;
  }
}

module.exports = InvokerBase;
