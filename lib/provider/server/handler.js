const bodyParser = require('body-parser');
const { jsonrpc } = require('../../protocol');

module.exports = (app, Listeners) => {
  app.use(bodyParser.json({ type: 'application/json-rpc' }));

  app.post('/:serviceName', (req, res) => {
    let data = req.body;

    if (!res.finished) {
      const serviceName = req.params.serviceName;
      if (!Listeners.has(serviceName)) {
        res.status(503).send('Can not found service.');
      } else {
        const listener = Listeners.get(serviceName)[data.method];
        if (!listener) {
          res.status(501).send('Method can not found.');
        } else {
          Reflect
            .apply(listener, null, data.params)
            .then((result) => res.send(jsonrpc.input(result)))
            .catch((err) => res.status(500).send(jsonrpc.input(err)));
        }
      }
    }

    app.use((res, req, next) => {
      res.status(404);
      next(new Error('Not Found.'));
    });

    app.use((err, req, res, next) => {
      if (!res.finished) {
        res.send(jsonrpc.input(err));
      }
    });
  });
};