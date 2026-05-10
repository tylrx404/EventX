require('dotenv').config({ path: __dirname + '/.env' }); // Direct path to .env
require("dotenv").config();
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host:             process.env.DB_HOST     || "localhost",
  user:             process.env.DB_USER     || "root",
  password:         process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : "",
  database:         process.env.DB_NAME     || "eventx",
  waitForConnections: true,
  connectionLimit:  10,
  queueLimit:       0
});
pool.getConnection().then(conn => {
    console.log("CONNECTED TO DATABASE:", conn.config.database);
    conn.release();
});

module.exports = pool;