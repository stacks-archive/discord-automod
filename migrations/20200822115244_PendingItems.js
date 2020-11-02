
exports.up = function (knex) {
    return Promise.all([
        knex.schema.createTableIfNotExists('pending_items', (t) => {
            t.increments().primary()
            t.integer('status_id')
            t.foreign('status_id').references('id').inTable('statuses')
            t.integer('action_type_id')
            t.foreign('action_type_id').references('id').inTable('action_types')
            t.string('reference_message_id')
            t.string('message_sender_id')
            t.string('message_guild_id')
            t.string('action_taker_user_id')
            t.timestamps()
            t.boolean('is_deleted').default(false)
        })
    ])
};

exports.down = function (knex) {
    return Promise.all([
        knex.schema.dropTableIfExists('pending_items')
    ])
};
