
exports.up = function (knex) {
    return Promise.all([
        knex.schema.createTableIfNotExists('vote_requirements', (t) => {
            t.increments().primary()
            t.integer('type_id')
            t.foreign('type_id').references('id').inTable('action_types')
            t.integer('number_of_votes')
            t.timestamps()
            t.boolean('is_deleted').default(false)
        })
    ])
};

exports.down = function (knex) {
    return Promise.all([
        knex.schema.dropTableIfExists('vote_requirements')
    ])
};
