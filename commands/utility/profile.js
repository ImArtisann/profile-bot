import {AttachmentBuilder, SlashCommandBuilder} from 'discord.js';
import {databaseActions} from "../../database/mongodb.js";
import path from "node:path";
import Canvas, {GlobalFonts, loadImage} from "@napi-rs/canvas";
import {dirname} from "path";
import {fileURLToPath, pathToFileURL} from "url";


const __dirname = dirname(fileURLToPath(import.meta.url));
const foldersPath = path.join(__dirname, '../../images');

export const data = new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Replies with profile!')
    .addUserOption(option =>
        option.setName('user')
            .setDescription('The user whose profile you want to see')
            .setRequired(false)
    );


/**
 * Executes the 'profile' slash command, generating and sending a profile image for the specified user.
 *
 * @param {Interaction} interaction - The Discord interaction object that triggered the command.
 * @returns {Promise<void>} - A promise that resolves when the profile image has been sent.
 */
export async function execute(interaction) {
    const targetUser = interaction.options.getUser('user');
    const user = targetUser ? targetUser : interaction.user;
    const profile = await databaseActions.getUser(user.id);
    const targetMember = interaction.options.getMember('user');
    const member = targetMember ? targetMember : interaction.member;

    const data = profile[0];
    const image = await createImage(user, data, member);
    await interaction.deferReply();
    await interaction.editReply({files: [image]});
}

const variables = {
    width: 236,
    height: 14,
    borderHeight: 16,
    progress: 0,
    fillColor: '#659DCC',
    borderRadius: 10,
    startHP: 448,
    endHP: 389,
    startMood: 448,
    endMood: 437,
    startFocus: 448,
    endFocus: 486,
    startMana: 448,
    endMana: 535,
    nameFont: '60px Rustic',
    levelFont: '22px Artegra',
    timeFont: '14px Rustic',
    nameColor: '#DDFFFF',
    levelColor: '#1F3C68'
}


export async function createImage(user, data, member) {
    GlobalFonts.registerFromPath('images/fonts/Rustic-Printed-Regular.ttf', 'Rustic');
    GlobalFonts.registerFromPath('images/fonts/Artegra-sans-extrabold.otf', 'Artegra');
    const canvas = Canvas.createCanvas(1050, 600);
    const context = canvas.getContext('2d');
    const filepath = path.join(foldersPath, 'Player_card_1.png');

    //load background image
    const background = await Canvas.loadImage(filepath);
    const avatarUrl = user.avatarURL({extension: 'png', size: 512});
    const avatar = await Canvas.loadImage(encodeURI(avatarUrl));

    //draw avatar
    context.drawImage(background, 0, 0, canvas.width, canvas.height);
    context.save();
    context.beginPath();
    context.roundRect(74, 224, 240, 242, 8);
    context.closePath();
    context.clip();
    context.drawImage(avatar, 74, 224, 240, 242);
    context.restore();
    /**
     * Renders the player's username on the profile image.
     *
     * This function is responsible for drawing the player's username on the profile image canvas. It uses the `variables`
     * object to determine the font style and color to use for the text.
     */
    const createNameText = () => {
        let name = member.nickname || member.user.displayName;
        context.font = variables.nameFont;
        context.fillStyle = variables.nameColor;
        name = name.charAt(0).toUpperCase() + name.slice(1);
        context.fillText(name, 360, 270);
    }

    /**
     * Renders the player's health bar on the profile image.
     *
     * This function is responsible for drawing the player's health bar on the profile image canvas. It uses the `variables`
     * object to determine the position, size, and appearance of the health bar.
     */
    const drawHealthBar = () => {
        try {
            let strokeWidth = 3;
            const hpFillWidth = (((data?.hp || 4) * 10) / 100) * variables.width;

            // Draw the filled portion
            if (hpFillWidth > 0) {
                context.beginPath();
                context.fillStyle = variables.fillColor;
                context.rect(variables.startHP, variables.endHP, hpFillWidth, variables.height);
                context.fill();
            }

            // Draw outer box
            context.beginPath();
            context.rect(variables.startHP, variables.endHP, variables.width, variables.borderHeight);
            context.strokeStyle = variables.fillColor;
            context.lineWidth = strokeWidth;
            context.stroke();

            // Draw inner box
            context.strokeStyle = '#DFFAFF';
            strokeWidth = 2;
            context.beginPath();
            context.rect(
                variables.startHP + strokeWidth/2,
                variables.endHP + strokeWidth/2,
                variables.width - strokeWidth,
                variables.borderHeight - strokeWidth
            );
            context.stroke();
        } catch (e) {
            console.error('Error drawing health bar')
        }
    }

    /**
     * Renders the player's mood bar on the profile image.
     *
     * This function is responsible for drawing the player's mood bar on the profile image canvas. It uses the `variables`
     * object to determine the position, size, and appearance of the mood bar.
     */
    const drawMoodBar = () => {
        try {
            let strokeWidth = 3;
            const moodFillWidth = (((data?.mood || 4) * 10) / 100) * variables.width;

            // Draw the filled portion
            if (moodFillWidth > 0) {
                context.beginPath();
                context.fillStyle = variables.fillColor;
                context.rect(variables.startMood, variables.endMood, moodFillWidth, variables.height);
                context.fill();
            }

            // Draw outer box
            context.beginPath();
            context.rect(variables.startMood, variables.endMood, variables.width, variables.borderHeight);
            context.strokeStyle = variables.fillColor;
            context.lineWidth = strokeWidth;
            context.stroke();

            // Draw inner box
            context.strokeStyle = '#DFFAFF';
            strokeWidth = 2;
            context.beginPath();
            context.rect(
                variables.startMood + strokeWidth/2,
                variables.endMood + strokeWidth/2,
                variables.width - strokeWidth,
                variables.borderHeight - strokeWidth
            );
            context.stroke();
        }catch (e) {
            console.error('Error drawing health bar')
        }
    }

    /**
     * Renders the player's focus bar on the profile image.
     *
     * This function is responsible for drawing the player's focus bar on the profile image canvas. It uses the `variables`
     * object to determine the position, size, and appearance of the focus bar.
     */
    const drawFocusBar = () => {
        try {
            let strokeWidth = 3;
            const focusFillWidth = (((data?.focus || 4) * 10) / 100) * variables.width;

            // Draw the filled portion
            if (focusFillWidth > 0) {
                context.beginPath();
                context.fillStyle = variables.fillColor;
                context.rect(variables.startFocus, variables.endFocus, focusFillWidth, variables.height);
                context.fill();
            }

            // Draw outer box
            context.beginPath();
            context.rect(variables.startFocus, variables.endFocus, variables.width, variables.borderHeight);
            context.strokeStyle = variables.fillColor;
            context.lineWidth = strokeWidth;
            context.stroke();

            // Draw inner box
            context.strokeStyle = '#DFFAFF';
            strokeWidth = 2;
            context.beginPath();
            context.rect(
                variables.startFocus + strokeWidth/2,
                variables.endFocus + strokeWidth/2,
                variables.width - strokeWidth,
                variables.borderHeight - strokeWidth
            );
            context.stroke();
        }catch (e) {
            console.error('Error drawing health bar')
        }
    }


    /**
     * Renders the player's mana bar on the profile image.
     *
     * This function is responsible for drawing the player's mana bar on the profile image canvas. It uses the `variables`
     * object to determine the position, size, and appearance of the mana bar.
     */
    const drawManaBar = () => {
        try {
            let strokeWidth = 3;
            const manaFillWidth = (((data?.mana || 4) * 10) / 100) * variables.width;

            // Draw the filled portion
            if (manaFillWidth > 0) {
                context.beginPath();
                context.fillStyle = variables.fillColor;
                context.rect(variables.startMana, variables.endMana, manaFillWidth, variables.height);
                context.fill();
            }

            // Draw outer box
            context.beginPath();
            context.rect(variables.startMana, variables.endMana, variables.width, variables.borderHeight);
            context.strokeStyle = variables.fillColor;
            context.lineWidth = strokeWidth;
            context.stroke();

            // Draw inner box
            context.strokeStyle = '#DFFAFF';
            strokeWidth = 2;
            context.beginPath();
            context.rect(
                variables.startMana + strokeWidth/2,
                variables.endMana + strokeWidth/2,
                variables.width - strokeWidth,
                variables.borderHeight - strokeWidth
            );
            context.stroke();
        }catch (e) {
            console.error('Error drawing mana bar')
        }
    }

    const addCharacterInfo = () => {
        context.font = variables.levelFont;
        context.fillStyle = variables.levelColor;
        context.fillText(((data?.class?.toString()) || "Not Set"), 156, 557);
        context.font = variables.levelFont;
        context.fillStyle = variables.levelColor;
        context.fillText((data?.level?.toString() || "???"), 156, 523);
    }

    /**
     * Renders the timestamp on the profile image.
     *
     * This function is responsible for drawing the timestamp on the profile image canvas. It uses the `variables`
     * object to determine the font and color of the timestamp text.
     *
     * @param {Object} data - The data object containing the timestamp information.
     * @param {string} [data.timestamp] - The timestamp to be displayed on the profile image.
     */
    const addTimeStamp = () => {
        context.font = variables.timeFont;
        context.fillStyle = variables.nameColor;
        context.fillText((data?.timestamp || "Set stats to get a time stamp"), 360, 360);
    }

    createNameText();
    addCharacterInfo();
    drawHealthBar();
    drawMoodBar();
    drawFocusBar();
    drawManaBar();
    addTimeStamp();
    const buffer = await canvas.toBuffer('image/png');
    return new AttachmentBuilder(buffer, {name: 'profile.png'});
}
