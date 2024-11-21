import {SlashCommandBuilder} from "discord.js";
import {databaseActions} from "../../database/mongodb.js";

export default {
    data: new SlashCommandBuilder()
        .setName('send')
        .setDescription('Send a user money')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('The user you want to send money to')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName('amount')
                .setDescription('The amount of money you want to send')
                .setRequired(true)
        )
    ,
    async execute(interaction) {
        const user = interaction.user.id
        const receivingUser = interaction.options.getUser('user')
        const amount = interaction.options.getInteger('amount')
        let userData = await databaseActions.getUser(user)
        userData = userData[0]

        if(user === receivingUser.id){
            await interaction.reply({content: `You cannot send money to yourself`, ephemeral: true});
            return;
        }

        if(userData.econ < amount){
            await interaction.reply({content: `You do not have enough money`, ephemeral: true});
            return;
        }else{
            if (!userData.econ) {
                await interaction.reply({content: `You do not have any money`, ephemeral: true})
                return
            }
            await databaseActions.updateUser(user, {
                econ: Number(userData.econ - amount)
            })
            let receivingUserData = await databaseActions.getUser(receivingUser.id)
            receivingUserData = receivingUserData[0]
            await databaseActions.updateUser(receivingUser.id, {
                econ: receivingUserData.econ ? Number(userData.econ + amount) : Number(amount)
            })
        }
        await interaction.reply({content: `You sent ${amount} coins to ${user.username}`, ephemeral: true});
    }
}