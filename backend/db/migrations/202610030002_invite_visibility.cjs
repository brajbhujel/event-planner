exports.up = async function (knex) {
  await knex.raw(
    "ALTER TABLE events DROP CONSTRAINT IF EXISTS events_visibility_check",
  );
  await knex.raw(
    "ALTER TABLE events ADD CONSTRAINT events_visibility_check CHECK (visibility in ('public', 'private', 'invite'))",
  );
  await knex.schema.createTable("invitations", (t) => {
    t.uuid("event_id")
      .notNullable()
      .references("events.id")
      .onDelete("CASCADE");
    t.uuid("user_id")
      .notNullable()
      .references("users.id")
      .onDelete("CASCADE");
    t.timestamp("created_at", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    t.primary(["event_id", "user_id"]);
    t.index("user_id");
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("invitations");
  await knex("events").where({ visibility: "invite" }).update({ visibility: "private" });
  await knex.raw(
    "ALTER TABLE events DROP CONSTRAINT IF EXISTS events_visibility_check",
  );
  await knex.raw(
    "ALTER TABLE events ADD CONSTRAINT events_visibility_check CHECK (visibility in ('public', 'private'))",
  );
};
