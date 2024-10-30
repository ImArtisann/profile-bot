import {AttachmentBuilder, SlashCommandBuilder} from 'discord.js';
import {databaseActions} from "../../database/mongodb.js";
import path from "node:path";
import fs from "node:fs";
import Canvas, {GlobalFonts, loadImage} from "@napi-rs/canvas";
import {dirname} from "path";
import {fileURLToPath, pathToFileURL} from "url";
import puppeteer from "puppeteer";


const __dirname = dirname(fileURLToPath(import.meta.url));
const foldersPath = path.join(__dirname, '../../images');

const cachedCharts = new Map();

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
    const option = interaction.options.getUser('user');
    const user = option ? option : interaction.user;
    const gamiffynia = interaction.member.roles.cache.has('1252432519824019579');
    const profile = await databaseActions.getUser(user.id);
    const data = profile[0];
    const image = await createImage(user, data, gamiffynia);
    await interaction.deferReply();
    await interaction.editReply({files: [image]});
}

const variables = {
    width: 520,
    height: 40,
    progress: 0,
    backgroundColor: '#DDFFFF',
    fillColor: '#50C878',
    borderRadius: 10,
    startHP: 920,
    startMana: 920,
    endHP: 960,
    endMana: 1050,
    nameFont: '80px Montserrat-ExtraBold',
    statsFont: '30px Montserrat-ExtraBold',
    playerFont: '50px Montserrat-ExtraBold',
    textColor: '#DDFFFF',
}


async function createImage(user, data, gamiffynia){
    GlobalFonts.registerFromPath('images/fonts/Montserrat-ExtraBold.ttf', 'Montserrat-ExtraBold');
    const canvas = Canvas.createCanvas(2352, 1338);
    const context = canvas.getContext('2d');
    const filepath = path.join(foldersPath, gamiffynia ? 'gamiffynia.png' : 'gamifier.png');

    //load background image
    const background = await Canvas.loadImage(filepath);
    const avatarUrl = user.avatarURL({extension: 'png', size: 512});
    const avatar = await Canvas.loadImage(encodeURI(avatarUrl));

    //draw avatar
    context.drawImage(background, 0, 0, canvas.width, canvas.height);
    context.drawImage(avatar, 120, 580, 610, 610);


    /**
     * Renders the player's username on the profile image.
     *
     * This function is responsible for drawing the player's username on the profile image canvas. It uses the `variables`
     * object to determine the font style and color to use for the text.
     */
    const createNameText = () => {
        const name = user.displayName;
        context.font = variables.nameFont;
        context.fillStyle = variables.textColor;
        context.fillText(name, 520, 530);
    }

    /**
     * Renders the player's stats on the profile image.
     *
     * This function is responsible for drawing the player's HP, mood, focus, and motivation on the profile image canvas.
     * It uses the `variables` object to determine the font style and color to use for the text.
     */
    const createStatsText = () => {
        context.font = variables.statsFont;
        context.fillStyle = variables.textColor;
        context.fillText('HP: ' + (data?.hp || 4), 800, 630);
        context.fillText('Mood: ' + (data?.mood || 4), 800, 675);
        context.fillText('Focus: ' + (data?.focus || 4), 985, 630);
        context.fillText('Motivation: ' + (data?.motivation || 4), 985, 675);
    }

    /**
     * Renders the player's level and class on the profile image.
     *
     * This function is responsible for drawing the player's level and class on the profile image canvas. It uses the `variables`
     * object to determine the font style and color to use for the text.
     */
    const createPlayerText = () => {
        context.font = variables.playerFont;
        context.fillStyle = variables.textColor;
        context.fillText('Level: ' + (data?.level || 1), 800, 790);
        context.fillText('Class: ' + (data?.class || 'Set With /stats'), 800, 855);
    }

    /**
     * Renders the player's health bar on the profile image.
     *
     * This function is responsible for drawing the player's health bar on the profile image canvas. It uses the `variables`
     * object to determine the position, size, and appearance of the health bar.
     */
    const drawHealthBar = () => {
        try {
            context.font = variables.statsFont;
            context.fillStyle = variables.textColor;
            context.fillText('HP: ', 795, 985);
            context.beginPath()
            context.fillStyle = variables.backgroundColor;
            context.roundRect(variables.startHP, variables.endHP, variables.width, variables.height, variables.borderRadius);
            context.fill();
            const hpFillWidth = (((data?.hp || 4) * 10) / 100) * variables.width;
            if (hpFillWidth > 0) {
                context.beginPath();
                context.fillStyle = variables.fillColor;
                if (hpFillWidth < variables.width) {
                    context.roundRect(variables.startHP, variables.endHP, hpFillWidth, variables.height, [10, 0, 0, 10]);
                } else {
                    context.roundRect(variables.startHP, variables.endHP, hpFillWidth, variables.height, 10);
                }
                context.fill();
            }
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
            context.font = variables.statsFont;
            context.fillStyle = variables.textColor;
            context.fillText('Mana: ', 795, 1085);
            context.beginPath()
            context.fillStyle = variables.backgroundColor;
            context.roundRect(variables.startMana, variables.endMana, variables.width, variables.height, variables.borderRadius);
            context.fill();
            const manaFillWidth = (((data?.mana || 4) * 10) / 100) * variables.width;
            if (manaFillWidth > 0) {
                context.beginPath();
                context.fillStyle = variables.fillColor;
                if (manaFillWidth < variables.width) {
                    context.roundRect(variables.startMana, variables.endMana, manaFillWidth, variables.height, [10, 0, 0, 10]);
                } else {
                    context.roundRect(variables.startMana, variables.endMana, manaFillWidth, variables.height, 10);
                }
                context.fill();
            }
        }catch (e) {
            console.error('Error drawing mana bar')
        }
    }

    /**
     * Fetches and renders the user's chart on the profile image.
     *
     * This function checks if the user's chart is cached and up-to-date. If the chart is cached and up-to-date, it draws the
     * cached chart on the profile image. If the chart is not cached or is out-of-date, it fetches the chart from the provided
     * URL, saves a screenshot, and draws the chart on the profile image. The function also updates the cache with the current
     * timestamp.
     *
     * @async
     * @function addChart
     * @throws {Error} If there is an error fetching or rendering the chart.
     */
    const addChart = async () => {
        try {
            if (cachedCharts.has(user.id)) {
                let date = cachedCharts.get(user.id);
                if (dataChecker(date)) {
                    await getChart();
                    context.drawImage(await loadImage(`./${user.id}.png`), 1565, 475, 725, 725);
                    cachedCharts.set(user.id, new Date().toLocaleString('en-US', {timeZone: 'America/New_York'}));
                } else {
                    context.drawImage(await loadImage(`./${user.id}.png`), 1565, 475, 725, 725);
                }
            } else {
                if (String(data?.chart).includes("datajumbo") && !(String(data?.chart).includes("edit"))) {
                    await getChart();
                    context.drawImage(await loadImage(`./${user.id}.png`), 1565, 475, 725, 725);
                    cachedCharts.set(user.id, new Date().toLocaleString('en-US', {timeZone: 'America/New_York'}));
                }
            }
        }catch (e) {
            console.error('Error adding chart')
        }
    }

    /**
     * Checks if the cached chart data is up-to-date compared to the latest data timestamp.
     *
     * Thois function compares the cached chart data timestamp to the latest data timestamp. If the latest data timestamp is
     * newer than the cached timestamp, the function returns `true`, indicating that the cached data is out-f-date and needs
     * to be refreshed. If the latest data timestamp is older than or equal to the cached timestamp, the function returns
     * `false`, indicating that the cached data is up-to-date.
     *
     * If the latest data timestamp is not available, the function checks if the cached chart file exists. If the file does
     * not exist, the function returns `true`, indicating that the cached data needs to be refreshed.
     *
     * @param {string} date - The timestamp of the cached chart data.
     * @returns {boolean} `true` if the cached data is out-of-date, `false` if the cached data is up-to-date.
     */
    const dataChecker = (date) => {
        if(!data?.timestamp){
            try {
                fs.accessSync(`./${user.id}.png`);
                return false;
            } catch (err) {
                return true;
            }
        }

        const mongo = new Date(data?.timestamp);
        const timestamp = new Date(date);

        return mongo > timestamp;
    }

    /**
     * Fetches and saves a screenshot of the user's chart from the provided URL.
     *
     * This function is used to retrieve the user's chart data and save a screenshot of it to the local file system.
     * It uses Puppeteer to launch a headless browser, navigate to the chart URL, wait for the page to load, and then take a screenshot.
     * The screenshot is saved with the user's ID as the file name.
     *
     * @async
     * @function getChart
     * @throws {Error} If there is an error fetching or saving the chart screenshot.
     */
    const getChart = async () => {
        try {
            const browser = await puppeteer.launch({
                headless: true,
                defaultViewport: null,
                args: ["--start-maximized"],
            });
            const page = await browser.newPage();
            await page.goto(data?.chart);
            await page.waitForNetworkIdle();
            await page.screenshot({path: `${user.id}.png`});
            await browser.close();
        }catch (e) {
            console.error('Error fetching the user chart')
        }
    }

    const addTimeStamp = () => {
        context.font = variables.statsFont;
        context.fillStyle = variables.textColor;
        context.fillText((data?.timestamp || "Set stats to get a time stamp"), 795, 1150);
    }

    createNameText();
    createStatsText();
    createPlayerText();
    drawHealthBar();
    drawManaBar();
    await addChart();
    addTimeStamp();
    const buffer = await canvas.toBuffer('image/png');
    return new AttachmentBuilder(buffer, {name: 'profile.png'});
}