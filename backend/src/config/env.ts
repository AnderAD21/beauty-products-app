import 'dotenv/config'

const schema = process.env.DB_SCHEMA ?? 'beautyproductsdb'

if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(schema)) {
  throw new Error('DB_SCHEMA contiene caracteres no validos.')
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: process.env.DATABASE_URL,
  dbHost: process.env.DB_HOST ?? 'localhost',
  dbPort: Number(process.env.DB_PORT ?? 5432),
  dbName: process.env.DB_NAME ?? 'postgres',
  dbUser: process.env.DB_USER ?? 'postgres',
  dbPassword: process.env.DB_PASSWORD,
  dbSsl: process.env.DB_SSL === 'true',
  dbSchema: schema,
  corsOrigins: (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
}

if (!env.databaseUrl && !env.dbPassword) {
  throw new Error(
    'Falta DATABASE_URL o DB_PASSWORD. Copia .env.example a .env y completa tus datos.',
  )
}
