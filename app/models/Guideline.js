var Model = require('../lib/db')

class Guideline extends Model {
  static get tableName() {
    return 'guidelines'
  }

  static get relationMappings() {
    return {
      action: {
        relation: Model.HasOneRelation,
        modelClass: 'ActionType',
        join: {
          from: 'guidelines.action_type_id',
          to: 'action_types.id',
        },
      },
    }
  }

  $beforeUpdate(opt, quetyContext) {
    this.updated_at = new Date().toISOString()
  }

  $beforeInsert() {
    this.updated_at, this.created_at = new Date().toISOString()
  }

  static getSearchable() {
    return [
    ]
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: [],
      properties: {
        id: { type: 'integer' },
      }
    }
  }

  static get modelPaths() {
    return [__dirname]
  }
}

module.exports = Guideline
