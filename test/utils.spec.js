const expect = require('chai').expect;

const checkValue = require('../lib/utils/checkValue');
const configCheck = require('../lib/utils/configCheck');
const deepExtend = require('../lib/utils/deepExtend');
const deepFreeze = require('../lib/utils/deepFreeze');
const getLocalIp = require('../lib/utils/getLocalIp');

describe('utils', () => {
  describe('checkValue', () => {
    it('value exist should not throw error', () => {
      const obj = { a: 1 };
      expect(() => {
        checkValue(obj, 'a');
      }).to.not.throw(Error);
    });

    it('obj is undefined should throw error', () => {
      const obj = undefined;
      expect(() => {
        checkValue(obj, 'test');
      }).to.throw(Error);
    });

    it('value not exist should throw error', () => {
      const obj = { a: 1 };
      expect(() => {
        checkValue(obj, 'b');
      }).to.throw(Error);
    });
  });

  describe('configCheck', () => {
    const schema = {
      type: 'object',
      required: ['id'],
      properties: {
        id: {
          type: 'number'
        }
      },
    };

    it('check pass', () => {
      expect(() => {
        configCheck({ id: 1 }, schema);
      }).to.not.throw(Error);
    });

    it('check not pass', () => {
      expect(() => {
        configCheck({}, schema);
      }).to.throw(Error);
    });
  });

  describe('deepExtend', () => {
    it('call without arg should return undefined', () => {
      expect(deepExtend()).to.be.undefined;
    });

    it('call with one arg should return with arg', () => {
      const obj = {};
      expect(deepExtend(obj)).to.be.equal(obj);
    });

    it('if extended obj is not object, do nothing', () => {
      const obj = {};
      expect(deepExtend(obj, [])).to.be.equal(obj);
      expect(deepExtend(obj, '')).to.be.equal(obj);
    });

    it('result object should have nested properties', () => {
      const source = {
        a: {
          b: 1,
        },
        c: 2,
      };

      deepExtend(source, { a: { d: 3 }, e: 4 });
      expect(source.a).to.be.deep.equal({ b: 1, d: 3 });
      expect(source).to.have.property('e');
    });

    context('deepCloneArray', () => {
      it('object array', () => {
        const obj = { a: [{ b: 1 }] };
        expect(deepExtend({}, obj)).to.be.deep.equal(obj);
      });

      it('null array', () => {
        const obj = { a: [null] };
        expect(deepExtend({}, obj)).to.be.deep.equal(obj);
      });

      it('array array', () => {
        const obj = { a: [[{ b: 1 }]] };
        expect(deepExtend({}, obj)).to.be.deep.equal(obj);
      });

      it('specific array', () => {
        const obj = { a: [new Date()] };
        expect(deepExtend({}, obj)).to.be.deep.equal(obj);
      });
    });

    context('cloneSpecificValue', () => {
      it('Buffer', () => {
        const obj = { a: Buffer.alloc(10) };
        expect(deepExtend({}, obj)).to.be.deep.equal(obj);
      });

      it('RegExp', () => {
        const obj = { a: /123/ };
        expect(deepExtend({}, obj)).to.be.deep.equal(obj);
      });
    });
  });

  describe('deepFreeze', () => {
    it('nested properties should be freezed', () => {
      const a = { b: { test: 1 } };
      deepFreeze(a);
      expect(a).to.be.frozen;
      expect(a.b).to.be.frozen;
    });
  });

  describe('getLocalIp', () => {
    it('result should be a ip address', () => {
      const ip = getLocalIp();

      expect(/(\d{1,3}\.){3}\d{1,3}/.test(ip)).to.be.true;
    });
  });
});
