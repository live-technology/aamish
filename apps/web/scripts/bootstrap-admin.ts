import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
const username = process.env.BOOTSTRAP_ADMIN_USERNAME || "aamish.admin";
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
const fullName = process.env.BOOTSTRAP_ADMIN_NAME || "Aamish Platform Admin";

if (!databaseUrl) throw new Error("DATABASE_URL is required");
if (!password || password.length < 12) throw new Error("BOOTSTRAP_ADMIN_PASSWORD must contain at least 12 characters");

const sql = postgres(databaseUrl, { max: 1 });

try {
  await sql`
    INSERT INTO app_users (username, password_hash, full_name, role, is_active)
    VALUES (${username}, crypt(${password}, gen_salt('bf')), ${fullName}, 'SUPER_ADMIN', TRUE)
    ON CONFLICT (username) DO UPDATE
      SET password_hash = crypt(${password}, gen_salt('bf')),
          full_name = EXCLUDED.full_name,
          role = 'SUPER_ADMIN',
          enterprise_id = NULL,
          employee_id = NULL,
          is_active = TRUE
  `;
  console.log(`Super administrator provisioned: ${username}`);
} finally {
  await sql.end();
}
