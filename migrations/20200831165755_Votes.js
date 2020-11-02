
exports.up = function (knex) {
    return Promise.all([
        knex.schema.createTableIfNotExists('votes', (t) => {
            t.increments().primary()
            t.integer('pending_item_id')
            t.foreign('pending_item_id').references('id').inTable('pending_items')
            t.string('user_id')
            t.boolean('approved').default(false)
            t.timestamps()
            t.boolean('is_deleted').default(false)
        })
    ])
};

exports.down = function (knex) {
    return Promise.all([
        knex.schema.dropTableIfExists('votes')
    ])
};
