const { EventEmitter } = require('events');
const sinon = require('sinon');
const chai = require('chai');
chai.use(require('sinon-chai'));
chai.use(require('chai-as-promised'));

const expect = chai.expect;
const Zoo = require('../../lib/registry/zoo');
const registry = require('../../lib/registry');

/**
 * @type ZooConfig
 */
const zooConfig = { url: '127.0.0.1:9999', options: {}, registryType: 'zookeeper' };

const getRandomName = (str) => `${str}${Math.floor(Math.random() * 1000000)}`;

// TODO update test case

describe('registry', () => {
  const zooStub = sinon.stub(Zoo, 'createInstance');

  beforeEach(() => {
    zooStub.reset();
  });

  it('EVENTS should return with string', () => {
    expect(registry.EVENTS.PUBLISH('testPublish')).to.be.equal('[Publish]testPublish');
    expect(registry.EVENTS.ERROR('testError')).to.be.equal('[Error]testError');
    expect(registry.EVENTS.SUBSCRIBE('testSubscribe')).to.be.equal('[Subscribe]testSubscribe');
  });

  it('init registry', () => {
    zooStub.callsFake(() => {
      const emitter = new EventEmitter();
      process.nextTick(() => {
        emitter.emit('init');
      });
      return emitter;
    });

    return expect(registry.init(zooConfig)).to.be.fulfilled;
  });

  describe('functions', () => {
    it('remove', () => {
      zooStub.callsFake(() => {
        const emitter = new EventEmitter();
        emitter.removePath = sinon.stub().resolves();
        process.nextTick(() => {
          emitter.emit('init');
        });
        return emitter;
      });

      return registry
        .init(zooConfig)
        .then(() => expect(registry.remove({ fullPath: 'testFullpath' })).to.be.fulfilled);
    });

    it('dispose', () => {
      zooStub.callsFake(() => {
        const emitter = new EventEmitter();
        emitter.dispose = sinon.stub().resolves();
        process.nextTick(() => {
          emitter.emit('init');
        });
        return emitter;
      });

      return registry
        .init(zooConfig)
        .then(() => expect(registry.dispose()).to.be.fulfilled);
    });

    describe('publish', () => {
      const createPathStub = sinon.stub();
      const publishStub = sinon.stub();
      
      const setPublishStub = () => {
        zooStub.callsFake(() => {
          const emitter = new EventEmitter();
          emitter.createPath = createPathStub;
          emitter.publish = publishStub;
          
          process.nextTick(() => {
            emitter.emit('init');
          });
          return emitter;
        });
      };

      beforeEach(() => {
        createPathStub.reset();
        publishStub.reset();
      });

      it('publish before init should throw error', () => {
        registry.ready = false;
        registry.publish({ path:'path', fullPath: 'fullPath' })
          .catch((err) => {
            expect(err.message).to.be.equal('client has not ready.');
          });
      });

      it('emit success event after publish success', (done) => {
        setPublishStub();
        createPathStub.resolves();
        const pathName = getRandomName('path');
        registry
          .init(zooConfig)
          .then(() => {
            const eventSpy = sinon.spy();
            registry.on(registry.EVENTS.PUBLISH(pathName), eventSpy);
            registry.publish({ path: pathName, fullPath: `full${pathName}` });
            setTimeout(() => {
              expect(eventSpy).to.have.been.calledOnce;
              done();
            }, 300);
          });
      });

      it('emit error event after publish failed', (done) => {
        setPublishStub();
        createPathStub.rejects(new Error('path fail'));

        const pathName = getRandomName('path');
        registry
          .init(zooConfig)
          .then(() => {
            registry.on(registry.EVENTS.ERROR(pathName), (err) => {
              expect(err.message).to.be.equal('path fail');
              done();
            });
            registry.publish({ path: pathName,  fullPath: `full${pathName}` }).then(done);
          });
      });
    });

    describe('subscribe', () => {
      const getClientStub = sinon.stub();
      const subscribeStub = sinon.stub();
      const setSubscribeStub = () => {
        zooStub.callsFake(() => {
          const emitter = new EventEmitter();
          emitter.getClient = getClientStub;
          emitter.subscribe = subscribeStub;
          process.nextTick(() => {
            emitter.emit('init');
          });
          return emitter;
        });
      };

      beforeEach(() => {
        getClientStub.reset();
        subscribeStub.reset();
      });

      it('subscribe before init should throw error', () => {
        expect(() => {
          registry.ready = false;
          registry.subscribe({ path: 'path' });
        }).to.throw(Error);
      });

      it('getClient failed should emit error', (done) => {
        setSubscribeStub();
        getClientStub.rejects(new Error('getClient error'));

        const pathName = getRandomName('path');
        registry
          .init(zooConfig)
          .then(() => {
            registry.on(registry.EVENTS.ERROR(pathName), (err) => {
              expect(err.message).to.be.equal('getClient error');
              done();
            });
            registry.subscribe({ path: pathName });
          });
      });

      context('getClient success ', () => {
        it('getChildren failed should emit error', (done) => {
          setSubscribeStub();
          const getChildrenStub = sinon.stub();
          getClientStub.resolves({ getChildren: getChildrenStub });

          const pathName = getRandomName('path');
          getChildrenStub.callsArgWithAsync(2, new Error('getChildren error'));
          registry
            .init(zooConfig)
            .then(() => {
              registry.on(registry.EVENTS.ERROR(pathName), (err) => {
                expect(err.message).to.be.equal('getChildren error');
                done();
              });
              registry.subscribe({ path: pathName });
            });
        });

        it('getChildren success should emit event', (done) => {
          setSubscribeStub();
          const getChildrenStub = sinon.stub();
          getClientStub.resolves({ getChildren: getChildrenStub });

          const pathName = getRandomName('path');
          const childrens = ['1', '2'];
          getChildrenStub.callsArgWithAsync(2, undefined, childrens);
          registry
            .init(zooConfig)
            .then(() => {
              registry.on(registry.EVENTS.SUBSCRIBE(pathName), (data) => {
                expect(data).to.be.deep.equal(childrens);
                done();
              });
              registry.subscribe({ path: pathName });
            });
        });

        it('getChildren listener calbak fail should emit error', (done) => {
          setSubscribeStub();
          const getChildrenStub = sinon.stub();
          getClientStub.resolves({ getChildren: getChildrenStub });

          const pathName = getRandomName('path');
          const childrens = ['1', '2'];
          getChildrenStub
            .onFirstCall().callsArgWithAsync(2, undefined, childrens)
            .onSecondCall().callsArgWithAsync(2, new Error('getChildren error'));

          const eventSubscribeStub = sinon.stub();
          const eventErrorSpy = sinon.spy();

          eventSubscribeStub.callsFake(() => {
            getChildrenStub.callArgWith(1, { getType: () => Zoo.ZOOEVENT.NODE_CHILDREN_CHANGED });
          });

          registry
            .init(zooConfig)
            .then(() => {
              registry.on(registry.EVENTS.SUBSCRIBE(pathName), eventSubscribeStub);
              registry.on(registry.EVENTS.ERROR(pathName), eventErrorSpy);
              registry.subscribe({ path: pathName });
              setTimeout(() => {
                expect(eventSubscribeStub).to.have.been.calledOnce;
                expect(eventErrorSpy).to.have.been.calledAfter(eventSubscribeStub);
                done();
              }, 1000);
            });
        });

        it('getChildren listener calbak with data should emit event', (done) => {
          setSubscribeStub();
          const getChildrenStub = sinon.stub();
          getClientStub.resolves({ getChildren: getChildrenStub });

          const pathName = getRandomName('path');
          const childrens1 = ['1', '2'];
          const childrens2 = ['3', '4'];
          getChildrenStub
            .onFirstCall().callsArgWithAsync(2, undefined, childrens1)
            .onSecondCall().callsArgWithAsync(2, undefined, childrens2);

          const eventSubscribeStub = sinon.stub();
          eventSubscribeStub.callsFake(() => {
            getChildrenStub
              .callArgWith(1, { getType: () => eventSubscribeStub.callCount === 1 ? Zoo.ZOOEVENT.NODE_CHILDREN_CHANGED : '' });
          });

          registry
            .init(zooConfig)
            .then(() => {
              registry.on(registry.EVENTS.SUBSCRIBE(pathName), eventSubscribeStub);
              registry.subscribe({ path: pathName });
              setTimeout(() => {
                expect(eventSubscribeStub).to.have.been.calledTwice;
                expect(eventSubscribeStub.args[0]).to.be.deep.equal([childrens1]);
                expect(eventSubscribeStub.args[1]).to.be.deep.equal([childrens2]);
                done();
              }, 1000);
            });
        });
      });
    });
  });
});
