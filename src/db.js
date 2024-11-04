import pkg from 'pg';
const {Pool} = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export const query = (text, params) => {
    return pool.query(text, params);
}

const initializeDatabase = async () => {
    try {
        await query(`
            CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL
            );

            CREATE TABLE IF NOT EXISTS tokens (
            id SERIAL PRIMARY KEY,
            user_id INT REFERENCES users(id),
            refresh_token VARCHAR(255) NOT NULL
            );
        `);
        console.log('Database tables created or already exists.');
    } catch (error) {
        console.error(error);
    }
}

initializeDatabase();

export default pool;