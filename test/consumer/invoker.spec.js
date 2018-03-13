const sinon = require('sinon');
const { EventEmitter } = require('events');
const proxyRequire = require('proxyquire');
const chai = require('chai');
chai.use(require('chai-as-promised'));
chai.use(require('sinon-chai'));

const expect = chai.expect;
const registryEVENTS = require('../../lib/registry').EVENTS;

const commonServiceInfo = { service: 'testService', group: 'testGroup', version: '1.0.0' };

describe('consumer.invoker', () => {
  const registryStubs = new EventEmitter();
  registryStubs.publish = sinon.stub();
  registryStubs.subscribe = sinon.stub();
  const Invoker = proxyRequire('../../lib/consumer/invoker', {
    '../config': {
      ip: '127.0.0.1',
      debug: () => false,
      getDescription: () => ({}),
      getDubboConfig: () => ({}),
    },
    '../registry': registryStubs,
  });

  beforeEach(() => {
    ['publish', 'subscribe'].forEach((key) => {
      registryStubs[key].reset();
    });
    registryStubs.eventNames().forEach((name) => {
      registryStubs.removeAllListeners(name);
    });
  });

  describe('create new invoker', () => {
    context('with service info', () => {
      it('should not throw error', () => {
        expect(() => {
          new Invoker({ service: 'testService', group: 'testGroup', version: 'testVersion' });
        }).to.not.throw(Error);
      });
    });

    context('without service info', () => {
      it('should throw error', () => {
        expect(() => {
          new Invoker();
        }).to.throw(Error);
      });
    });

    context('part of service info', () => {
      it('should throw error', () => {
        expect(() => {
          new Invoker({ service: 'testService' });
        }).to.throw(Error);
      });
    });

    it('setupPath should be called after created', () => {
      const invoker = new Invoker({ service: 'testService', group: 'testGroup', version: 'testVersion' });
      expect(invoker.path).to.be.an('object');
    });
  });

  describe('setProviders', () => {
    it('new providers should be added', () => {
      const invoker = new Invoker(commonServiceInfo);

      expect(invoker.providers.size).to.be.equal(0);
      invoker._setProviders([
        'jsonrpc%3A%2F%2F127.0.0.1%3A10000%2FtestService%3Fdefault.group%3DtestGroup%26default.version%3D1.0.0%26interface%3DtestService%26methods%3Dtest%26server%3Dnode%26side%3Dprovider%26category%3Dproviders',
        'jsonrpc%3A%2F%2F127.0.0.1%3A10001%2FtestService%3Fdefault.group%3DtestGroup%26default.version%3D1.0.0%26interface%3DtestService%26methods%3Dtest%26server%3Dnode%26side%3Dprovider%26category%3Dproviders',
      ]);

      expect(invoker.providers.size).to.be.equal(2);
    });

    it('provider should be ignored, if version does not match', () => {
      const invoker = new Invoker(commonServiceInfo);
      expect(invoker.providers.size).to.be.equal(0);
      invoker._setProviders([
        'jsonrpc%3A%2F%2F127.0.0.1%3A10000%2FtestService%3Fdefault.group%3DtestGroup%26default.version%3D2.0.0%26interface%3DtestService%26methods%3Dtest%26server%3Dnode%26side%3Dprovider%26category%3Dproviders',
      ]);
      expect(invoker.providers.size).to.be.equal(0);
    });

    it('wrong version provider should be ignored', () => {
      const invoker = new Invoker(commonServiceInfo);

      expect(invoker.providers.size).to.be.equal(0);
      invoker._setProviders([
        'jsonrpc%3A%2F%2F127.0.0.1%3A10000%2FtestService%3Fdefault.group%3DtestGroup%26default.version%3D1.0.0%26interface%3DtestService%26methods%3Dtest%26server%3Dnode%26side%3Dprovider%26category%3Dproviders',
        'jsonrpc%3A%2F%2F127.0.0.1%3A10001%2FtestService%3Fdefault.group%3DtestGroup%26default.version%3D1.0.1%26interface%3DtestService%26methods%3Dtest%26server%3Dnode%26side%3Dprovider%26category%3Dproviders',
      ]);

      expect(invoker.providers.size).to.be.equal(1);
    });

    it('same host provider should override provider info', () => {
      const invoker = new Invoker(commonServiceInfo);
      invoker._setProviders([
        'jsonrpc%3A%2F%2F127.0.0.1%3A10000%2FtestService%3Fdefault.group%3DtestGroup%26default.version%3D1.0.0%26interface%3DtestService%26methods%3Dtest%26server%3Dnode%26side%3Dprovider%26category%3Dproviders',
      ]);

      const methods = [...invoker.providers.values()][0].methods;

      invoker._setProviders([
        'jsonrpc%3A%2F%2F127.0.0.1%3A10000%2FtestService%3Fdefault.group%3DtestGroup%26default.version%3D1.0.0%26interface%3DtestService%26methods%3Dtest%2Ctest1%26server%3Dnode%26side%3Dprovider%26category%3Dproviders',
      ]);

      const updatedMethods = [...invoker.providers.values()][0].methods;
      expect(invoker.providers.size).to.be.equal(1);
      expect(updatedMethods).to.not.be.equal(methods);
      expect(updatedMethods).to.have.lengthOf(2);
    });
  });

  describe('configProviders', () => {
    it('config provider should create new provider if provider does not exist', () => {
      const invoker = new Invoker(commonServiceInfo);
      invoker._configProviders([
        'override%3A%2F%2F127.0.0.1%3A10000%2FtestService%3Fcategory%3Dconfigurators%26disabled%3Dtrue%26dynamic%3Dfalse%26enabled%3Dtrue%26group%3DtestGroup%26version%3D1.0.0'
      ]);

      expect(invoker.providers.size).to.be.equal(1);
    });

    it('if config info is empty, override provider should be cleared', () => {
      const invoker = new Invoker(commonServiceInfo);
      invoker._configProviders([
        'override%3A%2F%2F127.0.0.1%3A10000%2FtestService%3Fcategory%3Dconfigurators%26disabled%3Dtrue%26dynamic%3Dfalse%26enabled%3Dtrue%26group%3DtestGroup%26version%3D1.0.0'
      ]);
      expect(invoker.providers.size).to.be.equal(1);
      invoker._configProviders([]);
      expect(invoker.providers.size).to.be.equal(0);
    });

    it('if provider version does not match config version, config should ignore', () => {
      const invoker = new Invoker(commonServiceInfo);
      invoker._setProviders([
        'jsonrpc%3A%2F%2F127.0.0.1%3A10000%2FtestService%3Fdefault.group%3DtestGroup%26default.version%3D1.0.0%26interface%3DtestService%26methods%3Dtest%26server%3Dnode%26side%3Dprovider%26category%3Dproviders',
      ]);
      invoker._configProviders([
        'override%3A%2F%2F127.0.0.1%3A10000%2FtestService%3Fcategory%3Dconfigurators%26disabled%3Dtrue%26dynamic%3Dfalse%26enabled%3Dtrue%26group%3DtestGroup%26version%3D2.0.0'
      ]);
      expect(invoker.providers.size).to.be.equal(1);
      const provider = [...invoker.providers.values()][0];
      expect(provider.disabled).to.be.false;
      expect(provider.enabled).to.be.true;
    });

    it('if provider exist, provider config should be overrided by config info', () => {
      const invoker = new Invoker(commonServiceInfo);
      invoker._setProviders([
        'jsonrpc%3A%2F%2F127.0.0.1%3A10000%2FtestService%3Fdefault.group%3DtestGroup%26default.version%3D1.0.0%26interface%3DtestService%26methods%3Dtest%2Ctest1%26server%3Dnode%26side%3Dprovider%26category%3Dproviders',
      ]);

      const provider = [...invoker.providers.values()][0];
      expect(provider.disabled).to.be.false;
      expect(provider.enabled).to.be.true;

      invoker._configProviders([
        'override%3A%2F%2F127.0.0.1%3A10000%2FtestService%3Fcategory%3Dconfigurators%26disabled%3Dtrue%26dynamic%3Dfalse%26enabled%3Dfalse%26group%3DtestGroup%26version%3D1.0.0'
      ]);

      expect(invoker.providers.size).to.be.equal(1);
      expect(provider.disabled).to.be.true;
      expect(provider.enabled).to.be.false;
    });

    it('create provider with config info, should keep config properties after provider set', () => {
      const invoker = new Invoker(commonServiceInfo);
      invoker._configProviders([
        'override%3A%2F%2F127.0.0.1%3A10000%2FtestService%3Fcategory%3Dconfigurators%26disabled%3Dtrue%26dynamic%3Dfalse%26enabled%3Dtrue%26group%3DtestGroup%26version%3D1.0.0'
      ]);

      invoker._setProviders([
        'jsonrpc%3A%2F%2F127.0.0.1%3A10000%2FtestService%3Fdefault.group%3DtestGroup%26default.version%3D1.0.0%26interface%3DtestService%26methods%3Dtest%2Ctest1%26server%3Dnode%26side%3Dprovider%26category%3Dproviders',
      ]);

      const provider = [...invoker.providers.values()][0];

      expect(invoker.providers.size).to.be.equal(1);
      expect(provider.enabled).to.be.true;
      expect(provider.disabled).to.be.true;
      expect(provider.protocol).to.be.equal('jsonrpc');
    });

    it('configed provider should resume config properties if config list is empty', () => {
      const invoker = new Invoker(commonServiceInfo);
      invoker._setProviders([
        'jsonrpc%3A%2F%2F127.0.0.1%3A10000%2FtestService%3Fdefault.group%3DtestGroup%26default.version%3D1.0.0%26interface%3DtestService%26methods%3Dtest%2Ctest1%26server%3Dnode%26side%3Dprovider%26category%3Dproviders',
      ]);
      invoker._configProviders([
        'override%3A%2F%2F127.0.0.1%3A10000%2FtestService%3Fcategory%3Dconfigurators%26disabled%3Dtrue%26dynamic%3Dfalse%26enabled%3Dtrue%26group%3DtestGroup%26version%3D1.0.0'
      ]);

      const provider = [...invoker.providers.values()][0];

      expect(provider.disabled).to.be.true;
      invoker._configProviders([]);
      expect(provider.disabled).to.be.false;
      expect(provider.enabled).to.be.true;
    });

    it('provider should resume if provider is not list in config list', () => {
      const invoker = new Invoker(commonServiceInfo);
      invoker._setProviders([
        'jsonrpc%3A%2F%2F127.0.0.2%3A10000%2FtestService%3Fdefault.group%3DtestGroup%26default.version%3D1.0.0%26interface%3DtestService%26methods%3Dtest%2Ctest1%26server%3Dnode%26side%3Dprovider%26category%3Dproviders',
      ]);
      invoker._configProviders([
        'override%3A%2F%2F127.0.0.2%3A10000%2FtestService%3Fcategory%3Dconfigurators%26disabled%3Dtrue%26dynamic%3Dfalse%26enabled%3Dtrue%26group%3DtestGroup%26version%3D1.0.0'
      ]);
      const provider1 = invoker._getValidProviders('jsonrpc');
      expect(provider1).to.have.lengthOf(0);
      invoker._configProviders([
        'override%3A%2F%2F127.0.0.1%3A10000%2FtestService%3Fcategory%3Dconfigurators%26disabled%3Dtrue%26dynamic%3Dfalse%26enabled%3Dtrue%26group%3DtestGroup%26version%3D1.0.0'
      ]);

      const provider2 = invoker._getValidProviders('jsonrpc');
      expect(provider2).to.have.lengthOf(1);
      expect(provider2[0]).to.have.property('host', '127.0.0.2:10000');
    });
  });

  describe('_getValidProviders', () => {
    it('it should returned with protocol', () => {
      const invoker = new Invoker(commonServiceInfo);
      invoker._setProviders([
        'jsonrpc%3A%2F%2F127.0.0.1%3A10010%2FtestService%3Fdefault.group%3DtestGroup%26default.version%3D1.0.0%26interface%3DtestService%26methods%3Dtest%26server%3Dnode%26side%3Dprovider%26category%3Dproviders',
      ]);
      invoker._configProviders([
        'override%3A%2F%2F127.0.0.1%3A10000%2FtestService%3Fcategory%3Dconfigurators%26disabled%3Dtrue%26dynamic%3Dfalse%26enabled%3Dtrue%26group%3DtestGroup%26version%3D1.0.0'
      ]);

      expect(invoker.providers.size).to.be.equal(2);

      const providers = invoker._getValidProviders('jsonrpc');
      expect(providers).to.have.lengthOf(1);
      expect(providers[0].protocol).to.be.equal('jsonrpc');
    });

    it('disabled provider should not returned', () => {
      const invoker = new Invoker(commonServiceInfo);
      invoker._setProviders([
        'jsonrpc%3A%2F%2F127.0.0.1%3A10000%2FtestService%3Fdefault.group%3DtestGroup%26default.version%3D1.0.0%26interface%3DtestService%26methods%3Dtest%26server%3Dnode%26side%3Dprovider%26category%3Dproviders',
      ]);
      invoker._configProviders([
        'override%3A%2F%2F127.0.0.1%3A10000%2FtestService%3Fcategory%3Dconfigurators%26disabled%3Dtrue%26dynamic%3Dfalse%26enabled%3Dtrue%26group%3DtestGroup%26version%3D1.0.0'
      ]);

      const providers = invoker._getValidProviders('jsonrpc');
      expect(providers).to.have.lengthOf(0);
    });
  });

  describe('getProviders', () => {
    it('should returned immediatly if invoker is ready', () => {
      const invoker = new Invoker(commonServiceInfo);
      invoker.ready = true;

      expect(invoker._initQueue).to.have.lengthOf(0);
      return expect(invoker.getProviders('jsonrpc'))
        .to.be.fulfilled
        .then(() => {
          expect(invoker._initQueue).to.have.lengthOf(0);
        });
    });
  });

  describe('disableProvider', () => {
    it('invoker should not be valid if it has been disabled', () => {
      const invoker = new Invoker(commonServiceInfo);
      invoker._setProviders([
        'jsonrpc%3A%2F%2F127.0.0.1%3A10000%2FtestService%3Fdefault.group%3DtestGroup%26default.version%3D1.0.0%26interface%3DtestService%26methods%3Dtest%26server%3Dnode%26side%3Dprovider%26category%3Dproviders',
      ]);
      const providers = invoker._getValidProviders('jsonrpc');
      expect(providers).to.have.lengthOf(1);
      invoker.disableProvider('127.0.0.1:10000');
      expect(invoker._getValidProviders('jsonrpc')).to.have.lengthOf(0);
    });

    it('provider register after disabled should be valid', () => {
      const invoker = new Invoker(commonServiceInfo);
      invoker._setProviders([
        'jsonrpc%3A%2F%2F127.0.0.1%3A10000%2FtestService%3Fdefault.group%3DtestGroup%26default.version%3D1.0.0%26interface%3DtestService%26methods%3Dtest%26server%3Dnode%26side%3Dprovider%26category%3Dproviders',
      ]);
      expect(invoker.providers.size).to.be.equal(1);
      invoker.disableProvider('127.0.0.1:10000');
      expect(invoker._getValidProviders('jsonrpc')).to.have.lengthOf(0);
      invoker._setProviders([
        'jsonrpc%3A%2F%2F127.0.0.1%3A10000%2FtestService%3Fdefault.group%3DtestGroup%26default.version%3D1.0.0%26interface%3DtestService%26methods%3Dtest%26server%3Dnode%26side%3Dprovider%26category%3Dproviders',
      ]);
      expect(invoker.providers.size).to.be.equal(1);
      expect(invoker._getValidProviders('jsonrpc')).to.have.lengthOf(1);
    });
  });

  describe('init', () => {
    it('invoker set config should be called after event emit', (done) => {
      const setSpy = sinon.spy();
      const configSpy = sinon.spy();
      registryStubs.subscribe.callsFake((path) => {
        registryStubs.emit(registryEVENTS.SUBSCRIBE(path), []);
      });
      const invoker = new Invoker(commonServiceInfo);
      invoker._setProviders = setSpy;
      invoker._configProviders = configSpy;

      setTimeout(() => {
        expect(setSpy).to.have.been.calledOnce;
        expect(configSpy).to.have.been.calledOnce;
        done();
      }, 300);
    });

    it('getProviders should return after invoker inited', (done) => {
      const invoker = new Invoker(commonServiceInfo);
      const configSubscribeSpy = sinon.spy();
      registryStubs.subscribe.callsFake((path) => {
        registryStubs.emit(registryEVENTS.SUBSCRIBE(path), []);
        if (path === invoker.path.configurator) {
          configSubscribeSpy();
        }
      });

      const getProviderSpy = sinon.spy();
      invoker.getProviders('jsonrpc').then(getProviderSpy);

      setTimeout(() => {
        expect(getProviderSpy).to.have.been.calledAfter(configSubscribeSpy);
        done();
      }, 300);
    });
  });

  describe('bindEvents', () => {
    it('invoker should be changed after event emit', (done) => {
      const invoker = new Invoker(commonServiceInfo);
      invoker._bindEvents();

      expect(invoker.providers.size).to.be.equal(0);
      const setSpy = sinon.spy();
      const configSpy = sinon.spy();
      invoker._setProviders = setSpy;
      invoker._configProviders = configSpy;
      registryStubs.emit(registryEVENTS.SUBSCRIBE(invoker.path.provider), []);
      registryStubs.emit(registryEVENTS.SUBSCRIBE(invoker.path.configurator), []);
      setTimeout(() => {
        expect(setSpy).to.have.been.calledOnce;
        expect(configSpy).to.have.been.calledOnce;
        done();
      }, 300);
    });
  });
});
