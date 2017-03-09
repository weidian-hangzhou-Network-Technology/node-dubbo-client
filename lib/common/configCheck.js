const AJV = require('ajv');
const deepExtend = require('../utils/deepExtend');

const ajv = new AJV({ removeAdditional: true });

module.exports = (config, schema) => {
  let configCopy = deepExtend({}, config);
  let valid = ajv.validate(schema, configCopy);

  if (!valid) {
    throw new Error(`Config validation error: ${ajv.errorsText()}`);
  }

  return configCopy;
};
