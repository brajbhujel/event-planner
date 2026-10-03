require("dotenv").config({ path: require("path").resolve(__dirname, ".env") });

module.exports = {
  client: "pg",
  connection: process.env.DATABASE_URL,
  migrations: { directory: "./db/migrations", extension: "cjs" },
};
