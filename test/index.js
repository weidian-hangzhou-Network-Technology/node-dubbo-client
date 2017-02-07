const expect = require('chai').expect;
const provider = require('../lib/provider');
const consumer = require('../lib/consumer');

describe('provider to consumer', () => {
  before(() => {
    const p1 = provider.init({
      description: {
        application: 'test',
        'application.version': '1.0',
        dubbo: 'dubbo_node_client_1.0',
        pid: process.pid,
        version: '1.0.0',
      },
      registry: {
        url: '192.168.0.110:2181',
      },
      port: 9009,
      debug: true,
    });

    const p2 = consumer.init({
      description: {
        application: 'test',
        'application.version': '1.0',
        dubbo: 'dubbo_node_client_1.0',
        pid: process.pid,
        version: '1.0.0',
      },
      registry: {
        url: '192.168.0.110:2181',
      },
      dubbo: {
        providerTimeout: 10 * 1000,
      },
      debug: true,
    });

    return Promise
      .all([p1, p2])
      .then(() => {
        console.debug = console.log;
        provider.setLog(console);
        consumer.setLog(console);
      });
  });

  describe('make call', () => {
    before(() =>
      provider.addProvider({
        serviceName: 'node.test1Service',
        group: 'node',
        version: '0.0.1',
        methods: { test: (...args) => Promise.resolve({ result: 'hello world!' }), },
      })
    );

    after(() => consumer.dispose().then(() => provider.dispose()));

    it('data access', () =>
      consumer
        .getService({
          serviceName: 'node.test1Service',
          group: 'node',
          version: '0.0.1',
        })
        .call('test', [])
        .then((result) => expect(result).to.deep.equal({ result: 'hello world!' }))
    );
  });

});
