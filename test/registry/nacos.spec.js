const { EventEmitter } = require('events');
const sinon = require('sinon');
const chai = require('chai');
chai.use(require('sinon-chai'));
chai.use(require('chai-as-promised'));

const expect = chai.expect;
const registry = require('../../lib/registry');
const NacosRegistry = require('../../lib/registry/nacos');


const nacosConfig = { url: 'mse-c4b291e0-p.nacos-ans.mse.aliyuncs.com', options: {}, registryType: 'nacos' };

const getRandomName = (str) => `${str}${Math.floor(Math.random() * 1000000)}`;

describe('registry', () => {

  const nacosStub = sinon.stub(NacosRegistry, 'createInstance');

  beforeEach(() => {
    nacosStub.reset();
  });


  it('nacos init registry', () => {
    nacosStub.callsFake(() => {
      const emitter = new EventEmitter();
      process.nextTick(() => {
        emitter.emit('init');
      });
      return emitter;
    });

    return expect(registry.init(nacosConfig)).to.be.fulfilled;
  });

  describe('functions', () => {

    it('nacos remove', () => {
      it('remove', () => {
        nacosStub.callsFake(() => {
          const emitter = new EventEmitter();
          emitter.removePath = sinon.stub().resolves();
          process.nextTick(() => {
            emitter.emit('init');
          });
          return emitter;
        });
  
        return registry
          .init(nacosConfig)
          .then(() => expect(registry.remove({ serviceName: 'com.test.service', ip: '127.0.0.1', port: 80 })).to.be.fulfilled);
      });
    });


    it('nacos dispose', () => {
      nacosStub.callsFake(() => {
        const emitter = new EventEmitter();
        emitter.dispose = sinon.stub().resolves();
        process.nextTick(() => {
          emitter.emit('init');
        });
        return emitter;
      });

      return registry
        .init(nacosConfig)
        .then(() => expect(registry.dispose()).to.be.fulfilled);
    });

  });
});
