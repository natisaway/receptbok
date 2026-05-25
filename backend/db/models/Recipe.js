// db/models/Recipe.js
const { DataTypes } = require("sequelize");
const sequelize = require("../index");

const Recipe = sequelize.define("Recipe", {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  ingredients: {
    type: DataTypes.TEXT,
    allowNull: true 
  },
  instructions: {
    type: DataTypes.TEXT,
    allowNull: true 
  }
});

module.exports = Recipe;
