const { Client } = require('pg');
const connectionString = "postgres://postgres.vzfhbormbkjgobknfhbz:188ArtsFest188$@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1";

async function test() {
  console.log("Connecting...");
  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    console.log("Connected!");
    const res = await client.query('SELECT NOW()');
    console.log("Result:", res.rows[0]);
    await client.end();
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
