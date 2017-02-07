const expect = require('chai').expect;
const configCheck = require('../../lib/common/configCheck');
const schema = require('../../lib/provider/config/schema.json');
const deepExtend = require('../../lib/utils/deepExtend');

describe('config check', () => {
  it('with port', () => {
    const options = {
      description: {
        application: 'test',
        dubbo: 'test',
        category: 'providers',
        side: 'provider',
      },
      registry: {
        url: '192.168.0.100:12000',
      },
      port: 9009,
    };

    expect(function () {
      const result = configCheck(options, schema);
      expect(result).to.deep.equal(options);
    }).to.not.throw(Error);
  });

  it('without port', () => {
    const options = {
      description: {
        application: 'test',
        dubbo: 'test',
        category: 'providers',
        side: 'provider',
      },
      registry: {
        url: '192.168.0.100:12000',
      },
    };

    expect(function () {
      const result = configCheck(options, schema);
      expect(result).to.deep.equal(options);
    }).to.not.throw(Error);
  });
});
