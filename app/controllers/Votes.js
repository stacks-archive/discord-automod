let Vote = require('../models').Vote,
    { transaction } = require('objection'),
    { filterer } = require('../lib/filters')
module.exports = {
    async getVotes(query = {}, pageNumber = 0, perPage = 20) {
        return {
            ...await filterer(query, Vote, {
                pageNumber,
                perPage,
                related: query.related,
                orderBy: query.orderBy || 'id'
            }),
            page: pageNumber,
            per_page: perPage
        }

    },

    async getVote(id, query) {
        if (!id) {
            throw {
                message: 'ID Not Provided',
                statusCode: 400
            }
        }

        let theVote = await Vote.query().findById(id).eager(query.related)

        if (!theVote) {
            throw {
                message: 'Vote Not Found',
                statusCode: 404
            }
        }

        return theVote
    },

    async createVote(voteBody, userPermissions = {}) {
        const vote = await transaction(
            Vote,
            async (Vote) => {
                var newVote = await Vote.query().insert({
                    ...voteBody
                })

                return newVote
            }
        )

        return vote

    },

    async editVote(id, newBody) {
        if (!id) {
            throw {
                message: 'ID Not Provided',
                statusCode: 400
            }
        }
        if (newBody.id) {
            delete newBody.id
        }
        let editedVote = await Vote.query().patchAndFetchById(id, { ...newBody })

        if (!editedVote) {
            throw {
                message: 'Vote Not Found',
                statusCode: 404
            }
        }

        return editedVote
    },

    async deleteVote(id) {

        if (!id) {
            throw {
                message: 'No ID Provided',
                statusCode: 400
            }
        }

        let deletedCount = await Vote.query().patchAndFetchById(id, { is_deleted: true })
        await Promise.all(
            Object.keys(Vote.getRelations()).map((relation) => {
                return deletedCount.$relatedQuery(relation).unrelate()
            })
        )

        if (deletedCount < 1) {
            throw {
                message: 'Vote Not Found',
                statusCode: 404
            }
        }

        return deletedCount

    }

}
