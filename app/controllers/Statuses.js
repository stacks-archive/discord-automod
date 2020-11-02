let Status = require('../models').Status,
    { transaction } = require('objection'),
    { filterer } = require('../lib/filters')
module.exports = {
    async getStatuses(query = {}, pageNumber = 0, perPage = 20) {
        return {
            ...await filterer(query, Status, {
                pageNumber,
                perPage,
                related: query.related,
                orderBy: query.orderBy || 'id'
            }),
            page: pageNumber,
            per_page: perPage
        }

    },

    async getStatus(id, query) {
        if (!id) {
            throw {
                message: 'ID Not Provided',
                statusCode: 400
            }
        }

        let theStatus = await Status.query().findById(id).eager(query.related)

        if (!theStatus) {
            throw {
                message: 'Status Not Found',
                statusCode: 404
            }
        }

        return theStatus
    },

    async createStatus(statusBody, userPermissions = {}) {
        const status = await transaction(
            Status,
            async (Status) => {
                var newStatus = await Status.query().insert({
                    ...statusBody
                })

                return newStatus
            }
        )

        return status

    },

    async editStatus(id, newBody) {
        if (!id) {
            throw {
                message: 'ID Not Provided',
                statusCode: 400
            }
        }
        if (newBody.id) {
            delete newBody.id
        }
        let editedStatus = await Status.query().patchAndFetchById(id, { ...newBody })

        if (!editedStatus) {
            throw {
                message: 'Status Not Found',
                statusCode: 404
            }
        }

        return editedStatus
    },

    async deleteStatus(id) {

        if (!id) {
            throw {
                message: 'No ID Provided',
                statusCode: 400
            }
        }

        let deletedCount = await Status.query().patchAndFetchById(id, { is_deleted: true })
        await Promise.all(
            Object.keys(Status.getRelations()).map((relation) => {
                return deletedCount.$relatedQuery(relation).unrelate()
            })
        )

        if (deletedCount < 1) {
            throw {
                message: 'Status Not Found',
                statusCode: 404
            }
        }

        return deletedCount

    }

}
