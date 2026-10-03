exports.up = async function (knex) {
  await knex.schema.alterTable("events", (t) => {
    t.timestamp("ends_at", { useTz: true }).nullable();
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable("events", (t) => {
    t.dropColumn("ends_at");
  });
};
