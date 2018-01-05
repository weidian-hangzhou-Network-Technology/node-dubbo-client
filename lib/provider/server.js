const http = require('http');
const getRawBody = require('raw-body');
const jsonrpc = require('../protocol').getProtocol('jsonrpc');

class Server {
  static createInstance() {
    return new Server();
  }

  constructor() {
    this.handlers = {};
    this.opts = {
      encoding: true,
      limit: '500kb',
    };
    // eslint-disable-next-line no-underscore-dangle
    this._createServer();
  }

  _createServer() {
    this.server = http.createServer((req, res) => {
      getRawBody(req, this.opts)
        .then((str) => {
          let body;
          try {
            body = JSON.parse(str);
          } catch (e) {
            return Promise.reject(new Error(`body data parse fail. ${e.message}`));
          }

          const { method, params = [] } = body;
          const handler = this.handlers[method];

          if (!handler) {
            return Promise.reject(new Error(`method:${method} not exist.`));
          }

          return Promise
            .resolve()
            .then(() => {
              try {
                return handler(...params);
              } catch (e) {
                return Promise.reject(e);
              }
            })
            .then((result) => jsonrpc.response(result))
            .catch((err) => {
              let error = err;
              if (!(err instanceof Error)) {
                error = new Error(JSON.stringify(err));
              }

              return jsonrpc.response({}, error);
            })
            .then((responseData) => {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json;charset=utf-8');
              res.end(responseData, 'utf-8');
            });
        })
        .catch((err) => {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'text/plain;charset=utf-8');
          res.end(err.message, 'utf-8');
        });
    });
  }

  /**
   * setup raw-body options
   * @param {Object} options
   * @property {string} options.limit
   */
  config(options) {
    if (options.limit) {
      this.opts.limit = options.limit;
    }
  }

  /**
   * @param {string} name
   * @param {function} handler
   */
  addHandler(name, handler) {
    if (typeof handler !== 'function') {
      throw new TypeError('handler is not a function');
    }

    this.handlers[name] = handler;
  }

  /**
   * @param {number} port
   * @return {Promise.<void>}
   */
  listen(port) {
    return new Promise((resolve, reject) => {
      this.server.listen(port, (err) => {
        if (err) {
          reject(new Error(err));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * close server
   * @return {Promise.<void>}
   */
  close() {
    return new Promise((resolve) => {
      if (!this.server) {
        // server has not been created
        resolve();
      } else {
        this.server.close(() => {
          resolve();
        });
      }
    });
  }
}

module.exports = Server;
