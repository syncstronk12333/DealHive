require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD || 'password123',
    database: process.env.DB_NAME || 'price_monitor',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5433,  // Changed to 5433
    dialect: 'postgres',
    logging: false
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
};
