import { Client } from "pg";

const client = new Client({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT)
});

export async function connectDB() {
  try {
    await client.connect();
    console.log("Conexão com o banco de dados estabelecida!");
  } catch (err) {
    console.error("Erro ao conectar no banco:", err);
  }
}

export { client };
