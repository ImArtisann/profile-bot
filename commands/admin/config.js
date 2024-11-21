import {SlashCommandBuilder, ChannelType} from "discord.js";
import {databaseActions} from "../../database/mongodb.js";
import {guildActions} from "../../classes/guild.js";

export default {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Configuration for how the bot interacts with the server')
        .addSubcommand(subcommand =>
            subcommand
                .setName('logs')
                .setDescription('What channel do you want the VC logs to be sent to?')
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('The channel you want the logs to be sent to')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('tracked')
                .setDescription('add a channel you want to track for VC logs')
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('The channel you want to add to the tracked channels')
                        .addChannelTypes(ChannelType.GuildVoice)
                        .setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('rate')
                .setDescription('What rate do you want to set the economy to?')
                .addNumberOption(option =>
                    option
                        .setName('rate')
                        .setDescription('ie 1 = 1 coin per min')
                        .setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('rent')
                .setDescription('what rate do you want the room rent to be?')
                .addNumberOption(option =>
                    option
                        .setName('rent')
                        .setDescription('ie 150 = 150 coins per day')
                        .setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('econ')
                .setDescription('add or remove econ to a user')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('The user you want to add econ to')
                        .setRequired(true)
                )
                .addBooleanOption(option =>
                    option
                        .setName('add')
                        .setDescription('Do you want to add or remove econ')
                        .setRequired(true)
                )
                .addNumberOption(option =>
                    option
                        .setName('amount')
                        .setDescription('The amount of econ you want to add or remove')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('badge')
                .setDescription('Add a new badge to a users profile or remove a badge')
            .addUserOption(option =>
                option
                    .setName('user')
                    .setDescription('The user you want to add a badge to')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option
                    .setName('badge')
                    .setDescription('The badge you want to add to the users profile')
                    .setRequired(true)
            )
            .addBooleanOption(option =>
                option
                    .setName('add')
                    .setDescription('Do you want to add or remove the badge')
                    .setRequired(true)
            )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('upload')
                .setDescription('Upload a new badge or profile base to the bot for the server')
            .addAttachmentOption(option =>
                option
                    .setName('image')
                    .setDescription('The image you want to add to you server options')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option
                    .setName('name')
                    .setDescription('The name of the image')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option
                    .setName('type')
                    .setDescription('The type of the image')
                    .addChoices(
                        {name: 'badge', value: 'badge'},
                        {name: 'profile', value: 'profile'}
                    )
                    .setRequired(true)
            )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('admin')
                .setDescription('Add the admin roles that can use the admin commands')
            .addRoleOption(option =>
                option
                    .setName('role')
                    .setDescription('The role you want to add to the admin roles')
                    .setRequired(true)
            )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('welcome')
                .setDescription('Set up the welcome settings for the server')
            .addChannelOption(option =>
                option
                    .setName('channel')
                    .setDescription('The channel you want to send the welcome message to')
                    .setRequired(false)
            )
            .addNumberOption(option =>
                option
                    .setName('econ')
                    .setDescription('Set up the starting econ for a user when they first join')
                    .setRequired(false)
            )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('shop')
                .setDescription('Set up the shop settings for the server')
            .addBooleanOption(option =>
                option
                    .setName('enabled')
                    .setDescription('Enable or disable the shop')
                    .setRequired(true)
            )
        ),
    async execute(interaction) {
        if (interaction.member.roles.cache.has('1252396630339223613') || interaction.member.roles.cache.has('1298317864058617867') || interaction.member.id === '176215532377210880') {
            const subcommand = interaction.options.getSubcommand();
            const guildId = interaction.guild.id;
            const channel = interaction.options.getChannel('channel');
            switch (subcommand) {
                case 'logs':
                    await guildActions.updateServerConfig(guildId, {logChannelId: channel.id});
                    break;
                case 'tracked':
                    await guildActions.updateServerConfig(guildId, {trackedChannelsIds: [...await guildActions.getServerTracked(guildId), channel.id]});
                    break;
                case 'rate':
                    await guildActions.updateServerConfig(guildId, {econRate: Number(interaction.options.getNumber('rate'))});
                    break;
                case 'rent':
                    await guildActions.updateServerConfig(guildId, {roomRent: Number(interaction.options.getNumber('rent'))});
                    break;
                case 'econ':
                    await guildActions.updateUserEcon(
                        guildId,
                        String(interaction.options.getUser('user').id),
                        interaction.options.getNumber('amount'),
                        interaction.options.getBoolean('add')
                    );
                    break;
                case 'badge':
                    break;
                case 'upload':
                    break;
                case 'admin':
                    break;
                case 'welcome':
                    break;
                default:
                    break;
            }
        } else {
            await interaction.reply({content: `You do not have permission to use this command`, ephemeral: true});
        }
    }
}