exports.up = async function (knex) {
  await knex.schema.createTable("users", (t) => {
    t.uuid("id").primary();
    t.string("name", 80).notNullable();
    t.string("email", 254).notNullable().unique();
    t.text("password_hash").notNullable();
    t.timestamp("created_at", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
  });
  await knex.schema.createTable("sessions", (t) => {
    t.uuid("id").primary();
    t.uuid("user_id")
      .notNullable()
      .references("users.id")
      .onDelete("CASCADE")
      .index();
    t.timestamp("expires_at", { useTz: true }).notNullable().index();
  });
  await knex.schema.createTable("events", (t) => {
    t.uuid("id").primary();
    t.uuid("creator_id")
      .notNullable()
      .references("users.id")
      .onDelete("CASCADE")
      .index();
    t.string("title", 120).notNullable();
    t.text("description").notNullable();
    t.timestamp("starts_at", { useTz: true }).notNullable().index();
    t.string("location", 200).notNullable();
    t.string("visibility", 7).notNullable().defaultTo("public");
    t.check("visibility in ('public', 'private')");
    t.timestamp("created_at", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    t.timestamp("updated_at", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    t.index(["visibility", "starts_at"]);
  });
  await knex.schema.createTable("tags", (t) => {
    t.increments("id").primary();
    t.string("name", 32).notNullable().unique();
  });
  await knex.schema.createTable("event_tags", (t) => {
    t.uuid("event_id")
      .notNullable()
      .references("events.id")
      .onDelete("CASCADE");
    t.integer("tag_id")
      .unsigned()
      .notNullable()
      .references("tags.id")
      .onDelete("CASCADE");
    t.primary(["event_id", "tag_id"]);
    t.index("tag_id");
  });
  await knex.schema.createTable("rsvps", (t) => {
    t.uuid("event_id")
      .notNullable()
      .references("events.id")
      .onDelete("CASCADE");
    t.uuid("user_id").notNullable().references("users.id").onDelete("CASCADE");
    t.string("status", 5).notNullable();
    t.check("status in ('yes', 'no', 'maybe')");
    t.primary(["event_id", "user_id"]);
  });
};
exports.down = async function (knex) {
  for (const table of [
    "rsvps",
    "event_tags",
    "tags",
    "events",
    "sessions",
    "users",
  ])
    await knex.schema.dropTableIfExists(table);
};
