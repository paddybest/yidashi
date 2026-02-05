import type { Config } from 'drizzle-kit';

export default {
  schema: './src/storage/database/shared/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: process.env.DATABASE_URL ? {
    host: 'yidashi-proxy.rwlb.rds.aliyuncs.com',
    port: 5432,
    user: 'Yidashi',
    password: 'Zxcvb135',
    database: 'yidashi_sql',
    ssl: false,
  } : {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'tianjige_password',
    database: 'tianjige',
    ssl: false,
  },
} satisfies Config;