var compress   = require("compression");
var express    = require("express");
var bodyParser = require("body-parser");
var md5        = require('MD5');
var logger     = require('winston');
var events     = require('events');

var rtw = require('./rest_table_wrap.js');
var dbi = require('./rest_dbinfo_wrap.js');

var app = express();

var emitter = new events.EventEmitter();


/*
// logger to IRC..
logger.add(require('winston-irc'), {
   host: 'irc.freenode.net',
   nick: 'username', //FIXME
   pass: 'userpass', //FIXME
   channels: {
     '#cstmnet': true
  }
});
*/


var serverCtx = {};
serverCtx.env = process.env;
logger.info("setting up server.. ");


// db setup
var sqlhost = process.env.SQLHOST || 'localhost'; //FIXME
var sqldb   = process.env.SQLDB   || 'test'; //FIXME

var pool = require('mysql2/promise').createPool({
   connectionLimit: 100,
   host: sqlhost,
   user: 'username', // FIXME
   password: 'userpass', // FIXME
   database: sqldb,
   debug: false
});
serverCtx.pool = pool;


// setup app
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(compress());


// setup routers
var router = express.Router();
app.use('/api', router);

// add generic db info lookups
dbi(serverCtx, router, pool, md5);

// dynamically get tables
// 1st field should be PK
pool.getConnection().then((conn) => {

   conn.query("show databases", function(err1, rs1) {
      if (err1) throw err1;

      var dbList = [];

      rs1.map(function(rec) { dbList.push(rec.Database); });

      dbList.map(function(dbName) {
         conn.query("show tables in " + dbName, function(err2, rs2) {
            if (err2) throw err2;
            rs2.map(function(rec) {
               tabName = eval("rec.Tables_in_" + dbName);
               //logger.info("setting up.. " + dbName + "/" + tabName);
               rtw(serverCtx, router, pool, dbName, tabName, md5);
            });
         });
      });

   });

   conn.release();
   setTimeout(function () { emitter.emit('dbRestReady'); }, 100);

}).catch((err) => {

   logger.error(new Date() + ":[" + err + "]");

});


// wait for the rest services to be setup..
emitter.on('dbRestReady', function() {

   // static content setup - use nginx if possible
   app.use(express.static(__dirname + '/static'));
   logger.info("server has static content in " + __dirname + "/static");

   // handle everything else..
   app.use(function(req, res, next) {
      var result = {};
      result.hasError = true;
      result.headers = req.headers;
      result.url = req.url;
      result.message = "Resource Not Found";
      result.status = 404;
      res.status = 404;
      res.json(result);
      logger.error(new Date() + ":" + JSON.stringify(result));
   });


   // start server
   if (module === require.main) {
      var server = app.listen(process.env.PORT || 8080, function () {
         var port = server.address().port;
         logger.info('server is listening on port %s', port);
      });
   }

});

module.exports = app;

