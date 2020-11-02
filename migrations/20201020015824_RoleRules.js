
exports.up = function (knex) {
    return Promise.all([
        knex.schema.createTableIfNotExists('role_rules', (t) => {
            t.increments().primary()
            t.string('role_id')
            t.integer('max_allowed')
            t.integer('days_in_server')
            t.boolean('is_deleted').default(false)
        })
    ])
};

exports.down = function (knex) {
    return Promise.all([
        knex.schema.dropTableIfExists('role_rules')
    ])
};