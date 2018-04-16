const expect = require('chai').expect;

const cluster = require('../../lib/consumer/cluster');
const random = require('../../lib/consumer/cluster/random');
const round = require('../../lib/consumer/cluster/round');

describe('consumer.cluster', () => {
  it('providers length is 0 should throw error', () => {
    expect(() => {
      cluster('test', []);
    }).to.throw(Error);
  });

  it('providers length is 1 should return the provider', () => {
    const provider = {};
    expect(cluster('test', [provider])).to.be.equal(provider);
  });

  describe('random', () => {
    it('should return provider given', () => {
      const provider1 = { getWeight: () => 1 };
      const provider2 = { getWeight: () => 2 };
      const result = [];
      (new Array(100).fill('')).forEach(() => {
        result.push(random([provider1, provider2]));
      });

      expect(result.indexOf(provider1)).to.be.greaterThan(-1);
      expect(result.indexOf(provider2)).to.be.greaterThan(-1);
    });
  });

  describe('round', () => {
    it('should return provider in order', () => {
      const providers = [{ name: 1 }, { name: 2 }];
      const result = [];

      (new Array(100).fill('')).forEach(() => {
        result.push(round(providers, 'test'));
      });

      expect(result.every((item, index) => providers[index % 2] === item)).to.be.true;
    });
  });
});
