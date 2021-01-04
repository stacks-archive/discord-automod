const Discord = require('discord.js');
const client = new Discord.Client({ partials: Object.values(Discord.Constants.PartialTypes) });
const { mod_message_init, mod_queue, send_guidelines, log, send_roaster } = require('./constants/messages/message_mod/index'),
    { createPendingItem } = require('./app/controllers/PendingItems'),
    { Status, PendingItem, Vote, VoteRequirement, Guideline, RoleRule } = require('./app/models'),
    { formatGuidelineMessages } = require('./app/lib/util'),
    moment = require('moment')

module.exports = client
client.on('ready', async (msg) => {
    // delete community guideline messages 
    await client.channels.cache.get(process.env.COMMUNITY_GUIDELINE_CHANNEL_ID).messages.fetch() // Fetch last 100 messages
        .then(messages => {
            messages.forEach((message) => {
                message.delete()
            })
        })
    // delete roaster messages    
    await client.channels.cache.get(process.env.ROASTER_CHANNEL_ID).messages.fetch() // Fetch last 100 messages
        .then(messages => {
            messages.forEach((message) => {
                message.delete()
            })
        })

    let role = client.guilds.cache.get(process.env.MOD_CHANNEL_ID).roles.cache.find(role => role.name === "CM1");
    let text = `React to enroll as a community manager.\n Current Role  :\n`;
    role.members.forEach(user => {
        text += `${user}\n`
    });
    Promise.all([client.channels.cache.get(process.env.ROASTER_CHANNEL_ID).send(send_roaster(client, text)).then(sentEmbed => {
        sentEmbed.react("📝")
    })])
    // Send the quidelines
    const guidelines = await Guideline.query().eager('action.voteRequirement')
    Promise.all(guidelines.map(g => client.channels.cache.get(process.env.COMMUNITY_GUIDELINE_CHANNEL_ID).send(send_guidelines(client, formatGuidelineMessages(g))).then(sentEmbed => {
        sentEmbed.react("📝")
    })))
});

const events = {
    MESSAGE_REACTION_ADD: 'messageReactionAdd',
    MESSAGE_REACTION_REMOVE: 'messageReactionRemove',
};
client.on('message', async (message, user) => {
    // consider only DMs to bot
    var expression = /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi;
    let regex = new RegExp(expression);
    if (message.content.match(regex)) {
        const messageIDs = message.content.split('/')
        const messgaeId = messageIDs[messageIDs.length - 1]
        const channelId = messageIDs[messageIDs.length - 2]
        const guildId = messageIDs[messageIDs.length - 3]
        if (messgaeId.length === 18 && channelId.length === 18 && guildId.length === 18) {
            client.channels.cache.get(channelId).messages.fetch(messgaeId).then(async msg => {
                return await createPendingItemAction(messgaeId, message.author.id, msg.author.id, guildId, channelId, msg.content, message.author)
            })
        }
    }
})
client.on('messageReactionRemove', async (reaction, user) => {
    // removing myself from role
    if (reaction.message.channel.id === process.env.ROASTER_CHANNEL_ID && reaction._emoji.name === '📝') {
        let role = reaction.message.guild.roles.cache.find(role => role.name === "CM1");

        reaction.message.guild.members.fetch(user.id).then(async (member) => {
            if (member.roles.cache.find(r => r.name === "CM1")) {
                await member.roles.remove(role);
                updateRoasterRoles(reaction, user);
            }
        })
        return
    }
})
client.on('messageReactionAdd', async (reaction, user) => {
    // updating roles here
    if (reaction.message.channel.id === process.env.ROASTER_CHANNEL_ID && reaction._emoji.name === '📝') {
        let role = reaction.message.guild.roles.cache.find(role => role.name === "CM1");
        const roleRule = await RoleRule.query().findOne({ role_id: role.id })
        if (!user.bot) {
            let now = moment()
            let joined = moment(reaction.message.channel.guild.members.cache.get(user.id).joinedTimestamp)
            // check for no of days in sever
            if ((now.diff(joined, 'days') > roleRule.days_in_server)) {
                user.send({
                    embed: {
                        color: 3447003,
                        author: {
                            name: 'Blockstack',
                            icon_url: client.user.avatarURL
                        },
                        description: `Sorry, you have not been part of the server long enough. This role requires you to be part of this server for ${roleRule.days_in_server} days.`,
                        timestamp: new Date(),
                        footer: {
                            icon_url: client.user.avatarURL,
                            text: "© Blockstack"
                        }
                    }
                })
                return
            }
        }
        // check for maximum roles in server
        if (role.members.size >= roleRule.max_allowed) {
            user.send({
                embed: {
                    color: 3447003,
                    author: {
                        name: 'Blockstack',
                        icon_url: client.user.avatarURL
                    },
                    description: `Sorry, we currently do not have any open ${role.name} positions. Please check back at a later time.`,
                    timestamp: new Date(),
                    footer: {
                        icon_url: client.user.avatarURL,
                        text: "© Blockstack"
                    }
                }
            })
            return
        }
        reaction.message.guild.members.fetch(user.id).then(async (member) => {
            await member.roles.add(role);
            updateRoasterRoles(reaction, user);
        })
        return
    }
    // if 📝 was reacted in Community channel
    if (reaction.message.channel.id === process.env.COMMUNITY_GUIDELINE_CHANNEL_ID) {
        checkEmojiActions(reaction, user)
        return
    }
    if (reaction._emoji.name === '🚩') {
        let author_id = reaction.message.author && reaction.message.author.id
        if (reaction.message.partial) {
            let message = await reaction.message.fetch()
            author_id = message.author.id
        }
        return await createPendingItemAction(reaction._emoji.reaction.message.id, user.id, author_id, reaction.message.guild.id, reaction.message.channel.id, reaction.message.content, user)
    } else if (reaction.emoji.name === '👍') {
        let message = await reaction.message.fetch()
        if (user.bot) {
            return
        }
        if (reaction.message.channel.id === process.env.MOD_QUEUE_CHANNEL_ID) {
            return await onApproveMessage(message.id, reaction, user)
        }
        return await sendToMOdQueue(message.id, reaction, user)

        // Take message ID that it was reacted too... and compare with DB `pending items`. If we have item that 
        // matches and status === 'setup', then.. change status to 'pending'. Send another message to use
        // stating: "Thank you for confirming, we have put your message in the mod queue".
        //
        // Actions To Take:
        // - Send message to user
        // - Send message to #mod-queue
        // -- "{user_id} has flagged message {message_id}. The message was: {message_body}. 👍 to confirm, 👎 to decline"
    } else if (reaction.emoji.name === '👎') {
        // Take message ID that it was reacted too... and compare with DB `pending items`. If we have item that 
        // matches and status === 'setup', then.. change status to 'canceled'. Send another message to use
        // stating: "Your request has been canceled".
        let message = await reaction.message.fetch()
        if (user.bot) {
            return
        }
        if (reaction.message.channel.id === process.env.MOD_QUEUE_CHANNEL_ID) {
            return await rejectAction(message.id, reaction, user)
        }
        const setup = await Status.query().findOne({ title: 'setup' })
        const wasItemFound = await PendingItem.query().findOne({ status_id: setup.id, reference_message_id: message.id })
        if (wasItemFound) {
            return await cancelAction(wasItemFound, reaction, user)
        }
    } else {
        // Nothing yet
    }
});

// Log our bot in using the token from https://discord.com/developers/applications/me
client.login(process.env.SERVER_ID);


function checkEmojiActions(reaction, user) {
    let emoji = reaction._emoji
    if (!user.bot && emoji.name == '📝') {
        // send instructions to the user how to copy the message id
        user.send({
            embed: {
                color: 3447003,
                author: {
                    name: 'Blockstack',
                    icon_url: client.user.avatarURL
                },
                description: `I see you are looking to remove a message. Please reply with the message link. Here are instructions on how to do that:`,
                timestamp: new Date(),
                footer: {
                    icon_url: client.user.avatarURL,
                    text: "© Blockstack"
                }
            }
        })
    }
}

async function createPendingItemAction(reference_message_id, action_taker_user_id, message_sender_id, message_guild_id, channel_id, message, user) {
    const status = await Status.query().findOne({ title: 'setup' })
    await createPendingItem({
        status_id: status.id,
        reference_message_id,
        action_taker_user_id,
        message_sender_id,
        message_guild_id,
        channel_id,
    })
    user.send({
        embed: {
            color: 3447003,
            author: {
                name: 'Blockstack',
                icon_url: client.user.avatarURL
            },
            description: `I see that you want to report the following message: ${message}.Message ID: #${reference_message_id}`,
            timestamp: new Date(),
            footer: {
                icon_url: client.user.avatarURL,
                text: "© Blockstack"
            }
        }
    }).then(sentEmbed => {
        sentEmbed.react("👍");
        sentEmbed.react("👎");
    }).catch((e) => {
        console.log(e)
        console.log('something went wrong');
    });
}

async function onApproveMessage(message_id, reaction, user) {
    let m_id = message_id.split('.')[0]
    const statuses = await Status.query()
    const pending = statuses.find(f => f.title === 'pending')
    const approved = statuses.find(f => f.title === 'approved')
    const pendingItem = await PendingItem.query().findOne({ reference_message_id: m_id, status_id: pending.id })
    let vote_count = pendingItem.vote_count
    if (!vote_count) {
        vote_count = 1
    } else {
        vote_count += 1
    }
    const vouteRequirement = await VoteRequirement.query().findOne({}, qb => {
        qb.joinRelation('action').where(qb1 => {
            qb1.where(`action.title`, '=', 'Flag') // Change the action type if Required
        })
    })
    if (vote_count === vouteRequirement.number_of_votes) {
        // if the count is 2, delete the reported message.
        client.channels.cache.get(pendingItem.channel_id).messages.fetch(pendingItem.reference_message_id).then(message => message.delete())
        // delete the mod queue message as well
        reaction.message.delete()

        // log mod queue message into activity log
        await PendingItem.query().patchAndFetchById(pendingItem.id, { status_id: approved.id })
        client.users.cache.get(pendingItem.message_sender_id).send({
            embed: {
                color: 3447003,
                author: {
                    name: 'Blockstack',
                    icon_url: client.user.avatarURL
                },
                description: 'Your message has been deleted.',
                timestamp: new Date(),
                footer: {
                    icon_url: client.user.avatarURL,
                    text: "© Blockstack"
                }
            }
        })
        client.channels.cache.get(process.env.ACTIVITY_LOG_CHANNEL_ID).send(log(client, `message #${pendingItem.reference_message_id} was deleted from #${pendingItem.channel_id}.`))
    }

    const updateVoteCount = await PendingItem.query().patchAndFetchById(pendingItem.id, { vote_count })
    return await Vote.query().insert({ user_id: user.id, approved: true, pending_item_id: pendingItem.id })
}

async function sendToMOdQueue(message_id, reaction, user) {
    const setup = await Status.query().findOne({ title: 'setup' })
    const wasItemFound = await PendingItem.query().findOne({ status_id: setup.id, reference_message_id: message_id })
    if (wasItemFound) {
        const pending = await Status.query().findOne({ title: 'pending' })
        user.send({
            embed: {
                color: 3447003,
                author: {
                    name: 'Blockstack',
                    icon_url: client.user.avatarURL
                },
                description: 'Thank you for confirming, we have put your message in the mod queue',
                timestamp: new Date(),
                footer: {
                    icon_url: client.user.avatarURL,
                    text: "© Blockstack"
                }
            }
        })
        client.channels.cache.get(wasItemFound.channel_id).messages.fetch(wasItemFound.reference_message_id).then(message => {
            client.channels.cache.get(process.env.MOD_QUEUE_CHANNEL_ID).send(mod_queue(client, user, message_id, message)).then(sentEmbed => {
                // let count = sentEmbed.channel.messages.cache.size
                // console.log(count, 'count')
                // let name = count === 1 ? `${count}-open-item` : `${count}-open-items`
                // console.log(name, 'name');
                // client.channels.cache.get(process.env.MOD_QUEUE_CHANNEL_ID).setName(name);

                sentEmbed.react("👍");
                sentEmbed.react("👎");
            }).catch((e) => {
                console.log(e)
                console.log('something went wrong 1');
            });

        })
        return await PendingItem.query().patchAndFetchById(wasItemFound.id, { status_id: pending.id })
    }
}

async function rejectAction(message_id, reaction, user) {
    let m_id = message_id.split('.')[0]
    const statuses = await Status.query()
    const pending = statuses.find(f => f.title === 'pending')
    const rejected = statuses.find(f => f.title === 'rejected')
    const pendingItem = await PendingItem.query().findOne({ reference_message_id: m_id, status_id: pending.id })
    let vote_count = pendingItem.vote_count
    const vouteRequirement = await VoteRequirement.query().findOne({}, qb => {
        qb.joinRelation('action').where(qb1 => {
            qb1.where(`action.title`, '=', 'Flag') // Change the action type if Required
        })
    })
    if (!vote_count) {
        vote_count = -1
    } else {
        vote_count -= 1
    }
    if (vote_count === -(vouteRequirement.number_of_votes)) {
        await PendingItem.query().patchAndFetchById(pendingItem.id, { status_id: rejected.id })
    }
    // delete the mod queue message as well
    reaction.message.delete()

    // log mod queue message into activity log
    client.channels.cache.get(process.env.ACTIVITY_LOG_CHANNEL_ID).send(log(client, `message #${m_id} was not deleted because it was voted down.`))

    const updateVoteCount = await PendingItem.query().patchAndFetchById(pendingItem.id, { vote_count })
    return await Vote.query().insert({ user_id: user.id, approved: false, pending_item_id: pendingItem.id })
}

async function cancelAction(wasItemFound, reaction, user) {
    const canceled = await Status.query().findOne({ title: 'canceled' })
    user.send({
        embed: {
            color: 3447003,
            author: {
                name: 'Blockstack',
                icon_url: client.user.avatarURL
            },
            description: 'Your request has been canceled',
            timestamp: new Date(),
            footer: {
                icon_url: client.user.avatarURL,
                text: "© Blockstack"
            }
        }
    })
    return await PendingItem.query().patchAndFetchById(wasItemFound.id, { status_id: canceled.id })
}

const updateRoasterRoles = async (reaction, user) => {
    if (!user.bot) {
        // delete roaster messages    
        await client.channels.cache.get(process.env.ROASTER_CHANNEL_ID).messages.fetch() // Fetch last 100 messages
            .then(messages => {
                messages.forEach((message) => {
                    message.delete()
                })
            })
        let role = reaction.message.guild.roles.cache.find(role => role.name === "CM1");
        let text = `React to enroll as a community manager.\n Current Role  :\n`;
        role.members.forEach(user => {
            text += `${user}\n`
        });

        Promise.all([client.channels.cache.get(process.env.ROASTER_CHANNEL_ID).send(send_roaster(client, text)).then(sentEmbed => {
            sentEmbed.react("📝")
        })])
    }
}