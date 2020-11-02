let { Guideline } = require('../models'),
    client = require('../../index'),
    { formatGuidelineMessages } = require('../lib/util'),
    { send_guidelines } = require('../../constants/messages/message_mod/index');
module.exports = {
    async ReInitialize(query = {}, pageNumber = 0, perPage = 20) {
        const messages = await client.channels.cache.get(process.env.COMMUNITY_GUIDELINE_CHANNEL_ID).messages.fetch() // Fetch last 100 messages
            .then(messages => {
                messages.forEach((message) => {
                    message.delete()
                })
            })
        // Send the quidelines
        const guidelines = await Guideline.query().eager('action.voteRequirement')
        Promise.all(guidelines.map(g => client.channels.cache.get(process.env.COMMUNITY_GUIDELINE_CHANNEL_ID).send(send_guidelines(client, formatGuidelineMessages(g))).then(sentEmbed => {
            sentEmbed.react("📝")
        })))
    }
}
