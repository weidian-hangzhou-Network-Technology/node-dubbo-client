const Request = require('request');

module.exports = (url, data, timeout = 45000) =>
  new Promise((resolve, reject) => {
    Request({
      url: url,
      method: 'post',
      headers: {
        'Content-type': 'application/json-rpc',
        Accept: 'text/json',
      },
      timeout: timeout,
    }, function (err, response, body) {
      if (err) {
        reject(err);
      } else {
        resolve(body);
      }
    });
  });
