import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dialect = process.env.DB_DIALECT || 'sqlite';

let sequelize;

if (dialect === 'mysql') {
  console.log('Database Config: Connecting to MySQL database...');
  sequelize = new Sequelize(
    process.env.DB_NAME || 'client_crm',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      dialect: 'mysql',
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
} else {
  // Default to SQLite
  const storagePath = process.env.DB_STORAGE 
    ? path.resolve(__dirname, '..', process.env.DB_STORAGE)
    : path.resolve(__dirname, '..', 'database.sqlite');
    
  console.log(`Database Config: Connecting to SQLite database at: ${storagePath}`);
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: storagePath,
    logging: false
  });
}

export default sequelize;
