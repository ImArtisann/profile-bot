import {SlashCommandBuilder} from "discord.js";
import {databaseActions} from "../../database/mongodb.js";


export const data = new SlashCommandBuilder()
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
            .addUserOption(option =>
                option
                    .setName('members')
                    .setDescription('The members you want to add to the VC')
                    .setRequired(false)
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
    )


export async function execute(interaction) {
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

async function rentRoom(interaction){
    const guildId = interaction.guild.id;
    const serverConfig = (await databaseActions.getConfig(guildId))[0];
    const user = interaction.user.id;
    const getUser = (await databaseActions.getUser(user))[0];

    if(!getUser || !getUser.econ){
        await interaction.reply({content: 'You do not have an economy profile yet', ephemeral: true});
        return;
    }

    if(getUser.econ < serverConfig.rent){
        await interaction.reply({content: 'You do not have enough penta coins to rent a room', ephemeral: true});
    }else{
        await interaction.reply({content: 'You have rented a room', ephemeral: true});
    }
}

async function deposit(interaction){

}

async function invite(interaction){

}

async function kick(interaction){

}

async function status(interaction){

}