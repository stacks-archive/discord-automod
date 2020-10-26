const { transaction } = require('objection'),
  _ = require('lodash')

exports.filterer = async function (query, Model, operations) {

  const order = await transaction(Model, async (Model) => {
    let filter = _.isPlainObject(query.filter) ? query.filter : {}
    query.filter = filter

    let preparedFetch = Model.query().skipUndefined().alias('model')
    let comparison_keys = { 'eq': '=', 'like': 'ILIKE', 'not': '<>', 'lt': '<', 'lte': '<=', 'gt': '>', 'gte': '>=', 'in': 'in' }

    /* To get notification filterd by user_id */
    if (Model.name === 'Notification' && query.filter.hasOwnProperty('user')) {
      preparedFetch.joinRelation('users')
        .where('users.id', query.filter.user);
      delete query.filter.user
    }

    // _.mapKeys(query.filter, (value, key) => {
    //   let comp = (query.operand) ? comparison_keys[query.operand[key]] || '=' : '='
    //   preparedFetch.where(key, comp, value)
    // })

    if (query.hasOwnProperty('filterRelated')) {
      let relateItem = Object.keys(query.filterRelated)[0]
      let relateItemArray = relateItem.split('.')
      preparedFetch.joinRelation(relateItemArray[0], { alias: 'table' })
        .where(`table.${relateItemArray[1]}`, relateItemArray[2] || '=', query.filterRelated[relateItem])
    }
    let filters = Object.entries(query.filter)

    filters.forEach(([key, value]) => {
      let comp = (query.operand) ? comparison_keys[query.operand[key]] || '=' : '='
      let values
      if (value === true || value === false) {
        values = [value]
      }
      else
        values = value.split(',')
      if (values.length === 1)
        preparedFetch.where(`model.${key}`, comp, value)
      else {
        values.forEach((value, index) => {
          if (index === 0)
            preparedFetch.where(`model.${key}`, comp, value)
          else
            preparedFetch.orWhere(`model.${key}`, comp, value)
        })
      }
    })
    filters.shift()

    filters.forEach(([key, value]) => {
      let comp = (query.operand) ? comparison_keys[query.operand[key]] || '=' : '='
      let values
      if (value === true || value === false) {
        values = [value]
      }
      else
        values = value.split(',')
      if (values.length === 1)
        preparedFetch.andWhere(`model.${key}`, comp, value)
      else {
        values.forEach((value, index) => {
          if (index === 0)
            preparedFetch.andWhere(`model.${key}`, comp, value)
          else
            preparedFetch.andWhere(`model.${key}`, comp, value)
        })
      }
    })
    if (operations.search && typeof (Model.getSearchable) === 'function') {
      let fields = Model.getSearchable()
      preparedFetch.where(qb => {
        for (let i = 0; i < fields.length; i++) {
          if (i === 0) {
            qb.where(`model.${fields[i]}`, 'ILIKE', `%${operations.search}%`)
          } else {
            qb.orWhere(`model.${fields[i]}`, 'ILIKE', `%${operations.search}%`)
          }
        }
        if (query.searchRelated && typeof (Model.getRelatedSearchable) === 'function') {
          let fields = Model.getRelatedSearchable()
          let related = Object.keys(query.searchRelated)[0]
          let search = Object.values(query.searchRelated)[0]
          qb.joinRelation(related, { alias: 'searchTable' }).orWhere(qb1 => {
            for (let i = 0; i < fields.length; i++) {
              if (i === 0) {
                qb1.where(`searchTable.${fields[i]}`, 'ILIKE', `%${search}%`)
              } else {
                // qb1.orWhere(`searchTable.${fields[i]}`, 'ILIKE', `%${search}%`)
              }
            }
          })
        }
      })
    }

    if (query.searchRelated && typeof (Model.getRelatedSearchable) === 'function') {
      let related = Object.keys(query.searchRelated)[0]
      preparedFetch.joinRelation(related, { alias: 'searchTable' })
    }

    if (operations.match && typeof (Model.getSearchable) === 'function') {
      let fields = Model.getSearchable()
      preparedFetch.where(qb => {
        for (let i = 0; i < fields.length; i++) {
          if (i === 0) {
            qb.where(`model.${fields[i]}`, 'ILIKE', `%${operations.match}%`)
          } else {
            qb.orWhere(`model.${fields[i]}`, 'ILIKE', `%${operations.match}%`)
          }
        }
      })
    }

    // if (query.hasOwnProperty('filter') && query.filter.hasOwnProperty('is_deleted')) {
    //   if (query.filter.is_deleted === 'true') {
    //     preparedFetch.where(`model.is_deleted`, '=', true)
    //   }
    //   else
    //     preparedFetch.where(`model.is_deleted`, '=', false)
    // }
    // else {
    //   preparedFetch.where(`model.is_deleted`, '=', false)
    // }


    if (query.first_name) {
      preparedFetch.where(qb => {
        qb.where('model.first_name', 'ILIKE', `%${query.first_name}%`)
      })
    }

    if (query.last_name) {
      preparedFetch.where(qb => {
        qb.where('model.last_name', 'ILIKE', `%${query.last_name}%`)
      })
    }
    if (query.name) {
      let names = query.name.split(' ')
      preparedFetch.where(qb => {
        for (let i = 0; i < names.length; i++) {
          if (i === 0) {
            qb.where('model.first_name', 'ILIKE', `%${names[i]}%`)
            qb.orWhere('model.last_name', 'ILIKE', `%${names[i]}%`)
          } else {
            qb.andWhere('model.last_name', 'ILIKE', `%${names[i]}%`)
          }
        }
      })
    }

    if (query.last_four_of_social) {
      preparedFetch.where(qb => {
        qb.where('model.last_four_of_social', 'ILIKE', `%${query.last_four_of_social}%`)
      })
    }

    if (query.related) {
      if (operations.orderBy && operations.orderBy.indexOf('.') > -1) {
        if (operations.orderBy.charAt(0) === '-') {
          preparedFetch.joinRelation(operations.orderBy.substring(1, operations.orderBy.indexOf('.')))
        } else {
          preparedFetch.joinRelation(operations.orderBy.substring(0, operations.orderBy.indexOf('.')))
        }
      }
      preparedFetch.eager(query.related)
    }

    if (operations.orderBy) {
      let orderBy = operations.orderBy
      if (orderBy.charAt(0) === '-') {
        orderBy = orderBy.substr(1)
        preparedFetch.orderBy(orderBy || 'id', 'desc')
      } else {
        preparedFetch.orderBy(orderBy || 'id')
      }
    }

    if (operations.pageNumber, operations.perPage) {
      preparedFetch.page(operations.pageNumber, operations.perPage)
    }

    if (operations.count) {
      preparedFetch.count('*')
    }

    return await preparedFetch
  })

  return order
}