// backend/models/Location.js
const { DataTypes } = require("sequelize");
const sequelize = require("../index");

const Location = sequelize.define("Location", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
});

module.exports = Location;
