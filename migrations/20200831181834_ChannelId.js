
exports.up = function (knex) {
    return Promise.all([
        knex.schema.alterTable('pending_items', t => {
            t.string('channel_id')
        })
    ])
};

exports.down = function (knex) {

};
