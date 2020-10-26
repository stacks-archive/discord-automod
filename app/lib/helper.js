const _ = require('lodash'),
    joi = require('joi')

module.exports = {
    checkPermissions(neededPerms, userPerms) {
        if (userPerms[neededPerms] === true) {
            return true
        } else {
            throw {
                message: `You do not have ${neededPerms} rights.`,
                statusCode: 401
            }
        }
    },

    trimmer: function (object) {
        for (let key in object) {
            if (typeof myVar === 'string' || object[key] instanceof String) {
                object[key] = object[key].trim()
            }
        }
        return object
    },

    queryBuilder(query, model, attributes, relatedModels = false) {
        query.filter = cleanObject(query.filter)
        return this._queryHelper(
            query,
            attributes ? attributes : model.getAttributes(),
            relatedModels ? relatedModels : model.getRelatedModels())
    },

    _queryHelper(query, attributes, relatedAttributes = []) {
        attributes.push('id')
        let filter = _.isPlainObject(query.filter) ? query.filter : {}
        filter = _.pick(filter, attributes)

        let page = _.isPlainObject(query.page) ? query.page : {}
        page = Object.assign({ number: 1, size: 20 }, _.pick(page, ['number', 'size']))

        if (page.number < 1) {
            page.number = 1
        }
        if (page.size < 1) {
            page.size = 20
        }

        let sort = []
        if (query.sort) {
            query.sort.split(',').forEach(field => {
                let direction = 'ASC'
                if (field.length > 0 && field[0] == '-') {
                    direction = 'DESC'
                    field = field.substr(1)
                }
                if (attributes.indexOf(field) > -1) {
                    sort.push({ field, direction })
                }
            })
        }
        if (sort.length == 0) {
            sort.push({ field: 'created_at', direction: 'DESC' })
        }

        let include = []
        if (query.include) {
            include = query.include.split(',')
        }
        if (relatedAttributes) {
            include = _.intersection(include, relatedAttributes)
        }

        return {
            filter,
            page,
            sort,
            include
        }
    },

    paginate(query, Model, withRelated, whereArr = [], searchTerm = null, arrayOfIds = [], rawQuery) {
        let comparison_keys = { 'eq': '=', 'like': 'ILIKE', 'not': '<>', 'lt': '<', 'lte': '<=', 'gt': '>', 'gte': '>=', 'in': 'in' }
        let preparedFetch = Model.forge()
        if (rawQuery) {
            if (rawQuery.query && rawQuery.where) {
                if (rawQuery.query.constructor === Array && rawQuery.where.constructor === Array) {
                    preparedFetch.query(...rawQuery.query).where(...rawQuery.where)
                }
            }
        }

        _.mapKeys(query.filter, (value, key) => {
            if (_.isPlainObject(value)) {
                _.mapKeys(value, (plainValue, comp) => {
                    if (!_.isUndefined(comparison_keys[comp])) {
                        if (comp == 'in') {
                            if (_.isString(plainValue)) {
                                plainValue = plainValue.split(',')
                            }
                        }
                        whereArr.push({ attr: key, comp: comparison_keys[comp], value: plainValue })
                    }
                })
                delete query.filter[key]
            }
        })

        preparedFetch.where(query.filter)

        whereArr.forEach((where) => {
            preparedFetch.where(where.attr, where.comp, tryParseDate(where.value))
        })

        if (searchTerm && typeof Model.getSearchable === 'function') {
            preparedFetch.where(function () {
                Model.getSearchable(this, searchTerm)
            })
        }

        if (arrayOfIds.length > 0) {
            preparedFetch.where(function () {
                this.where('id', 'IN', arrayOfIds)
            })
        }

        query.sort.forEach(sortItem => {
            preparedFetch.orderBy(sortItem.field, sortItem.direction)
        })

        if (withRelated) {
            withRelated = withRelated.filter(relation => Model.getRelatedModels().indexOf(relation) > -1)
        }

        return preparedFetch.fetchPage({
            page: query.page.number,
            pageSize: query.page.size,
            withRelated: withRelated ? withRelated : query.include
        })
    },

    indexResponse(data, pickAttr) {
        return {
            total: data.pagination.rowCount,
            limit: data.pagination.pageSize,
            skip: data.pagination.pageSize * data.pagination.page - data.pagination.pageSize,
            data: (Array.isArray(pickAttr)) ? data.toJSON().map(item => _.pick(item, pickAttr)) : data
        }
    },
    validateData(data, schema, options = {}) {
        return new Promise(async (resolve, reject) => {
            options.abortEarly = false
            try {
                var result = await joi.validate(data, schema, options)
            } catch (error) {
                console.error(error)
                reject(error)
            }
            resolve(result)
        })
    },
    formatStringValue: (value = '', delimiter = '_') => {
        let values = value.split(delimiter)
        let result = ''
        values.forEach(each => {
            result += `${each} `
        })
        return result.trim()
    }
}

function tryParseDate(date) {
    if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/.test(date)) {
        return new Date(Date.parse(date))
    } else {
        return date
    }
}

function cleanObject(object) {
    for (var key in object) {
        if (object[key] === null || object[key] === undefined || object[key] === '') {
            delete object[key]
        }
    }
    return object
}