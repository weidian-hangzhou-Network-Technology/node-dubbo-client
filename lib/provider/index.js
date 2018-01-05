/* eslint-disable no-underscore-dangle */
const Invoker = require('./invoker');
const Server = require('./server');

class Provider {
  static init(serviceInfo) {
    if (Provider.instances) {
      throw new Error(`service ${Invoker.getDescription(serviceInfo)} has been registered`);
    }

    Provider.called = true;
    Provider.instances = new Provider(serviceInfo);

    return Provider.instances;
  }

  constructor(serviceInfo) {
    this.invoker = Invoker.createInstance(serviceInfo);
    this.server = Server.createInstance();
  }

  configServer(options) {
    this.server.config(options);
    return this;
  }

  listen(port) {
    this.invoker.setPort(port);
    return this
      .server
      .listen(port)
      .then(() => this.invoker.init());
  }

  addMethods(functions) {
    const funcNames = Object.keys(functions);

    if (funcNames.length === 0) {
      throw new Error('methods should have handlers');
    }

    funcNames.forEach((name) => {
      this.addMethod(name, functions[name]);
    });
    return this;
  }

  addMethod(functionName, handler) {
    if (!functionName || !handler) {
      throw new Error('function name or handler should not be empty');
    }

    this.invoker.addMethod(functionName);
    this.server.addHandler(functionName, handler);
    return this;
  }

  /**
   * dispose provider
   * should remove invoker from zookeeper before server closed
   * @return {Promise.<void>}
   */
  dispose() {
    return this.invoker.dispose();
  }
}

module.exports = Provider;
