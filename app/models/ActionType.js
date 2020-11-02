var Model = require('../lib/db')

class ActionType extends Model {
  static get tableName() {
    return 'action_types'
  }

  static get relationMappings() {
    return {
      voteRequirement: {
        relation: Model.HasOneRelation,
        modelClass: 'VoteRequirement',
        join: {
          from: 'action_types.id',
          to: 'vote_requirements.type_id',
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

module.exports = ActionType
