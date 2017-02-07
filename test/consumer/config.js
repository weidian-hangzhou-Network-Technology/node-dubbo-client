const expect = require('chai').expect;
const Check = require('../../lib/consumer/config/check');
const Config = require('../../lib/consumer/config');
const deepExtend = require('../../lib/utils/deepExtend');

describe('config check', () => {
  it('simple check', () => {
    const options = {
      description: {
        application: 'test',
        dubbo: 'test',
      },
      registry: {
        url: '192.168.0.100:12000',
      },
    };
    expect(function () {
      const result = Check(options);
      expect(result).to.deep.equal(options);
    }).to.not.throw(Error);
  });

  it('miss required property', () => {
    const options = {
      description: {
        application: 'test',
        dubbo: 'test',
      },
    };
    expect(function () {
      Check(options);
    }).to.throw(Error);
  });

  it('useless properties filter', () => {
    const options = {
      description: {
        application: 'test',
      },
      registry: {
        url: '192.168.0.100:12000',
      },
      useless1: {
        test: 'test',
      },
      useless2: {
        test2: 1,
      },
    };

    const result = Check(options);
    expect(result).to.deep.equal({
      description: {
        application: 'test',
      },
      registry: {
        url: '192.168.0.100:12000',
      },
    });
  });

  it('config object extend', () => {
    let source = {
      description: {
        application: 'test',
        dubbo: 'test',
      },
      registry: {
        url: '192.168.0.100:12000',
      },
    };
    const dest = Check(deepExtend({
      dubbo: {
        providerTimeout: 45 * 1000,
        weight: 1,
      },
      registry: {
        options: {
          sessionTimeout: 30 * 1000,
          spinDelay: 1000,
          retries: 0,
        },
      },
      loadBalance: 'round',
    }, source));

    expect(dest).to.deep.equal({
      description: {
        application: 'test',
        dubbo: 'test',
      },
      dubbo: {
        providerTimeout: 45 * 1000,
        weight: 1,
      },
      registry: {
        url: '192.168.0.100:12000',
        options: {
          sessionTimeout: 30 * 1000,
          spinDelay: 1000,
          retries: 0,
        },
      },
      loadBalance: 'round',
    });
  });

  it('config override', () => {
    let source = {
      description: {
        application: 'test',
        dubbo: 'test',
      },
      registry: {
        url: '192.168.0.100:12000',
        options: {
          sessionTimeout: 40 * 1000,
        },
      },
      loadBalance: 'random',
    };

    const dest = Check(deepExtend({
      dubbo: {
        providerTimeout: 45 * 1000,
        weight: 1,
      },
      registry: {
        options: {
          sessionTimeout: 30 * 1000,
          spinDelay: 1000,
          retries: 0,
        },
      },
      loadBalance: 'round',
    }, source));

    expect(dest).to.deep.equal({
      description: {
        application: 'test',
        dubbo: 'test',
      },
      dubbo: {
        providerTimeout: 45 * 1000,
        weight: 1,
      },
      registry: {
        url: '192.168.0.100:12000',
        options: {
          sessionTimeout: 40 * 1000,
          spinDelay: 1000,
          retries: 0,
        },
      },
      loadBalance: 'random',
    });

  });
});

describe('config init', () => {
  describe('set options', () => {
    let options = {
      description: {
        dubbo: 'test',
        application: 'node-dubbo-client',
        'application.version': '1.0.0',
      },
      registry: {
        url: '192.168.0.100:12000',
      },
    };

    it('set options', () => {
      expect(function () {
        Config.setOptions(options);
      }).to.not.throw(Error);
    });

    it('options check', () => {
      expect(Config.getOptions()).to.deep.equal({
        description: {
          dubbo: 'test',
          application: 'node-dubbo-client',
          'application.version': '1.0.0',
          side: 'consumer',
          category: 'consumers',
        },
        dubbo: {
          providerTimeout: 45 * 1000,
          weight: 100,
        },
        registry: {
          url: '192.168.0.100:12000',
          options: {
            sessionTimeout: 30 * 1000,
            spinDelay: 1000,
            retries: 0,
          },
        },
        debug: false,
        loadBalance: 'round',
      });
    });

    it('options freeze', () => {
      expect(Config.getOptions()).to.be.frozen;
      expect(Config.getDescription()).to.be.frozen;
      expect(Config.getDubboConfig()).to.be.frozen;
      expect(Config.getRegistry()).to.be.frozen;
    });

    it('getLoadBalance()', () => {
      expect(Config.getLoadBalance()).to.be.equal('round');
    });
  });
});
