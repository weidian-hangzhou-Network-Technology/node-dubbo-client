const sinon = require('sinon');
const proxyRequire = require('proxyquire');
const chai = require('chai');
chai.use(require('sinon-chai'));
chai.use(require('chai-as-promised'));

const expect = chai.expect;

const commonServiceInfo = { service: 'testService', group: 'testGroup', version: 'testVersion' };

describe('provider.invoker', () => {
  const registryStubs = {
    publish: sinon.stub(),
    on: sinon.stub(),
    remove: sinon.stub(),
    dispose: sinon.stub(),
  };
  const Invoker = proxyRequire('../../lib/provider/invoker', {
    '../registry': registryStubs,
    '../config': {
      ip: '127.0.0.1',
      getDescription: () => ({}),
    },
  });

  beforeEach(() => {
    ['publish', 'on', 'remove', 'dispose'].forEach((key) => {
      registryStubs[key].reset();
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

  describe('addMethod', () => {
    it('should not throw error', () => {
      const invoker = new Invoker(commonServiceInfo);
      expect(() => {
        invoker.addMethod('test');
      }).to.not.throw(Error);
    });

    it('should throw error if function add twice', () => {
      const invoker = new Invoker(commonServiceInfo);
      invoker.addMethod('test');
      expect(() => {
        invoker.addMethod('test');
      }).to.throw(Error);
    });
  });

  describe('init', () => {
    it('methods length is 0 should throw error', () => {
      const invoker = new Invoker(commonServiceInfo);
      expect(() => {
        invoker.init();
      }).to.throw(Error);
    });

    it('it should throw error if port is null', () => {
      const invoker = new Invoker(commonServiceInfo);
      invoker.addMethod('test');
      expect(() => {
        invoker.init();
      }).to.throw(Error);
    });

    it('registry.publish should be called', () => {
      const invoker = new Invoker(commonServiceInfo);
      invoker.addMethod('test');
      invoker.setPort(10000);
      invoker.init();
      expect(registryStubs.publish).to.have.been.called;
      const args = registryStubs.publish.args[0];
      console.log(args);
      expect(args[0]).to.be.a('string');
      expect(args[1]).to.be.a('string');
    });
  });

  describe('dispose', () => {
    context('init have not been called', () => {
      it('should throw error', () => {
        const invoker = new Invoker(commonServiceInfo);
        expect(() => {
          invoker.dispose();
        }).to.throw(Error);
      });
    });

    context('init called', () => {
      it('should not throw error', () => {
        registryStubs.remove.resolves();
        registryStubs.dispose.resolves();
        const invoker = new Invoker(commonServiceInfo);
        invoker.addMethod('test');
        invoker.setPort(10000);
        invoker.init();
        return expect(invoker.dispose()).to.be.fulfilled;
      });
    });
  });
});
