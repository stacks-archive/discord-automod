let PendingItem = require('../models').PendingItem,
    { transaction } = require('objection'),
    { filterer } = require('../lib/filters')
module.exports = {
    async getPendingItems(query = {}, pageNumber = 0, perPage = 20) {
        return {
            ...await filterer(query, PendingItem, {
                pageNumber,
                perPage,
                related: query.related,
                orderBy: query.orderBy || 'id'
            }),
            page: pageNumber,
            per_page: perPage
        }

    },

    async getPendingItem(id, query) {
        if (!id) {
            throw {
                message: 'ID Not Provided',
                statusCode: 400
            }
        }

        let thePendingItem = await PendingItem.query().findById(id).eager(query.related)

        if (!thePendingItem) {
            throw {
                message: 'PendingItem Not Found',
                statusCode: 404
            }
        }

        return thePendingItem
    },

    async createPendingItem(pendingitemBody, userPermissions = {}) {
        const pendingitem = await transaction(
            PendingItem,
            async (PendingItem) => {
                var newPendingItem = await PendingItem.query().insert({
                    ...pendingitemBody
                })

                return newPendingItem
            }
        )

        return pendingitem

    },

    async editPendingItem(id, newBody) {
        if (!id) {
            throw {
                message: 'ID Not Provided',
                statusCode: 400
            }
        }
        if (newBody.id) {
            delete newBody.id
        }
        let editedPendingItem = await PendingItem.query().patchAndFetchById(id, { ...newBody })

        if (!editedPendingItem) {
            throw {
                message: 'PendingItem Not Found',
                statusCode: 404
            }
        }

        return editedPendingItem
    },

    async deletePendingItem(id) {

        if (!id) {
            throw {
                message: 'No ID Provided',
                statusCode: 400
            }
        }

        let deletedCount = await PendingItem.query().patchAndFetchById(id, { is_deleted: true })
        await Promise.all(
            Object.keys(PendingItem.getRelations()).map((relation) => {
                return deletedCount.$relatedQuery(relation).unrelate()
            })
        )

        if (deletedCount < 1) {
            throw {
                message: 'PendingItem Not Found',
                statusCode: 404
            }
        }

        return deletedCount

    }

}
