const AJV = require('ajv');
const deepExtend = require('../utils/deepExtend');

const ajv = new AJV({ removeAdditional: true });

module.exports = (config, schema) => {
  let configCopy = deepExtend({}, config);
  const validate = ajv.compile(schema);
  const valid = validate(configCopy);

  if (!valid) {
    throw new Error(`Config validation error: ${ajv.errorsText()}`);
  }

  return configCopy;
};
