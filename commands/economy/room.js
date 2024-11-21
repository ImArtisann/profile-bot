import {
    ActionRowBuilder,
    ButtonBuilder,
    ChannelType,
    ButtonStyle,
    EmbedBuilder,
    PermissionsBitField,
    SlashCommandBuilder,
    StringSelectMenuBuilder, UserSelectMenuBuilder
} from "discord.js";
import {databaseActions} from "../../database/mongodb.js";

export default {
    data: new SlashCommandBuilder()
        .setName('room')
        .setDescription('used to rent a private VC')
        .addSubcommand(subcommand =>
            subcommand
                .setName('rent')
                .setDescription('Rent a private VC with penta coins')
                .addIntegerOption(option =>
                    option
                        .setName('time')
                        .setDescription('How long you want to rent the VC for in days')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('name')
                        .setDescription('The name of the VC')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('deposit')
                .setDescription('Add more funds to the room')
                .addIntegerOption(option =>
                    option
                        .setName('amount')
                        .setDescription('How many coins you want to deposit')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('invite')
                .setDescription('Invite someone to the room')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('What user would you like to invite')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('kick')
                .setDescription('Kick someone to the room')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('What user would you like to kick')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Display the status of the room')
        ),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        switch (subcommand) {
            case 'rent':
                await rentRoom(interaction);
                break;
            case 'deposit':
                await deposit(interaction);
                break;
            case 'invite':
                await invite(interaction);
                break;
            case 'kick':
                await kick(interaction);
                break;
            case 'status':
                await status(interaction);
                break;
            default:
                await interaction.reply({content: 'Invalid subcommand', ephemeral: true});
                break;
        }
    }
}

async function rentRoom(interaction){
    const guild = interaction.guild;
    const serverConfig = (await databaseActions.getConfig(guild.id))[0];
    const user = interaction.user.id;
    const getUser = (await databaseActions.getUser(user))[0];

    if(!getUser || !getUser.econ){
        await interaction.reply({content: 'You do not have an economy profile yet', ephemeral: true});
        return;
    }

    if(getUser.econ < serverConfig.rent){
        await interaction.reply({content: 'You do not have enough penta coins to rent a room', ephemeral: true});
    }else {
        const name = interaction.options.getString('name');
        const time = interaction.options.getInteger('time');
        if (time * serverConfig.rent > getUser.econ) {
            await interaction.reply({content: 'You do not have enough penta coins to rent a room', ephemeral: true});
            return;
        }
        guild.channels.create({
            name: name,
            type: ChannelType.GuildVoice,
            permissionOverwrites: [
                {
                    id: guild.roles.everyone.id,
                    allow: [PermissionsBitField.Flags.ViewChannel],
                    deny: [
                        PermissionsBitField.Flags.Connect,
                        PermissionsBitField.Flags.Speak
                    ]
                },
                {
                    id: user,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.Connect,
                        PermissionsBitField.Flags.Speak,
                        PermissionsBitField.Flags.Stream,
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.EmbedLinks,
                        PermissionsBitField.Flags.AttachFiles,
                        PermissionsBitField.Flags.AddReactions,
                        PermissionsBitField.Flags.UseApplicationCommands,
                        PermissionsBitField.Flags.UseExternalEmojis,
                        PermissionsBitField.Flags.ReadMessageHistory,
                    ],
                }
            ]
        }).then(async channel => {
            await databaseActions.updateUser(user, {
                econ: Number(getUser.econ - (time * serverConfig.rent)),
                room: channel.id,
            });
            await databaseActions.updateRoom(channel.id, {
                owner: user,
                name: name,
                time: time,
                balance: Number(time * serverConfig.rent),
                timeStamp: Date.now(),
                members: [user],
                channel: channel.id,
                guild: guild.id
            })
            let tracked = serverConfig.tracked;
            tracked.push(channel.id);
            await databaseActions.updateConfig(guild.id, {
                tracked: tracked
            })
            await channel.send({
                embeds: [await createEmbed(channel.id)],
                components: await createActions(guild, channel.id)
            });
        })
        await interaction.reply({content: 'You have rented a room', ephemeral: true});
    }

}

async function deposit(interaction){
    const user = interaction.user.id;
    const getUser = (await databaseActions.getUser(user))[0];
    if(!getUser || !getUser.econ){
        await interaction.reply({content: 'You do not have an economy profile yet', ephemeral: true});
        return;
    }
    const amount = interaction.options.getInteger('amount');
    if(amount > getUser.econ){
        await interaction.reply({content: 'You do not have enough penta coins to deposit', ephemeral: true});
        return;
    }
    const room = getUser.room;
    const roomData = (await databaseActions.getRooms(room))[0];
    await databaseActions.updateUser(user, {econ: Number(getUser.econ - amount)});
    await databaseActions.updateRoom(room, {balance: Number(roomData.balance + amount)});
    await interaction.reply({content: 'You have deposited ' + amount + ' penta coins', ephemeral: true});
}

async function invite(interaction){
    const guild = interaction.guild;
    const user = interaction.user.id;
    const getUser = (await databaseActions.getUser(user))[0];
    if(!getUser || !getUser.econ){
        await interaction.reply({content: 'You do not have an economy profile yet', ephemeral: true});
        return;
    }
    const room = getUser.room;
    const roomData = (await databaseActions.getRooms(room))[0];
    if(roomData.owner !== user){
        await interaction.reply({content: 'You are not the owner of this room', ephemeral: true});
        return;
    }
    const member = interaction.options.getUser('member');
    if(!member){
        await interaction.reply({content: 'You must specify a member to invite', ephemeral: true});
        return;
    }
    if(roomData.members.includes(member.id)) {
        await interaction.reply({content: 'That member is already in this room', ephemeral: true});
        return;
    }
    await guild.channels.cache.get(room).permissionOverwrites.edit(member.id, {
        ViewChannel: true,
        Connect: true,
        Speak: true,
        SendMessages: true,
        EmbedLinks: true,
        AttachFiles: true,
        AddReactions: true,
        UseApplicationCommands: true,
        UseExternalEmojis: true,
        ReadMessageHistory: true,
    })
    await databaseActions.updateRoom(room, {members: [...roomData.members, member.id]});
    await interaction.reply({content: 'You have invited ' + member.username + ' to your room', ephemeral: true});
}

async function kick(interaction){
    const user = interaction.user.id;
    const getUser = (await databaseActions.getUser(user))[0];
    if(!getUser || !getUser.econ){
        await interaction.reply({content: 'You do not have an economy profile yet', ephemeral: true});
        return;
    }
    const room = getUser.room;
    const roomData = (await databaseActions.getRooms(room))[0];
    if(roomData.owner !== user){
        await interaction.reply({content: 'You are not the owner of this room', ephemeral: true});
        return;
    }
    const member = interaction.options.getUser('member');
    if(!member){
        await interaction.reply({content: 'You must specify a member to kick', ephemeral: true});
        return;
    }
    if(!roomData.members.includes(member.id)) {
        await interaction.reply({content: 'That member is not in this room', ephemeral: true});
        return;
    }
    await databaseActions.updateRoom(room, {members: roomData.members.filter(userId => userId !== member.id)});
    const channel = await interaction.guild.channels.fetch(room);
    channel.kick(member.id);
    await interaction.reply({content: 'You have kicked ' + member.username + ' from your room', ephemeral: true});
}

async function status(interaction){
    const guild = interaction.guild;
    const user = interaction.user.id;
    const getUser = (await databaseActions.getUser(user))[0];
    if(!getUser || !getUser.econ){
        await interaction.reply({content: 'You do not have an economy profile yet', ephemeral: true});
        return;
    }
    const room = getUser.room;
    if(!room){
        await interaction.reply({content: 'You are not in a room', ephemeral: true});
        return;
    }
    console.log(room);
    const channel = await interaction.guild.channels.fetch(room);
    await channel.send({
        embeds: [await createEmbed(room)],
        components: await createActions(guild, room)
    });
}

async function createEmbed(channelId){
    console.log(`Creating embed for: ${channelId}`);
    const room = (await databaseActions.getRoom(channelId))[0];
    console.log(room);
    return new EmbedBuilder()
        .setTitle(`Room Control Panel`)
        .addFields(
            {name: 'Channel', value: `<#${room.channel}>`, inline: true},
            {name: 'Owner', value: `<@${room.owner}>`, inline: true},
            {name: 'Room Balance:', value: `${room.balance}`, inline: true},
            {name: 'Created At', value: `<t:${Math.floor(room.timeStamp / 1000)}:f>`, inline: true},
            {name: 'Members', value: room.members.map(userId => `<@${userId}>`).join(', '), inline: false},        )
        .setColor(0x0099FF);
}

async function createActions(guild, channelId) {
    const room = (await databaseActions.getRoom(channelId))[0];

    const buttonRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('Deposit')
                .setLabel('Deposit')
                .setStyle(ButtonStyle.Primary)
        );

    const inviteRow = new ActionRowBuilder()
        .addComponents(
            new UserSelectMenuBuilder()
                .setCustomId('Invite')
                .setPlaceholder('Select a member')
                .setMinValues(1)
        );

    const kickRow = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('Kick')
                .setPlaceholder('Remove a member')
                .addOptions(
                    room.members.map(userId => ({
                        label: guild.members.cache.get(userId).user.username,
                        value: userId
                    }))
                )
        );

    return [buttonRow, inviteRow, kickRow];
}
