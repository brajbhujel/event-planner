exports.up = async function (knex) {
  await knex.schema.alterTable("users", (t) => {
    t.timestamp("email_verified_at", { useTz: true }).nullable();
    t.boolean("two_factor_enabled").notNullable().defaultTo(false);
    t.text("two_factor_secret").nullable();
    t.jsonb("backup_codes").notNullable().defaultTo("[]");
  });

  // Existing users (if any) are treated as already verified.
  await knex("users").whereNull("email_verified_at").update({
    email_verified_at: knex.fn.now(),
  });

  await knex.schema.createTable("email_otps", (t) => {
    t.uuid("id").primary();
    t.uuid("user_id")
      .notNullable()
      .references("users.id")
      .onDelete("CASCADE")
      .index();
    t.string("purpose", 32).notNullable(); // signup
    t.string("code_hash", 255).notNullable();
    t.timestamp("expires_at", { useTz: true }).notNullable().index();
    t.timestamp("used_at", { useTz: true }).nullable();
    t.timestamp("created_at", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    t.check("purpose in ('signup')");
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("email_otps");
  await knex.schema.alterTable("users", (t) => {
    t.dropColumn("email_verified_at");
    t.dropColumn("two_factor_enabled");
    t.dropColumn("two_factor_secret");
    t.dropColumn("backup_codes");
  });
};
