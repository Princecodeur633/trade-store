import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const sql = neon(process.env.DATABASE_URL);
type SQL = ReturnType<typeof neon>; // Typage pour sql si nécessaire ailleurs

export const initializeDatabase = async (): Promise<boolean> => {
  try {
    console.log('Initializing database...');

    await sql`
      CREATE TABLE IF NOT EXISTS structures (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        address TEXT,
        phone VARCHAR(50),
        api_key VARCHAR(255) UNIQUE,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS subscribers (
        id SERIAL PRIMARY KEY,
        structure_id INTEGER REFERENCES structures(id) ON DELETE CASCADE,
        subscriber_code VARCHAR(100) NOT NULL,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        status VARCHAR(50) DEFAULT 'active',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(structure_id, subscriber_code)
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS bills (
        id SERIAL PRIMARY KEY,
        structure_id INTEGER REFERENCES structures(id) ON DELETE CASCADE,
        subscriber_id INTEGER REFERENCES subscribers(id) ON DELETE CASCADE,
        bill_number VARCHAR(100) NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        due_date DATE NOT NULL,
        issue_date DATE DEFAULT CURRENT_DATE,
        status VARCHAR(50) DEFAULT 'pending',
        description TEXT,
        late_fee DECIMAL(12,2) DEFAULT 0,
        discount DECIMAL(12,2) DEFAULT 0,
        tax_amount DECIMAL(12,2) DEFAULT 0,
        total_amount DECIMAL(12,2) GENERATED ALWAYS AS (amount + late_fee - discount + tax_amount) STORED,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(structure_id, bill_number)
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        bill_id INTEGER REFERENCES bills(id) ON DELETE CASCADE,
        amount DECIMAL(12,2) NOT NULL,
        payment_date DATE DEFAULT CURRENT_DATE,
        payment_method VARCHAR(50),
        reference VARCHAR(255),
        notes TEXT,
        status VARCHAR(50) DEFAULT 'completed',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_subscribers_structure_code ON subscribers(structure_id, subscriber_code)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_bills_structure_status ON bills(structure_id, status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_bills_due_date ON bills(due_date)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_payments_bill_id ON payments(bill_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_bills_subscriber_id ON bills(subscriber_id)`;

    console.log('Database initialized successfully');
    return true;
  } catch (error: any) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

export { sql, SQL };
