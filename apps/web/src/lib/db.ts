import postgres from "postgres";

let client: postgres.Sql | undefined;

export function db() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }

  client ??= postgres(connectionString, {
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
  });
  return client;
}

export async function closeDatabase() {
  await client?.end({ timeout: 5 });
  client = undefined;
}
