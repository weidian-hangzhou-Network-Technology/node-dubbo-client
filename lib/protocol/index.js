const jsonRpc = require('./jsonrpc');

/**
 * @param {string} type protocol type
 * @return {Object<{request:function,response:function}>}
 */
exports.getProtocol = (type) => {
  switch (type) {
    case 'jsonrpc':
      return jsonRpc;
    default:
      return jsonRpc;
  }
};
