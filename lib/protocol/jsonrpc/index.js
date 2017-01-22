const Post = require('./post');

function getRandomId() {
  return `${Date.now()}${Math.floor(Math.random() * 100000)}`;
}

module.exports = (service, providerHost, method, params, timeout) => {
  let postData = {
    jsonrpc: '2.0',
    method: method,
    params: params,
    id: getRandomId(),
  };
  let url = `http://${providerHost}/${service}`;

  return Post(url, postData, timeout);
};
