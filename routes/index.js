var express = require('express');
const mariadb = require('mariadb');
var router = express.Router();

/* database connection */ 
const db = mariadb.createPool({
  host: 'localhost', 
  user:'root', 
  password: '',
  database: '',
  connectionLimit: 5
});

db.getConnection()
    .then(conn => {
        console.log("Database Connected: " + conn.threadId);
    })
    .catch(err => {
        console.log(err);
    })

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index', { 
    title: 'CS539 Project',
    queried: false ,
    errMessage: "" ,
  });
});

/* execute SELECT query through POST request */ 
router.post('/search', (req, res, next) => {
  
  let result = {
    title: 'CS539 Project',
    queried: false, 
  }; // the "result" object that is going to be rendered


  let hasError = false;  // flag showing if an error has been encountered 
  let errMessage; // error message
  let table = [];

  const sql = req.body.query;
  let sqlSplit = sql.split(" ");
  
  if (sqlSplit[0] === '') {
    hasError = true;
    errMessage = "Your query is empty. Please enter a valid query.";
  }
  else if (sqlSplit[0].toLowerCase() !== 'select') {
    hasError = true;
    errMessage = "Sorry. Only SELECT query is supported.";
  } else {
    db.getConnection()
      .then(conn => {
        conn.query(sql)
          .then(rows => {
            /* copy the rows into an array */

            /* discard column info and only save returned data */
            delete rows.meta; 
            /* obtain column names */
            let colNames = [];
            Object.keys(rows[0]).forEach(col => colNames.push(col));
            table.push(colNames);
            /* obtain each row */
            rows.forEach(row => {
              let newRow = [];
              colNames.forEach(col => newRow.push(row[col]));
              table.push(newRow);
            });
            // result.table = JSON.parse(JSON.stringify(table));
            result.table = table;
            result.queried = true;
            res.render('index', result);
          })
          .then(res => {
            conn.end();
          })
          .catch(err => {
            hasError = true;
            errMessage = "Sorry. Your SQL query contains the following error: "
              + "\n" + err.message + "\n" + "Please check your SQL syntax and try again."
            conn.end();
          })
      }).catch(err => { //not connected
        hasError = true;
        errMessage = "Sorry. There's a problem connecting to the database. Please try again."
      });
  }

  if(hasError) {
    result.errMessage = errMessage;
    res.render('index', result);
  };
  
});

module.exports = router;