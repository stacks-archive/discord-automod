
exports.up = function (knex) {
    return Promise.all([
        knex.schema.createTableIfNotExists('statuses', (t) => {
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
        knex.schema.dropTableIfExists('statuses')
    ])
};
