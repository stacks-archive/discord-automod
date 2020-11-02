
exports.up = function (knex) {
    return Promise.all([
        knex.schema.createTableIfNotExists('action_types', (t) => {
            t.increments().primary()
            t.string('title').notNullable()
            t.text('description')
            t.timestamps()
            t.boolean('is_deleted').default(false)
        })
    ])
};

exports.down = function (knex) {
    return Promise.all([
        knex.schema.dropTableIfExists('action_types')
    ])
};
