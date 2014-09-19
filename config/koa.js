var fs = require('fs'),
  logger = require('koa-logger'),
  send = require('koa-send'),
  jwt = require('koa-jwt'),
  config = require('../config'),
  mount = require('koa-mount'),

  userService = require('../service/user')
;

module.exports = function (app) {
  if (config.app.env !== 'test') {
    app.use(logger());
  }

  var sendOpts = config.app.env === 'production' ? {root: __dirname + '/../public', maxage: 1000 * 60 * 60 * 24 * 7} : {root: __dirname + '/../public'};
  app.use(function* (next) {
    if (this.path.substr(0, 5).toLowerCase() === '/api/') {
      yield next;
    } else {
      if (yield send(this, this.path, sendOpts)) {
        return;
      }
      //HTML5 push state support
      yield send(this, '/index.html', sendOpts);
    }
  });

  fs.readdirSync(__dirname + '/../api/public').forEach(function (file) {
    if (fs.statSync(__dirname + '/../api/public/' + file).isFile()) {
      var moduleName = file.replace(/\.js$/, '');
      app.use(mount('/api/' + moduleName, require('../api/public/' + file)));
    }
  });


  // middleware below this line is only reached if jwt token is valid
  app.use(jwt({secret: config.app.secret}));
  app.use(function* (next) {
    this.user = yield userService.findById(this.user);
    if (!this.user) {
      this.status = 403;
      return;
    }

    yield next;
  });


  // mount api
  fs.readdirSync(__dirname + '/../api/private').forEach(function (file) {
    if (fs.statSync(__dirname + '/../api/private/' + file).isFile()) {
      var moduleName = file.replace(/\.js$/, '');
      app.use(mount('/api/' + moduleName, require('../api/private/' + file)));
    }
  });
};