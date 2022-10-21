const sequelize = require('./database')
const {DataTypes} = require('sequelize')

const User = sequelize.define('user', {
   id: {type: DataTypes.INTEGER, primaryKey: true, unique: true, autoIncrement: true},
   chatId: {type: DataTypes.STRING, unique: true},
   username: {type: DataTypes.STRING},
   workId: {type: DataTypes.STRING, unique: true}
})

module.exports = User