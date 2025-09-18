const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/database.js');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig
);

// Product model
const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  brand: {
    type: DataTypes.STRING
  },
  category: {
    type: DataTypes.STRING
  },
  imageUrl: {
    type: DataTypes.TEXT
  },
  searchQuery: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

// PriceHistory model
const PriceHistory = sequelize.define('PriceHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Product,
      key: 'id'
    }
  },
  store: {
    type: DataTypes.STRING,
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING,
    defaultValue: 'INR'
  },
  url: {
    type: DataTypes.TEXT
  },
  availability: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  scrapedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

// Associations
Product.hasMany(PriceHistory, { foreignKey: 'productId' });
PriceHistory.belongsTo(Product, { foreignKey: 'productId' });

module.exports = {
  sequelize,
  Product,
  PriceHistory
};
