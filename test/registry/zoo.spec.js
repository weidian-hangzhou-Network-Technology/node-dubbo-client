const sinon = require('sinon');
const chai = require('chai');
chai.use(require('sinon-chai'));
chai.use(require('chai-as-promised'));

const expect = chai.expect;
const { EventEmitter } = require('events');
const Zookeeper = require('node-zookeeper-client');
const ZOO = require('../../lib/registry/zoo');

/**
 * @type ZooConfig
 */
const zooConfig = { url: '127.0.0.1:9999', options: {} };

describe('registry.zoo', () => {
  const zCreateClientStub = sinon.stub(Zookeeper, 'createClient');

  beforeEach(() => {
    zCreateClientStub.reset();
  });

  context('create zoo client', () => {
    it('init event should emit after zookeeper connected', (done) => {
      const connectStub = sinon.stub();
      const emitter = new EventEmitter();
      zCreateClientStub.callsFake(() => {
        emitter.connect = connectStub;
        return emitter;
      });

      connectStub.callsFake(() => {
        process.nextTick(() => {
          emitter.emit('connected');
        });
      });

      const zoo = new ZOO(zooConfig);
      const initSpy = sinon.spy();
      zoo.on('init', initSpy);

      setTimeout(() => {
        expect(initSpy).to.have.been.calledOnce;
        done();
      }, 300);
    });

    it('getClient should resolved after zookeeper connected', function (done) {
      this.timeout(3000);

      const connectStub = sinon.stub();
      const emitter = new EventEmitter();
      zCreateClientStub.callsFake(() => {
        emitter.connect = connectStub;
        return emitter;
      });

      connectStub.callsFake(() => {
        setTimeout(() => {
          emitter.emit('connected');
        }, 1000);
      });

      const zoo = new ZOO(zooConfig);

      const spy1 = sinon.spy();
      const spy2 = sinon.spy();

      zoo.getClient().then(spy1);
      zoo.getClient().then(spy2);

      expect(spy1).to.have.not.been.called;
      expect(spy2).to.have.not.been.called;

      zoo.on('init', () => {
        setTimeout(() => {
          expect(spy1).to.have.been.calledOnce;
          expect(spy2).to.have.been.calledOnce;
          done();
        }, 300);
      });
    });
  });

  describe('functions', () => {
    const existsStub = sinon.stub();
    const mkdirpStub = sinon.stub();
    const removeStub = sinon.stub();
    const setStub = () => {
      zCreateClientStub.callsFake(() => {
        const emitter = new EventEmitter();
        emitter.connect = () => {
          process.nextTick(() => {
            emitter.emit('connected');
          });
        };
        emitter.exists = existsStub;
        emitter.mkdirp = mkdirpStub;
        emitter.remove = removeStub;
        return emitter;
      });
    };

    beforeEach(() => {
      existsStub.reset();
      mkdirpStub.reset();
      removeStub.reset();
    });

    context('createPath', () => {
      it('called success should not throw error', () => {
        setStub();
        const zoo = new ZOO(zooConfig);
        existsStub.callsArg(1);
        mkdirpStub.callsArg(2);

        return zoo
          .createPath('path', 'fullpath')
          .then(() => {
            expect(existsStub).to.have.been.calledTwice;
            expect(mkdirpStub).to.have.been.calledTwice;
          });
      });

      it('zoo exist calbak with error should rejected with error', () => {
        setStub();
        const zoo = new ZOO(zooConfig);
        existsStub.callsArgWith(1, new Error('exists test'));

        return expect(zoo.createPath('path', 'fullpath'))
          .to.be.rejectedWith(Error, 'Registry:createPath fail. \npath:path fullpath:fullpath\nmsg:exists test');
      });

      it('zoo mkdirp path calbak with error should rejected with error', () => {
        setStub();
        const zoo = new ZOO(zooConfig);
        existsStub.callsArg(1);
        mkdirpStub.withArgs('path').callsArgWith(2, new Error('mkdirp test'));

        return expect(zoo.createPath('path', 'fullpath'))
          .to.be.rejectedWith(Error, 'Registry:createPath fail. \npath:path fullpath:fullpath\nmsg:mkdirp test');
      });

      it('zoo mkdirp fullpath calbak with error should rejected with error', () => {
        setStub();
        const zoo = new ZOO(zooConfig);
        existsStub.callsArg(1);
        mkdirpStub.withArgs('path').callsArgWith(2);
        mkdirpStub.withArgs('fullpath').callsArgWith(2, new Error('mkdirp test'));

        return expect(zoo.createPath('path', 'fullpath'))
          .to.be.rejectedWith(Error, 'Registry:createPath fail. \npath:path fullpath:fullpath\nmsg:mkdirp test');
      });
    });

    context('removePath', () => {
      it('called success should not throw error', () => {
        setStub();
        const zoo = new ZOO(zooConfig);
        removeStub.callsArg(1);
        return zoo
          .removePath('fullpath')
          .then(() => {
            expect(removeStub).to.have.been.calledWith('fullpath');
          });
      });

      it('zoo remove calbak with error should rejected with error', () => {
        setStub();
        const zoo = new ZOO(zooConfig);
        removeStub.callsArgWith(1, new Error('remove test'));
        return expect(zoo.removePath('fullpath'))
          .to.be.rejectedWith(Error, 'Registry:remove invoker fail.\nfullpath:fullpath\nmsg:remove test');
      });
    });

    context('dispose', () => {
      it('client is not ready', () => {
        zCreateClientStub.callsFake(() => {
          const emitter = new EventEmitter();
          emitter.connect = () => {
          };
          return emitter;
        });
        const zoo = new ZOO(zooConfig);
        return expect(zoo.dispose()).to.be.fulfilled;
      });

      it('client is ready', (done) => {
        zCreateClientStub.callsFake(() => {
          const emitter = new EventEmitter();
          emitter.connect = () => {
            process.nextTick(() => {
              emitter.emit('connected');
            });
          };
          emitter.close = () => {
            process.nextTick(() => {
              emitter.emit('disconnected');
            });
          };
          return emitter;
        });
        const zoo = new ZOO(zooConfig);
        setTimeout(() => {
          expect(zoo.dispose()).to.be.fulfilled;
          done();
        }, 300);
      });
    });
  });
});
