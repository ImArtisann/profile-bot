import Canvas, { GlobalFonts, loadImage } from '@napi-rs/canvas';
import path from 'node:path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'node:fs';
import { AttachmentBuilder } from 'discord.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const foldersPath = path.join(__dirname, '../../images');

class UserClass {
    constructor() {
        this.client = null;
        this.variables = {
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
            levelColor: '#1F3C68',
        };
    }

    async initialize(client) {
        this.client = client;
    }

    /**
     * Send the specified amount of econ from the user's account to the recipient's account.
     * @param {string} guildId - The ID of the guild the user and recipient belong to.
     * @param {string} userId - The ID of the user sending the econ.
     * @param {string} recipientId - The ID of the recipient receiving the econ.
     * @param {number} amount - The amount of econ to send.
     * @returns {Promise<boolean>} - True if the econ was successfully sent, false if the user does not have enough econ.
     */
    async sendEcon(guildId, userId, recipientId, amount) {
        const userEcon = await this.getUserEcon(guildId, userId);
        if (userEcon < amount) {
            return false;
        } else {
            await this.updateUserEcon(guildId, userId, userEcon - amount);
            await this.updateUserEcon(
                guildId,
                recipientId,
                Number((await this.getUserEcon(guildId, recipientId)) + amount)
            );
            return true;
        }
    }

    /**
     * Get the user profile data for creating the image
     * @param guildId
     * @param userId
     * @returns {Promise<{
     * badges: ([]|any),
     * econ: (number),
     * mood: (number),
     * mana: (number),
     * level: (string),
     * timezone: (string),
     * hp: (number),
     * focus: (number),
     * class: (string)}>}
     */
    async getUserProfile(guildId, userId) {
        const data = JSON.parse(await this.client.hget(`${guildId}:users`, userId));
        return {
            hp: data.hp,
            mood: data.mood,
            focus: data.focus,
            mana: data.mana,
            level: data.level,
            class: data.class,
            timezone: data.timezone,
            badges: data.badges,
            econ: data.econ,
        };
    }

    /**
     * Creates a profile picture for a user.
     *
     * This function is responsible for generating a profile picture image for a user. It uses the Canvas library to draw the
     * user's avatar, name, and various character stats on the image. The function takes in the guild ID, user object, member
     * object, and an optional test flag. It returns either a file path (if testing) or an AttachmentBuilder object (for
     * production use).
     *
     * @param {string} guildId - The ID of the guild the user is in.
     * @param {object} user - The user object for the user whose profile picture is being created.
     * @param {object} member - The member object for the user whose profile picture is being created.
     * @param {boolean} [test=false] - Whether this is a test run or not.
     * @returns {Promise<string|AttachmentBuilder>} - The file path (if testing) or an AttachmentBuilder object (for production use).
     */
    async createProfilePic(guildId, user, member, test = false) {
        const data = this.getUserProfile(guildId, user.id);
        GlobalFonts.registerFromPath('images/fonts/Rustic-Printed-Regular.ttf', 'Rustic');
        GlobalFonts.registerFromPath('images/fonts/Artegra-sans-extrabold.otf', 'Artegra');
        const canvas = Canvas.createCanvas(1050, 600);
        const context = canvas.getContext('2d');
        const filepath = path.join(foldersPath, 'Player_card_1.png');
        //load background image
        const background = await Canvas.loadImage(filepath);
        const avatarUrl = test ? '' : user.avatarURL({ extension: 'png', size: 512 });
        const avatar = test
            ? await Canvas.loadImage(path.join(foldersPath, 'test-profile.png'))
            : await Canvas.loadImage(encodeURI(avatarUrl));
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
            let name = test ? user : member.nickname || member.user.displayName;
            // When we are testing edits
            context.font = this.variables.nameFont;
            context.fillStyle = this.variables.nameColor;
            name = name.charAt(0).toUpperCase() + name.slice(1);
            context.fillText(name, 360, 270);
        };

        /**
         * Renders the player's health bar on the profile image.
         *
         * This function is responsible for drawing the player's health bar on the profile image canvas. It uses the `variables`
         * object to determine the position, size, and appearance of the health bar.
         */
        const drawHealthBar = () => {
            try {
                let strokeWidth = 3;
                const hpFillWidth = (((data?.hp || 4) * 10) / 100) * this.variables.width;

                // Draw the filled portion
                if (hpFillWidth > 0) {
                    context.beginPath();
                    context.fillStyle = this.variables.fillColor;
                    context.rect(this.variables.startHP, this.variables.endHP, hpFillWidth, this.variables.height);
                    context.fill();
                }

                // Draw outer box
                context.beginPath();
                context.rect(
                    this.variables.startHP,
                    this.variables.endHP,
                    this.variables.width,
                    this.variables.borderHeight
                );
                context.strokeStyle = this.variables.fillColor;
                context.lineWidth = strokeWidth;
                context.stroke();

                // Draw inner box
                context.strokeStyle = '#DFFAFF';
                strokeWidth = 2;
                context.beginPath();
                context.rect(
                    this.variables.startHP + strokeWidth / 2,
                    this.variables.endHP + strokeWidth / 2,
                    this.variables.width - strokeWidth,
                    this.variables.borderHeight - strokeWidth
                );
                context.stroke();
            } catch (e) {
                console.error('Error drawing health bar');
            }
        };

        /**
         * Renders the player's mood bar on the profile image.
         *
         * This function is responsible for drawing the player's mood bar on the profile image canvas. It uses the `variables`
         * object to determine the position, size, and appearance of the mood bar.
         */
        const drawMoodBar = () => {
            try {
                let strokeWidth = 3;
                const moodFillWidth = (((data?.mood || 4) * 10) / 100) * this.variables.width;

                // Draw the filled portion
                if (moodFillWidth > 0) {
                    context.beginPath();
                    context.fillStyle = this.variables.fillColor;
                    context.rect(
                        this.variables.startMood,
                        this.variables.endMood,
                        moodFillWidth,
                        this.variables.height
                    );
                    context.fill();
                }

                // Draw outer box
                context.beginPath();
                context.rect(
                    this.variables.startMood,
                    this.variables.endMood,
                    this.variables.width,
                    this.variables.borderHeight
                );
                context.strokeStyle = this.variables.fillColor;
                context.lineWidth = strokeWidth;
                context.stroke();

                // Draw inner box
                context.strokeStyle = '#DFFAFF';
                strokeWidth = 2;
                context.beginPath();
                context.rect(
                    this.variables.startMood + strokeWidth / 2,
                    this.variables.endMood + strokeWidth / 2,
                    this.variables.width - strokeWidth,
                    this.variables.borderHeight - strokeWidth
                );
                context.stroke();
            } catch (e) {
                console.error('Error drawing health bar');
            }
        };

        /**
         * Renders the player's focus bar on the profile image.
         *
         * This function is responsible for drawing the player's focus bar on the profile image canvas. It uses the `variables`
         * object to determine the position, size, and appearance of the focus bar.
         */
        const drawFocusBar = () => {
            try {
                let strokeWidth = 3;
                const focusFillWidth = (((data?.focus || 4) * 10) / 100) * this.variables.width;

                // Draw the filled portion
                if (focusFillWidth > 0) {
                    context.beginPath();
                    context.fillStyle = this.variables.fillColor;
                    context.rect(
                        this.variables.startFocus,
                        this.variables.endFocus,
                        focusFillWidth,
                        this.variables.height
                    );
                    context.fill();
                }

                // Draw outer box
                context.beginPath();
                context.rect(
                    this.variables.startFocus,
                    this.variables.endFocus,
                    this.variables.width,
                    this.variables.borderHeight
                );
                context.strokeStyle = this.variables.fillColor;
                context.lineWidth = strokeWidth;
                context.stroke();

                // Draw inner box
                context.strokeStyle = '#DFFAFF';
                strokeWidth = 2;
                context.beginPath();
                context.rect(
                    this.variables.startFocus + strokeWidth / 2,
                    this.variables.endFocus + strokeWidth / 2,
                    this.variables.width - strokeWidth,
                    this.variables.borderHeight - strokeWidth
                );
                context.stroke();
            } catch (e) {
                console.error('Error drawing health bar');
            }
        };

        /**
         * Renders the player's mana bar on the profile image.
         *
         * This function is responsible for drawing the player's mana bar on the profile image canvas. It uses the `variables`
         * object to determine the position, size, and appearance of the mana bar.
         */
        const drawManaBar = () => {
            try {
                let strokeWidth = 3;
                const manaFillWidth = (((data?.mana || 4) * 10) / 100) * this.variables.width;

                // Draw the filled portion
                if (manaFillWidth > 0) {
                    context.beginPath();
                    context.fillStyle = this.variables.fillColor;
                    context.rect(
                        this.variables.startMana,
                        this.variables.endMana,
                        manaFillWidth,
                        this.variables.height
                    );
                    context.fill();
                }

                // Draw outer box
                context.beginPath();
                context.rect(
                    this.variables.startMana,
                    this.variables.endMana,
                    this.variables.width,
                    this.variables.borderHeight
                );
                context.strokeStyle = this.variables.fillColor;
                context.lineWidth = strokeWidth;
                context.stroke();

                // Draw inner box
                context.strokeStyle = '#DFFAFF';
                strokeWidth = 2;
                context.beginPath();
                context.rect(
                    this.variables.startMana + strokeWidth / 2,
                    this.variables.endMana + strokeWidth / 2,
                    this.variables.width - strokeWidth,
                    this.variables.borderHeight - strokeWidth
                );
                context.stroke();
            } catch (e) {
                console.error('Error drawing mana bar');
            }
        };

        const addCharacterInfo = () => {
            context.font = this.variables.levelFont;
            context.fillStyle = this.variables.levelColor;
            context.fillText(data?.class?.toString() || 'Not Set', 156, 557);
            context.font = this.variables.levelFont;
            context.fillStyle = this.variables.levelColor;
            context.fillText(data?.level?.toString() || '???', 156, 523);
        };

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
            context.font = this.variables.timeFont;
            context.fillStyle = this.variables.nameColor;
            context.fillText(data?.timestamp || 'Set stats to get a time stamp', 360, 360);
        };

        const addRaidEmblems = async () => {
            let raids = fs.readdirSync(path.join(foldersPath, 'raids')).map(file => file.replace('.png', ''));
            let x = 0;
            let y = 0;
            for (let i = 0; i < raids.length; i++) {
                if (data[raids[i]]) {
                    context.drawImage(
                        await loadImage(path.join(foldersPath, `raids/${raids[i]}.png`)),
                        945 - x * 80,
                        50 + y * 80,
                        80,
                        80
                    );
                    x++;
                    if (x >= 3) {
                        x = 0;
                        y++;
                    }
                }
            }
        };

        createNameText();
        addCharacterInfo();
        drawHealthBar();
        drawMoodBar();
        drawFocusBar();
        drawManaBar();
        addTimeStamp();
        await addRaidEmblems();
        const buffer = await canvas.toBuffer('image/png');
        return test
            ? await fs.writeFileSync('profile.png', buffer)
            : new AttachmentBuilder(buffer, { name: 'profile.png' });
    }

    /**
     * Set the user's main quest in the guild.
     * @param {String} guildId - The ID of the guild.
     * @param {String} userId - The ID of the user.
     * @param {Object} quest - The quest object to set as the user's main quest.
     * @returns {Promise<void>}
     */
    async setUserQuest(guildId, userId, quest) {
        const data = JSON.parse(await this.client.hget(`${guildId}:users`, userId));
        data.mainQuest = quest;
        await this.client.hset(`${guildId}:users`, userId, JSON.stringify(data));
    }

    async getUserQuest(guildId, userId) {
        const data = JSON.parse(await this.client.hget(`${guildId}:users`, userId));
        return data.mainQuest;
    }

    /**
     * Get the users econ in the guild
     * @param {String} guildId - guild id
     * @param {String} userId - user id
     * @returns {Promise<number>}
     */
    async getUserEcon(guildId, userId) {
        const data = JSON.parse(await this.client.hget(`${guildId}:users`, userId));
        return data.econ;
    }

    /**
     * Get the users private vc they own
     * @param {String} guildId - guild id
     * @param {String} userId - user id
     * @returns {Promise<[]>}
     */
    async getUserPrivateChannels(guildId, userId) {
        const data = JSON.parse(await this.client.hget(`${guildId}:users`, userId));
        return data.privateChannels;
    }

    /**
     * Get the time the user joined the voice channel.
     * @param {String} guildId - The ID of the guild.
     * @param {String} userId - The ID of the user.
     * @returns {Promise<String>} - The time the user joined the voice channel.
     */
    async getUserVCJoined(guildId, userId) {
        const data = JSON.parse(await this.client.hget(`${guildId}:users`, userId));
        return data.vcJoined;
    }

    /**
     * Get the users vc hours
     * @param {String} guildId - guild id
     * @param {String} userId - user id
     * @returns {Promise<number>} - The number of hours the user has spent in voice channels
     */
    async getUserHoursVC(guildId, userId) {
        const data = JSON.parse(await this.client.hget(`${guildId}:users`, userId));
        return data.hoursVC;
    }

    /**
     * Increment the users message count
     * @param {String} guildId - guild id
     * @param {String} userId - user id
     * @returns {Promise<void>}
     */
    async incrementUserMessageCount(guildId, userId) {
        let userData = JSON.parse(await this.client.hget(`${guildId}:users`, userId));
        userData.messages++;
        await this.client.hset(`${guildId}:users`, userId, JSON.stringify(userData));
    }

    /**
     * Update the users profile data
     * @param {String} guildId - guild id
     * @param {String} userId - user id
     * @param {Array} data - data to update
     * @param {number} [data.hp] - health
     * @param {number} [data.mood] - mood
     * @param {number} [data.focus] - focus
     * @param {number} [data.mana] - mana
     * @param {number} [data.level] - level
     * @param {String} [data.class] - class
     * @param {String} [data.timezone] - user timezone
     * @param {Object} [data.mainQuest] - main quest
     * @param {String} [data.vcJoined] - time user joined vc
     * @param {Array} [data.badges] - user badges earned
     * @param {number} [data.econ] - user econ
     * @returns {Promise<void>}
     */
    async updateUserProfile(guildId, userId, data) {
        let userData = JSON.parse(await this.client.hget(`${guildId}:users`, userId));
        for (const key in data) {
            userData[key] = data[key];
        }
        await this.client.hset(`${guildId}:users`, userId, JSON.stringify(userData));
    }

    /**
     * Update the users vc hours
     * @param {String} guildId - guild id
     * @param {String} userId - user id
     * @param {number} hours - amount of hours to add
     * @returns {Promise<void>}
     */
    async updateUserVCHours(guildId, userId, hours) {
        let userData = JSON.parse(await this.client.hget(`${guildId}:users`, userId));
        userData.hoursVC += hours;
        await this.client.hset(`${guildId}:users`, userId, JSON.stringify(userData));
    }

    /**
     * Update a users econ either add or remove econ
     * @param {String} guildId - guild id
     * @param {String} userId - user id
     * @param {number} econ - amount of econ to add or remove
     * @param {Boolean} add - default is true
     * @returns {Promise<void>}
     */
    async updateUserEcon(guildId, userId, econ, add = true) {
        let data = JSON.parse(await this.client.hget(`${guildId}:users`, userId));
        data.econ = add ? data.econ + econ : data.econ - econ;
        await this.client.hset(`${guildId}:users`, userId, JSON.stringify(data));
    }

    /**
     * Update the user's badges in the guild
     * @param {String} guildId - The ID of the guild
     * @param {String} userId - The ID of the user
     * @param {Array} badges - The badges to add or remove
     * @param {Boolean} [add=true] - Whether to add or remove the badges
     * @returns {Promise<void>}
     */
    async updateUserBadges(guildId, userId, badges, add = true) {
        let data = JSON.parse(await this.client.hget(`${guildId}:users`, userId));
        add ? data.badges.push(...badges) : (data.badges = data.badges.filter(badge => !badges.includes(badge)));
        await this.client.hset(`${guildId}:users`, userId, JSON.stringify(data));
    }

    async updateUserPrivateChannels(guildId, userId, privateChannel) {
        let data = JSON.parse(await this.client.hget(`${guildId}:users`, userId));
        data.privateChannels.push(privateChannel);
        await this.client.hset(`${guildId}:users`, userId, JSON.stringify(data));
    }
}

export const userActions = new UserClass();
