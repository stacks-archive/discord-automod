let VoteRequirement = require('../models').VoteRequirement,
    { transaction } = require('objection'),
    { filterer } = require('../lib/filters')
module.exports = {
    async getVoteRequirements(query = {}, pageNumber = 0, perPage = 20) {
        return {
            ...await filterer(query, VoteRequirement, {
                pageNumber,
                perPage,
                related: query.related,
                orderBy: query.orderBy || 'id'
            }),
            page: pageNumber,
            per_page: perPage
        }

    },

    async getVoteRequirement(id, query) {
        if (!id) {
            throw {
                message: 'ID Not Provided',
                statusCode: 400
            }
        }

        let theVoteRequirement = await VoteRequirement.query().findById(id).eager(query.related)

        if (!theVoteRequirement) {
            throw {
                message: 'VoteRequirement Not Found',
                statusCode: 404
            }
        }

        return theVoteRequirement
    },

    async createVoteRequirement(voterequirementBody, userPermissions = {}) {
        const voterequirement = await transaction(
            VoteRequirement,
            async (VoteRequirement) => {
                var newVoteRequirement = await VoteRequirement.query().insert({
                    ...voterequirementBody
                })

                return newVoteRequirement
            }
        )

        return voterequirement

    },

    async editVoteRequirement(id, newBody) {
        if (!id) {
            throw {
                message: 'ID Not Provided',
                statusCode: 400
            }
        }
        if (newBody.id) {
            delete newBody.id
        }
        let editedVoteRequirement = await VoteRequirement.query().patchAndFetchById(id, { ...newBody })

        if (!editedVoteRequirement) {
            throw {
                message: 'VoteRequirement Not Found',
                statusCode: 404
            }
        }

        return editedVoteRequirement
    },

    async deleteVoteRequirement(id) {

        if (!id) {
            throw {
                message: 'No ID Provided',
                statusCode: 400
            }
        }

        let deletedCount = await VoteRequirement.query().patchAndFetchById(id, { is_deleted: true })
        await Promise.all(
            Object.keys(VoteRequirement.getRelations()).map((relation) => {
                return deletedCount.$relatedQuery(relation).unrelate()
            })
        )

        if (deletedCount < 1) {
            throw {
                message: 'VoteRequirement Not Found',
                statusCode: 404
            }
        }

        return deletedCount

    }

}
