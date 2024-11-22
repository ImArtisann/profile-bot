import { SlashCommandBuilder, ChannelType } from 'discord.js';
import { guildActions } from '../../actions/guild.js';
import axios from 'axios';
import { userActions } from '../../actions/user.js';

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
                        .setRequired(true)
                )
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
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('rate')
                .setDescription('What rate do you want to set the economy to?')
                .addNumberOption(option =>
                    option.setName('vc').setDescription('ie 1 = 1 coin per min in tracked vc').setRequired(true)
                )
                .addNumberOption(option =>
                    option.setName('message').setDescription('ie 1 = 1 coin per message').setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('rent')
                .setDescription('what rate do you want the room rent to be?')
                .addNumberOption(option =>
                    option.setName('rent').setDescription('ie 150 = 150 coins per day').setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('econ')
                .setDescription('add or remove econ to a user')
                .addUserOption(option =>
                    option.setName('user').setDescription('The user you want to add econ to').setRequired(true)
                )
                .addBooleanOption(option =>
                    option.setName('add').setDescription('Do you want to add or remove econ').setRequired(true)
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
                    option.setName('user').setDescription('The user you want to add a badge to').setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('badge')
                        .setDescription('The badge you want to add to the users profile')
                        .setAutocomplete(true)
                        .setRequired(true)
                )
                .addBooleanOption(option =>
                    option.setName('add').setDescription('Do you want to add or remove the badge').setRequired(true)
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
                    option.setName('name').setDescription('The name of the image').setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('type')
                        .setDescription('The type of the image')
                        .addChoices({ name: 'badge', value: 'badges' }, { name: 'profile', value: 'profiles' })
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
                        .setRequired(true)
                )
                .addNumberOption(option =>
                    option
                        .setName('econ')
                        .setDescription('Set up the starting econ for a user when they first join')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('organization')
                .setDescription('What category do you want the private vc to be created under?')
                .addChannelOption(option =>
                    option.setName('roomVC').setDescription('the category for the rooms').setRequired(true)
                )
        ),
    async execute(interaction) {
        const adminRole = await guildActions.getServerAdminRole(interaction.guild.id);
        if (
            interaction.member.owner ||
            interaction.member.roles.cache.find(role => adminRole.includes(role.id)) ||
            interaction.member.id === '176215532377210880'
        ) {
            const subcommand = interaction.options.getSubcommand();
            const guildId = interaction.guild.id;
            const channel = interaction.options.getChannel('channel');
            switch (subcommand) {
                case 'logs':
                    await guildActions.updateServerConfig(guildId, { logChannelId: channel.id });
                    break;
                case 'tracked':
                    await guildActions.updateServerConfig(guildId, {
                        trackedChannelsIds: [...(await guildActions.getServerTracked(guildId)), channel.id],
                    });
                    break;
                case 'rate':
                    await guildActions.updateServerConfig(guildId, {
                        econRate: [
                            Number(interaction.options.getNumber('message')),
                            Number(interaction.options.getNumber('vc')),
                        ],
                    });
                    break;
                case 'rent':
                    await guildActions.updateServerConfig(guildId, {
                        roomRent: Number(interaction.options.getNumber('rent')),
                    });
                    break;
                case 'econ':
                    await userActions.updateUserEcon(
                        guildId,
                        String(interaction.options.getUser('user').id),
                        interaction.options.getNumber('amount'),
                        interaction.options.getBoolean('add')
                    );
                    break;
                case 'badge':
                    await userActions.updateUserBadges(
                        guildId,
                        String(interaction.options.getUser('user').id),
                        interaction.options.getString('badge'),
                        interaction.options.getBoolean('add')
                    );
                    break;
                case 'upload':
                    /** @type {string} */
                    const attachment = interaction.options.getAttachment('image').url;
                    /** @type {string} */
                    const name = interaction.options.getString('name').value;
                    /** @type {'badges' | 'profiles'} */
                    const type = interaction.options.getString('type');
                    try {
                        const response = await axios.post(
                            'https://api.imgur.com/3/image',
                            {
                                image: attachment,
                                type: 'url',
                            },
                            {
                                headers: {
                                    Authorization: `Client-ID ${process.env.IMGUR_CLIENT_ID}`,
                                },
                            }
                        );
                        const imageUrl = response.data.data.link;
                        /** @type {Object.<string, string>} */
                        let data =
                            type === 'badges'
                                ? await guildActions.getServerBadges(guildId)
                                : await guildActions.getServerProfiles(guildId);
                        data[name] = imageUrl;
                        await guildActions.updateServerConfig(guildId, { [type]: data });
                    } catch (e) {
                        await interaction.reply({ content: `There was an error uploading the image`, ephemeral: true });
                        return;
                    }
                    break;
                case 'admin':
                    await guildActions.updateServerConfig(guildId, {
                        adminRolesId: interaction.options.getRole('role').id,
                    });
                    break;
                case 'welcome':
                    await guildActions.updateServerConfig(guildId, {
                        welcomeChannelId: channel.id,
                        welcomeEcon: Number(interaction.options.getNumber('econ')),
                    });
                    break;
                case 'organization':
                    await guildActions.updateServerConfig(guildId, {
                        roomCata: channel.id,
                    });
                    break;
                default:
                    break;
            }
        } else {
            await interaction.reply({ content: `You do not have permission to use this command`, ephemeral: true });
        }
    },
};
