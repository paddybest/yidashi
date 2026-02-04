import type { Config } from 'drizzle-kit';

export default {
  schema: './src/storage/database/shared/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'tianjige_password',
    database: 'tianjige',
  },
} satisfies Config;