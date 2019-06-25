const Sequelize = require('sequelize');
const sequelize = new Sequelize('test','root',null, {
  host: 'localhost',
  port: 3306,
  dialect: 'mariadb',
  pool: {
    max: 1,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  logging: false,
  timezone: '-04:00',
  query: {
    raw: true
  }
})
// Schema for 'message' model
sequelize.define('message', {
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  sentBy: {
    type: Sequelize.STRING,
    allowNull: false
  },
  text: {
    type: Sequelize.TEXT
  }
  // `createdAt`, `updatedAt` field auto generated by sequelize
})

module.exports = sequelize