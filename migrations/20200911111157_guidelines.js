
exports.up = function (knex) {
    return Promise.all([
        knex.schema.createTableIfNotExists('guidelines', (t) => {
            t.increments().primary()
            t.string('title')
            t.text('description')
            t.integer('times_enacted')
            t.text('justification')
            t.integer('message_id')
            t.integer('action_type_id')
            t.foreign('action_type_id').references('id').inTable('action_types')
            t.timestamps()
            t.boolean('is_deleted').default(false)
        })
    ])
};

exports.down = function (knex) {
    return Promise.all([
        knex.schema.dropTableIfExists('guidelines')
    ])
};
