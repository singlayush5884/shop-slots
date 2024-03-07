const config = require('./config/config.json')
const ms = require('ms')

const { QuickDB } = require('quick.db')
const db = new QuickDB()

const { Client, GatewayIntentBits, ActivityType, PermissionsBitField, EmbedBuilder } = require('discord.js')
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
    ]
})

const { GiveawaysManager } = require('discord-giveaways');
const manager = new GiveawaysManager(client, {
    storage: './giveaways.json',
    default: {
        botsCanWin: false,
        embedColor: '#FF0000',
        embedColorEnd: '#000000',
        reaction: '🎉'
    }
});

client.giveawaysManager = manager;

client.on('ready', async () => {
    client.user.setPresence({
        activities: [{ name: `Slots`, type: ActivityType.Watching }],
        status: 'dnd',
    })
    console.log(`Logged in as ${client.user.tag}!`);
})

client.on('messageCreate', async (message) => {
    if (!message.guild) return;
    if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.Administrator)) return message.reply('I don\'t have required permission i.e. \`Administrator\`')
    if (!message.content.startsWith(config.prefix)) return;

    let args = message.content.slice(config.prefix.length).trim().split(/ +/g);
    const cmd = args[0]
    args = args.slice(1)

    if (cmd === 'tos') {
        const embed = new EmbedBuilder()
            .setTitle(`${config.shop_name}`)
            .setDescription(`**SLOT RULES :**\n\n• 3 here ping per day\n• No everyone ping\n• Slots are only for buying and selling\n• Any kind of promotion not allowed\n• No refund on pvt slots\n• You can't share your slot\n• You can't sell your slot\n\n• Follow rules . If you disobey any rule your slot will be revoked without refund\n• Scam = slot revoke without refund`)
        message.channel.send({ embeds: [embed] })
    }

    if (!config.owners.includes(message.author.id)) return;

    if (["add-slot", "addslot"].includes(cmd.toLowerCase())) {
        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0])
        const time = args[1]
        const slotName = args.slice(2).join(" ")

        if (!member) return message.channel.send({ embeds: [{ description: `Specify a correct member` }] })
        if (!time) return message.channel.send({ embeds: [{ description: `Specify a correct time period for the slot` }] })
        if (!slotName) return message.channel.send({ embeds: [{ description: `Specify a correct slot name` }] })

        const channel = await message.guild.channels.create({
            name: slotName,
            type: 0,
            parent: config.parent,
            permissionOverwrites: [
                { id: message.guild.id, deny: [PermissionsBitField.Flags.ViewChannel], },
                { id: config.member_role, allow: [PermissionsBitField.Flags.ViewChannel], deny: [PermissionsBitField.Flags.SendMessages], },
                {
                    id: member.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.MentionEveryone, PermissionsBitField.Flags.AttachFiles],
                },
            ],
        })

        const tosEmbed = new EmbedBuilder()
            .setTitle(`${config.shop_name}`)
            .setDescription(`**SLOT RULES :**\n\n• 3 here ping per day\n• No everyone ping\n• Slots are only for buying and selling\n• Any kind of promotion not allowed\n• No refund on pvt slots\n• You can't share your slot\n• You can't sell your slot\n\n• Follow rules . If you disobey any rule your slot will be revoked without refund\n• Scam = slot revoke without refund`)

        await channel.send({ embeds: [tosEmbed] })

        client.giveawaysManager
            .start(channel, {
                duration: ms(time),
                winnerCount: 1,
                prize: `Owner info`,
                messages: {
                    giveaway: '',
                    giveawayEnded: '**SLOT ENDED**',
                    title: '{this.prize}',
                    drawing: '**Drawing:** {timestamp}',
                    dropMessage: 'Be the first to react with 🎉 !',
                    inviteToParticipate: `**Slot Owner:** ${member}`,
                    winMessage: 'Congratulations, {winners}! You won **{this.prize}**!\n{this.messageURL}',
                    embedFooter: `{this.winnerCount} winner(s)`,
                    noWinner: 'Slot cancelled, no valid participations.',
                    hostedBy: '**Manager:** ${message.author}',
                    winners: 'Winner(s):',
                    endedAt: 'Ended at'
                }
            })
            .then((data) => {
                console.log(data.messageId); // {...} (messageId, end date and more)
            });

        message.channel.send({ embeds: [{ description: `Slot has been created for ${member}` }] }).then(async (msg) => { setTimeout(async () => { await msg.delete(), message.delete() }, 20000) })

    } else if (['pause-slot', 'pauseslot'].includes(cmd.toLowerCase())) {

        const messageId = args[0]
        if (!messageId) return message.channel.send({ embeds: [{ description: `Please specify slots message id` }] }).then(async (msg) => { setTimeout(async () => { await msg.delete() }, 5000) })

        client.giveawaysManager
            .pause(messageId)
            .then(() => {
                message.reply('Success! Slot paused!');
            })
            .catch((err) => {
                message.reply(`An error has occurred, please check and try again.\n\`${err}\``);
            });

    } else if (['unpause-slot', 'unpauseslot'].includes(cmd.toLowerCase())) {

        const messageId = args[0]
        if (!messageId) return message.channel.send({ embeds: [{ description: `Please specify slots message id` }] }).then(async (msg) => { setTimeout(async () => { await msg.delete() }, 5000) })

        client.giveawaysManager
            .unpause(messageId)
            .then(() => {
                message.reply('Slot successfully unpaused!');
            })
            .catch((err) => {
                message.reply(`An error has occurred, please check and try again.\n\`${err}\``);
            });

    } else if (['extend-slot', 'extendslot'].includes(cmd.toLowerCase())) {

        const messageId = args[0]
        if (!messageId) return message.channel.send({ embeds: [{ description: `Please specify slots message id` }] }).then(async (msg) => { setTimeout(async () => { await msg.delete() }, 5000) })

        const time_get = args[1]
        if (!time_get) return message.channel.send({ embeds: [{ description: `Please specify appropriate time for the slot.` }] }).then(async (msg) => { setTimeout(async () => { await msg.delete() }, 5000) })

        client.giveawaysManager
            .edit(messageId, {
                addTime: ms(time_get)
            })
            .then(() => {
                message.reply('Success! Slot extended!');
            })
            .catch((err) => {
                message.reply(`An error has occurred, please check and try again.\n\`${err}\``);
            });

    }


})

client.login(config.token)