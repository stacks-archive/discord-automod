module.exports = {
    mod_message_init: (client) => ({
        embed: {
            color: 3447003,
            author: {
                name: 'Blockstack',
                icon_url: client.user.avatarURL
            },
            description: "I see that you want to report a message that might be against our TOS?",
            timestamp: new Date(),
            footer: {
                icon_url: client.user.avatarURL,
                text: "© Blockstack"
            }
        }
    }),
    mod_queue: (client, user, message_id, message) => ({
        embed: {
            color: 3447003,
            author: {
                name: 'Blockstack',
                icon_url: client.user.avatarURL
            },
            description: `${user.id} has flagged message #${message_id}. The message was: ${message}. 👍 to confirm, 👎 to decline`,
            timestamp: new Date(),
            footer: {
                icon_url: client.user.avatarURL,
                text: "© Blockstack"
            }
        }
    }),
    send_guidelines: (client, description) => ({
        embed: {
            color: 3447003,
            author: {
                name: 'Blockstack',
                icon_url: client.user.avatarURL
            },
            description,
            timestamp: new Date(),
            footer: {
                icon_url: client.user.avatarURL,
                text: "© Blockstack"
            }
        }
    }),
    send_roaster: (client, description) => ({
        embed: {
            color: 3447003,
            author: {
                name: 'Blockstack',
                icon_url: client.user.avatarURL
            },
            description,
            timestamp: new Date(),
            footer: {
                icon_url: client.user.avatarURL,
                text: "© Blockstack"
            }
        }
    }),
    log: (client, description) => ({
        embed: {
            color: 3447003,
            author: {
                name: 'Blockstack',
                icon_url: client.user.avatarURL
            },
            description,
            timestamp: new Date(),
            footer: {
                icon_url: client.user.avatarURL,
                text: "© Blockstack"
            }
        }
    }),
}