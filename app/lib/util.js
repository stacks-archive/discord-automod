const moment = require('moment')
module.exports = {
    formatGuidelineMessages: (item) => {
        return `
\`\`\`
Title: ${item.title}
Justification: ${item.justification} 
Confirmations Required: ${item.action.voteRequirement.number_of_votes}
          
Last Modified: ${moment(item.updated_at).format('DD/MM/YY H:mm:s')}
Times Enacted: ${item.times_enacted}
\`\`\`
`
    }
}