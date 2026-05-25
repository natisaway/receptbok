// db/models/Ingredient.js
const { DataTypes } = require("sequelize");
const sequelize = require("../index");

const Ingredient = sequelize.define("Ingredient", {
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 50]          // name must be 2–50 characters
    }
  },

  quantity: {
    type: DataTypes.FLOAT,
    allowNull: true,
    validate: {
      min: 0,               // must be 0 or higher
      isFloat: true
    }
  },

  unit: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      len: [1, 20]          // restrict unit length
    }
  },

  location: {
    type: DataTypes.STRING(50),
    allowNull: true,
    validate: {
      len: [1, 50]
    }
  },

  expiresOn: {
    type: DataTypes.DATE,
    allowNull: true,
    validate: {
      isDate: true        
    }
  },

  dateCreated: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
});

module.exports = Ingredient;
