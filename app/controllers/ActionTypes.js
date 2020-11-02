let ActionType = require('../models').ActionType,
    { transaction } = require('objection'),
    { filterer } = require('../lib/filters')
module.exports = {
    async getActionTypes(query = {}, pageNumber = 0, perPage = 20) {
        return {
            ...await filterer(query, ActionType, {
                pageNumber,
                perPage,
                related: query.related,
                orderBy: query.orderBy || 'id'
            }),
            page: pageNumber,
            per_page: perPage
        }

    },

    async getActionType(id, query) {
        if (!id) {
            throw {
                message: 'ID Not Provided',
                statusCode: 400
            }
        }

        let theActionType = await ActionType.query().findById(id).eager(query.related)

        if (!theActionType) {
            throw {
                message: 'ActionType Not Found',
                statusCode: 404
            }
        }

        return theActionType
    },

    async createActionType(actiontypeBody, userPermissions = {}) {
        const actiontype = await transaction(
            ActionType,
            async (ActionType) => {
                var newActionType = await ActionType.query().insert({
                    ...actiontypeBody
                })

                return newActionType
            }
        )

        return actiontype

    },

    async editActionType(id, newBody) {
        if (!id) {
            throw {
                message: 'ID Not Provided',
                statusCode: 400
            }
        }
        if (newBody.id) {
            delete newBody.id
        }
        let editedActionType = await ActionType.query().patchAndFetchById(id, { ...newBody })

        if (!editedActionType) {
            throw {
                message: 'ActionType Not Found',
                statusCode: 404
            }
        }

        return editedActionType
    },

    async deleteActionType(id) {

        if (!id) {
            throw {
                message: 'No ID Provided',
                statusCode: 400
            }
        }

        let deletedCount = await ActionType.query().patchAndFetchById(id, { is_deleted: true })
        await Promise.all(
            Object.keys(ActionType.getRelations()).map((relation) => {
                return deletedCount.$relatedQuery(relation).unrelate()
            })
        )

        if (deletedCount < 1) {
            throw {
                message: 'ActionType Not Found',
                statusCode: 404
            }
        }

        return deletedCount

    }

}
