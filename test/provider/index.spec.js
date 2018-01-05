const sinon = require('sinon');
const chai = require('chai');
chai.use(require('sinon-chai'));
chai.use(require('chai-as-promised'));

const expect = chai.expect;
const Provider = require('../../lib/provider');
const Server = require('../../lib/provider/server');
const Invoker = require('../../lib/provider/invoker');

const commonServiceInfo = { service: 'testService', group: 'testGroup', version: 'testVersion' };

describe('provider', () => {
  const serverStub = sinon.stub(Server, 'createInstance');
  const serverStubs = {
    config: sinon.stub(),
    listen: sinon.stub(),
    addHandler: sinon.stub(),
  };
  const invokerStub = sinon.stub(Invoker, 'createInstance');
  const invokerStubs = {
    setPort: sinon.stub(),
    init: sinon.stub(),
    addMethod: sinon.stub(),
  };

  beforeEach(() => {
    Provider.instances = null;

    Object.keys(serverStubs).forEach((key) => {
      serverStubs[key].reset();
    });

    Object.keys(invokerStubs).forEach((key) => {
      invokerStubs[key].reset();
    });

    serverStub.reset();
    serverStub.returns(serverStubs);
    invokerStub.reset();
    invokerStub.returns(invokerStubs);
  });

  context('static init', () => {
    it('same service init more than once should throw error', () => {
      serverStub.returns({});
      invokerStub.returns({});

      const serviceInfo = { service: 'testService', group: 'testGroup', version: 'testVersion' };
      expect(() => {
        Provider.init(serviceInfo);
      }).to.not.throw(Error);
      expect(() => {
        Provider.init(serviceInfo);
      }).to.throw(Error);
    });
  });

  describe('functions', () => {
    context('configServer', () => {
      it('server.config should called with given options', () => {
        const options = { a: 1 };
        const provider = Provider.init(commonServiceInfo);
        provider.configServer(options);
        expect(serverStubs.config).to.have.been.calledWith(options);
      });
    });

    context('listen', () => {
      it('invoker and server should be called', () => {
        invokerStubs.init.resolves();
        serverStubs.listen.resolves();

        const provider = Provider.init(commonServiceInfo);
        return expect(provider.listen(1000))
          .to.be.fulfilled
          .then(() => {
            expect(invokerStubs.setPort).to.have.been.calledWith(1000);
            expect(invokerStubs.init).to.have.been.called;
            expect(serverStubs.listen).to.have.been.called;
          });
      });
    });

    context('addMethods', () => {
      it('add with empty object should throw error', () => {
        const provider = Provider.init(commonServiceInfo);
        expect(() => {
          provider.addMethods({});
        }).to.throw(Error);
      });

      it('add methods should call invoker and server', () => {
        const noop = () => {
        };
        const provider = Provider.init(commonServiceInfo);
        provider.addMethods({
          a: noop,
          b: noop,
        });

        expect(serverStubs.addHandler).to.have.been.calledTwice;
        expect(invokerStubs.addMethod).to.have.been.calledTwice;
      });
    });

    context('addMethod', () => {
      it('if function name is empty or handler should throw error', () => {
        const provider = Provider.init(commonServiceInfo);
        expect(() => {
          provider.addMethod(undefined, () => {
          });
        }).to.throw(Error);

        expect(() => {
          provider.addMethod('test');
        }).to.throw(Error);
      });

      it('add methods should call invoker and server', () => {
        const provider = Provider.init(commonServiceInfo);
        provider.addMethod('test', () => {
        });
        expect(serverStubs.addHandler).to.have.been.calledOnce;
        expect(invokerStubs.addMethod).to.have.been.calledOnce;
      });
    });
  });
});
