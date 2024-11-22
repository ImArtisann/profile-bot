import { ChannelType, ButtonStyle, SlashCommandBuilder } from 'discord.js';
import { guildActions } from '../../actions/guild.js';
import { roomsActions } from '../../actions/rooms.js';

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
                    option.setName('name').setDescription('The name of the VC').setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('deposit')
                .setDescription('Add more funds to the room')
                .addIntegerOption(option =>
                    option.setName('amount').setDescription('How many coins you want to deposit').setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('invite')
                .setDescription('Invite someone to the room')
                .addUserOption(option =>
                    option.setName('user').setDescription('What user would you like to invite').setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('kick')
                .setDescription('Kick someone to the room')
                .addUserOption(option =>
                    option.setName('user').setDescription('What user would you like to kick').setRequired(true)
                )
        )
        .addSubcommand(subcommand => subcommand.setName('status').setDescription('Display the status of the room')),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const guild = interaction.guild;
        const user = interaction.user;
        const channel = interaction.channel;
        const serverRooms = await roomsActions.getServerRooms(guild.id);
        switch (subcommand) {
            case 'rent':
                const rent = await guildActions.getServerRent(guild.id);
                const success = await roomsActions.createRoom(guild, user.id, {
                    name: interaction.options.getString('name'),
                    createdAt: new Date.now().toString(),
                    owner: user.id,
                    members: [user.id],
                    rentTime: interaction.options.getInteger('time'),
                    roomBalance: Number(rent * interaction.options.getInteger('time')),
                });
                if (!success) {
                    await interaction.reply({
                        content: 'You do not have enough coins to rent a room',
                        ephemeral: true,
                    });
                    return;
                }
                await interaction.reply({ content: 'You have rented a room', ephemeral: true });
                break;
            case 'deposit':
                if (serverRooms.includes(channel.id)) {
                    const deposit = await roomsActions.deposit(
                        guild.id,
                        channel.id,
                        user.id,
                        interaction.options.getInteger('amount')
                    );
                    if (deposit) {
                        await interaction.reply({
                            content: 'You have deposited ' + interaction.options.getInteger('amount') + ' coins',
                            ephemeral: true,
                        });
                    } else {
                        await interaction.reply({
                            content: 'You do not have enough coins to deposit',
                            ephemeral: true,
                        });
                    }
                } else {
                    await interaction.reply({
                        content: 'You must use this command in the room you want to deposit to',
                        ephemeral: true,
                    });
                }
                break;
            case 'invite':
                if (serverRooms.includes(channel.id)) {
                    const invite = await roomsActions.roomInvite(
                        guild.id,
                        channel.id,
                        interaction.options.getUser('user')
                    );
                    if (invite) {
                        await interaction.reply({
                            content: 'You have invited ' + interaction.options.getUser('user') + ' to the room',
                            ephemeral: true,
                        });
                    } else {
                        await interaction.reply({
                            content:
                                'You must use this command in the room youd like to invite the user to or the user is already in the room',
                            ephemeral: true,
                        });
                    }
                } else {
                    await interaction.reply({
                        content: 'You must use this command in the room youd like to invite the user to',
                        ephemeral: true,
                    });
                }
                break;
            case 'kick':
                if (serverRooms.includes(channel.id)) {
                    const kick = await roomsActions.roomKick(
                        guild.id,
                        channel.id,
                        interaction.options.getUser('user').id
                    );
                    if (kick) {
                        await interaction.reply({
                            content: 'You have kicked ' + interaction.options.getUser('user').id + ' from the room',
                            ephemeral: true,
                        });
                    } else {
                        await interaction.reply({
                            content:
                                'must use this command in the room youd like to kick the user from or the user is not in the room',
                            ephemeral: true,
                        });
                    }
                } else {
                    await interaction.reply({
                        content: 'You must use this command in the room youd like to kick the user from',
                        ephemeral: true,
                    });
                }
                break;
            case 'status':
                if (serverRooms.includes(channel.id)) {
                    const status = await roomsActions.getRoomStatus(guild.id, channel.id);
                    if (status.length > 0) {
                        await interaction.reply({
                            embeds: [status[0]],
                            components: status[1],
                        });
                    } else {
                        await interaction.reply({
                            content: 'The room is not found',
                            ephemeral: true,
                        });
                    }
                } else {
                    await interaction.reply({
                        content: 'You must use this command in the room youd like to get the status of',
                        ephemeral: true,
                    });
                }
                break;
            default:
                await interaction.reply({ content: 'Invalid subcommand', ephemeral: true });
                break;
        }
    },
};
