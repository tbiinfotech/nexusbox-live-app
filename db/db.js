require('dotenv').config();
const { Sequelize } = require('sequelize');

console.log('process.env.DB_DATABASE', process.env.DB_DATABASE)
console.log('process.env.DB_USERNAME', process.env.DB_USERNAME)
console.log('process.env.DB_PASSWORD', process.env.DB_PASSWORD)


const sequelize = new Sequelize(process.env.DB_DATABASE, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
  host: '127.0.0.1',
  port: 3306,
  dialect: 'mysql',
  logging: false,
});


module.exports = sequelize;
