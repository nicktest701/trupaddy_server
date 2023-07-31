/**
 * @type {Knex}
 */

// const knex = require('knex')({
//   client: 'mysql',
//   connection: {
//     host: process.env.DB_HOST,
//     port: 3306,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASS,
//     database: process.env.DB_NAME,
//   },
// });
 
const knex = require('knex')({
  client: 'mysql',
  connection: {
    // host: 'db4free.net',
    host: '127.0.0.1',
    port: 3306,
     user: 'nicktest701',
    password: 'Akwasi21@guy',
    database: 'trupaddy',
  },
});

module.exports = knex;
