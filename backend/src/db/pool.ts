import pg from 'pg'
import { env } from '../config/env.js'

export const pool = new pg.Pool({
  connectionString: env.databaseUrl,
  host: env.databaseUrl ? undefined : env.dbHost,
  port: env.databaseUrl ? undefined : env.dbPort,
  database: env.databaseUrl ? undefined : env.dbName,
  user: env.databaseUrl ? undefined : env.dbUser,
  password: env.databaseUrl ? undefined : env.dbPassword,
  ssl: env.dbSsl ? { rejectUnauthorized: false } : undefined,
})

pool.on('connect', (client) => {
  void client.query(`SET search_path TO ${env.dbSchema}`)
})

export async function transaction<T>(work: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await work(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
