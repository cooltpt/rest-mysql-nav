var mysql = require("mysql");
var logger = require("winston");

function rest_dbinfo_wrap(serverCtx, router, pool, md5) {


   // util for logging, etc.. remove circular refs from req
   function filterRequest(req) {
      var req_filt = {};
      req_filt.body = req.body;
      req_filt.headers = req.headers;
      req_filt.method = req.method;
      req_filt.params = req.params;
      req_filt.query = req.query;
      req_filt.url = req.url;
      return req_filt;
   }



   //
   // Generic REST services
   //

   logger.info("setting up rest services for databases..");


   // GET DBs
   router.get("/dbs", function (req, res) {

      var result = {};
      result.hasError = false;
      result.headers  = req.headers;

      var query = "show databases";
      result.query = query;

      pool.getConnection().then((conn) => {

         var rs = conn.query(query);
         conn.release();
         return rs;

      }).then((rs) => {

         result.rows = rs[0];
         res.json(result);
         logger.info(new Date() + ":" + JSON.stringify(req.headers));

      }).catch((err) => {

         result.hasError = true;
         result.message  = err;
         res.json(result);
         logger.error(new Date() + ":[" + JSON.stringify(err) + "," + JSON.stringify(filterRequest(req)) + "]");

      });

   });


   // GET DB Tables
   router.get("/dbs/:db/tables", function (req, res) {

      var result = {};
      result.hasError = false;
      result.headers  = req.headers;

      var query = "show tables in ??";
      query = mysql.format(query, req.params.db);
      result.query = query;

      pool.getConnection().then((conn) => {

         var rs = conn.query(query);
         conn.release();
         return rs;

      }).then((rs) => {

         result.rows = rs[0];
         res.json(result);
         logger.info(new Date() + ":" + JSON.stringify(req.headers));

      }).catch((err) => {

         result.hasError = true;
         result.message  = err;
         res.json(result);
         logger.error(new Date() + ":[" + JSON.stringify(err) + "," + JSON.stringify(filterRequest(req)) + "]");

      });

   });


   // GET DB Table DESC
   router.get("/dbs/:db/tables" + "/:tab", function (req, res) {

      var result = {};
      result.hasError = false;
      result.headers  = req.headers;

      var query = "desc ??.??";

      var meta = [];
      meta.push(req.params.db);
      meta.push(req.params.tab);
      query = mysql.format(query, meta);
      result.query = query;

      pool.getConnection().then((conn) => {

         var rs = conn.query(query);
         conn.release();
         return rs;

      }).then((rs) => {

         result.rows = rs[0];
         res.json(result);
         logger.info(new Date() + ":" + JSON.stringify(req.headers));

      }).catch((err) => {

         result.hasError = true;
         result.message  = err;
         res.json(result);
         logger.error(new Date() + ":[" + JSON.stringify(err) + "," + JSON.stringify(filterRequest(req)) + "]");

      });

   });

}

module.exports = rest_dbinfo_wrap;
