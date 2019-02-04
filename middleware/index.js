const cfg = require('../config/config'),
      reg_router = require('../routes'),
      bodyParser = require('body-parser'),
      cookieParser = require('cookie-parser'),
      session = require('express-session'),
      favicon = require('serve-favicon');

module.exports = function (app, express) {

  app.use('/public', express.static('./public'));
  app.set('view engine', 'pug');

  app.use(bodyParser.json({limit: '64mb', parameterLimit: 1000000}));
  app.use(bodyParser.urlencoded({limit: '64mb', extended: true, parameterLimit: 1000000}));
  app.use(cookieParser());
  app.use(session({
    secret: cfg.sessionSecret,
    cookie: {maxAge: 90000000000},
    resave: true,
    saveUninitialized: true
  }));

  reg_router(app);

};
