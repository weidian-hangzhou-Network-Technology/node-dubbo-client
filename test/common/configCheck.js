const expect = require('chai').expect;
const configCheck = require('../../lib/common/configCheck');

const testSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['id'],
  properties: {
    id: {
      type: 'number',
    },
  },
};

describe('common.configCheck', () => {
  it('configCheck should throw error', () => {
    expect(function () {
      configCheck({ id: '123' }, testSchema);
    }).to.throw(Error);
  });
});
