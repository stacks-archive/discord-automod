
exports.up = function (knex) {
    return Promise.all(
        ['setup', 'canceled', 'approved', 'pending', 'rejected'].map(item => knex('statuses').insert({ title: item }))
    )
};

exports.down = function (knex) {
    return Promise.all([
        // knex.schema.dropTableIfExists('pending_items')
    ])
};