let Guideline = require('../models').Guideline,
    { transaction } = require('objection'),
    { filterer } = require('../lib/filters')
module.exports = {
    async getGuidelines(query = {}, pageNumber = 0, perPage = 20) {
        return {
            ...await filterer(query, Guideline, {
                pageNumber,
                perPage,
                related: query.related,
                orderBy: query.orderBy || 'id'
            }),
            page: pageNumber,
            per_page: perPage
        }

    },

    async getGuideline(id, query) {
        if (!id) {
            throw {
                message: 'ID Not Provided',
                statusCode: 400
            }
        }

        let theGuideline = await Guideline.query().findById(id).eager(query.related)

        if (!theGuideline) {
            throw {
                message: 'Guideline Not Found',
                statusCode: 404
            }
        }

        return theGuideline
    },

    async createGuideline(guidelineBody, userPermissions = {}) {
        const guideline = await transaction(
            Guideline,
            async (Guideline) => {
                var newGuideline = await Guideline.query().insert({
                    ...guidelineBody
                })

                return newGuideline
            }
        )

        return guideline

    },

    async editGuideline(id, newBody) {
        if (!id) {
            throw {
                message: 'ID Not Provided',
                statusCode: 400
            }
        }
        if (newBody.id) {
            delete newBody.id
        }
        let editedGuideline = await Guideline.query().patchAndFetchById(id, { ...newBody })

        if (!editedGuideline) {
            throw {
                message: 'Guideline Not Found',
                statusCode: 404
            }
        }

        return editedGuideline
    },

    async deleteGuideline(id) {

        if (!id) {
            throw {
                message: 'No ID Provided',
                statusCode: 400
            }
        }

        let deletedCount = await Guideline.query().patchAndFetchById(id, { is_deleted: true })
        await Promise.all(
            Object.keys(Guideline.getRelations()).map((relation) => {
                return deletedCount.$relatedQuery(relation).unrelate()
            })
        )

        if (deletedCount < 1) {
            throw {
                message: 'Guideline Not Found',
                statusCode: 404
            }
        }

        return deletedCount

    }

}
