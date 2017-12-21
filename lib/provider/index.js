/* eslint-disable no-underscore-dangle */
const Invoker = require('./invoker');
const Server = require('./server');

class Provider {
  static init(serviceInfo) {
    const desc = Invoker.getDescription(serviceInfo);
    if (Provider._instances.includes(desc)) {
      throw new Error(`service ${desc} has been registered`);
    } else {
      Provider._instances.push(desc);
    }

    return new Provider(serviceInfo);
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
}

Provider._instances = [];

module.exports = Provider;
