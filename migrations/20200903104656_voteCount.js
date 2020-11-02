
exports.up = function (knex) {
    return Promise.all([
        knex.schema.alterTable('pending_items', t => {
            t.integer('vote_count')
        })
    ])
};

exports.down = function (knex) {

};
