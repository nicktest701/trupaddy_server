/**
 * @type {Knex}
 */

const knex = require('knex')({
  client: 'mysql',
  connection: {
    // host: '192.168.0.175',
    // host: '127.0.0.1',
    host: 'db4free.net',
    port: 3306,
    // user: 'root',
    user: 'nicktest701',
    // password: '',
    password: 'Akwasi21@guy',
    database: 'trupaddy',
  },
});

module.exports = knex;
