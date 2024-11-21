import {SlashCommandBuilder, ChannelType} from "discord.js";
import {databaseActions} from "../../database/mongodb.js";

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
        ),
    async execute(interaction) {
        if (interaction.member.roles.cache.has('1252396630339223613') || interaction.member.roles.cache.has('1298317864058617867') || interaction.member.id === '176215532377210880') {
            const subcommand = interaction.options.getSubcommand();
            switch (subcommand) {
                case 'logs':
                    await setLogs(interaction);
                    break;
                case 'tracked':
                    await setTracked(interaction);
                    break;
                case 'rate':
                    await setRate(interaction);
                    break;
                case 'rent':
                    await setRent(interaction);
                    break;
                case 'econ':
                    await econ(interaction);
                    break;
                default:
                    break;
            }
        } else {
            await interaction.reply({content: `You do not have permission to use this command`, ephemeral: true});
        }
    }
}


async function setLogs(interaction) {
    const guildId = interaction.guild.id;
    const channel = interaction.options.getChannel('channel');
    await databaseActions.updateConfig(guildId, {
        logs: channel.id
    });
    await interaction.reply({content: `Logs will now be sent to ${channel}`, ephemeral: true});
}

async function setTracked(interaction) {
    const guildId = interaction.guild.id;
    const channel = interaction.options.getChannel('channel')
    const guildData = await databaseActions.getConfig(guildId);
    let data = {}
    if(guildData.length > 0){
        if(!guildData[0]['tracked']){
            data['tracked'] = [channel.id];
        }else if(typeof guildData[0]['tracked'] === 'string'){
            data['tracked'] = [guildData[0]['tracked']];
            if(data['tracked'].includes(channel.id)){
                await interaction.reply({content: `Channel is already being tracked`, ephemeral: true});
                return;
            }
            data['tracked'].push(channel.id);
        }else{
            data['tracked'] = guildData[0]['tracked'];
            if(data['tracked'].includes(channel.id)){
                await interaction.reply({content: `Channel is already being tracked`, ephemeral: true});
                return;
            }
            data['tracked'].push(channel.id);
        }    }else{
        data['tracked'] = channel.id;
    }
    await databaseActions.updateConfig(guildId, data);
    await interaction.reply({content: `Channel has been added to tracked channels`, ephemeral: true});
}

async function setRate(interaction) {
    const guildId = interaction.guild.id;
    const rate = interaction.options.getNumber('rate');
    await databaseActions.updateConfig(guildId, {
        rate: rate
    });
    await interaction.reply({content: `The rate has been set to ${rate}`, ephemeral: true});
}

async function setRent(interaction) {
    const guildId = interaction.guild.id;
    const rent = interaction.options.getNumber('rent');
    await databaseActions.updateConfig(guildId, {
        rent: rent
    });
    await interaction.reply({content: `The rent has been set to ${rent}`, ephemeral: true});
}

async function econ(interaction) {
    const user = interaction.options.getUser('user');
    const add = interaction.options.getBoolean('add');
    const amount = interaction.options.getNumber('amount');
    let userData = await databaseActions.getUser(user.id);
    userData = userData[0];
    if(add){
        await databaseActions.updateUser(user.id, {
            econ: userData.econ ? Number(userData.econ + amount) : Number(amount)
        })
        await interaction.reply({content: `${user.username} has been given ${amount} econ`, ephemeral: true});
    }else{
        await databaseActions.updateUser(user.id, {
            econ: userData.econ ? Number(userData.econ - amount) : 0
        })
        await interaction.reply({content: `${user.username} has been given ${amount} econ`, ephemeral: true});
    }
}