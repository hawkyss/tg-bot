const sequelize = require('./database')
const {DataTypes} = require('sequelize')

const Order = sequelize.define('order', {
   id: {type: DataTypes.INTEGER, primaryKey: true, unique: true, autoIncrement: true},
   chatId: {type: DataTypes.BIGINT, unique: true},
   username: {type: DataTypes.STRING},
   status: {type: DataTypes.STRING}
})

module.exports = Order