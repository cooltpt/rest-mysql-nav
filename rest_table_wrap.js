var mysql = require("mysql");
var logger = require("winston");

function rest_table_wrap(serverCtx, router, pool, db, table_name, md5) {


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


   // setup from meta-data
   var metaData = {};
   var fq = "";
   var query = "desc ??.??";
   query = mysql.format(query, [db,table_name]);

   pool.getConnection().then((conn) => {

      var rs = conn.query(query);
      conn.release();
      return rs;

   }).then((rs) => {

      metaData = rs[0];
      logger.info("rest_table_wrap setup for " + db + "/" + table_name + " is..\n\t" + JSON.stringify(metaData));

      for(f in metaData) fq += "??,";
      fq = fq.replace(/,\s*$/,'');

   }).catch((err) => {

      logger.error("rest_table_wrap setup for " + db + "/" + table_name + " has errors\n\t" + JSON.stringify(err));
      return;

   });



   //
   // Generic REST services
   //

   logger.info("setting up rest services for " + table_name);


   // GET (count)
   router.get("/" + db + "/" + table_name + "/count", function (req, res) {

      var result = {};
      result.hasError = false;
      result.headers  = req.headers;

      var query = "SELECT count(1) as count FROM ??.??";
      query = mysql.format(query, [db,table_name]);
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


   // GET
   router.get("/" + db + "/" + table_name, function (req, res) {

      var result = {};
      result.hasError = false;
      result.headers  = req.headers;

      var query = "SELECT * FROM ??.??";
      query = mysql.format(query, [db,table_name]);
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


   // GET - expects the 1st field in the table to be PK
   router.get("/" + db + "/" + table_name + "/:id", function (req, res) {

      var result = {};
      result.hasError = false;
      result.headers  = req.headers;

      var query = "SELECT * FROM ??.?? WHERE ??=?";

      var meta = [];
      meta.push(db);
      meta.push(table_name);
      meta.push(metaData[0].Field);
      meta.push(req.params.id);
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


   // POST - application/x-www-form-urlencoded
   router.post("/" + db + "/" + table_name, function (req, res) {

      var result = {};
      result.hasError = false;
      result.headers  = req.headers;

      var query = "INSERT INTO ??.?? (" + fq + ") VALUES (" + fq.replace(/\?\?/g, '?') + ")";

      var meta = [];
      meta.push(db);
      meta.push(table_name);
      for(f in metaData) meta.push(metaData[f].Field);
      for(f in metaData) meta.push(eval("req.body." + metaData[f].Field));
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


   // PUT - application/x-www-form-urlencoded - expects the 1st field in the table to be PK
   router.put("/" + db + "/" + table_name, function (req, res) {

      var result = {};
      result.hasError = false;
      result.headers  = req.headers;

      var query = "UPDATE ??.?? SET ";
      for(f in metaData) {
         if (f == 0) continue;
         var val = eval("req.body." + metaData[f].Field);
         if (val) query += "?? = ?, ";
      }
      query = query.replace(/,\s*$/,'');
      query += " WHERE ?? = ?";

      var meta = [];
      meta.push(db);
      meta.push(table_name);
      for(f in metaData) {
         if (f == 0) continue;
         meta.push(metaData[f].Field);
         meta.push(eval("req.body." + metaData[f].Field));
      }

      meta.push(metaData[0].Field);
      meta.push(eval("req.body." + metaData[0].Field));

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


   // DELETE - application/x-www-form-urlencoded - expects the 1st field in the table to be PK
   router.delete("/" + db + "/" + table_name, function (req, res) {

      var result = {};
      result.hasError = false;
      result.headers  = req.headers;

      var query = "DELETE FROM ??.?? WHERE ??=?";

      var meta = [];
      meta.push(db);
      meta.push(table_name);
      meta.push(metaData[0].Field);
      meta.push(eval("req.body." + metaData[0].Field));

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


   // DELETE - expects the 1st field in the table to be PK
   router.delete("/" + db + "/" + table_name + "/:id", function (req, res) {

      var result = {};
      result.hasError = false;
      result.headers  = req.headers;

      var query = "DELETE FROM ??.?? WHERE ??=?";

      var meta = [];
      meta.push(db);
      meta.push(table_name);
      meta.push(metaData[0].Field);
      meta.push(req.params.id);

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

module.exports = rest_table_wrap;
