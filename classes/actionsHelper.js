import { roomsActions } from '../actions/rooms.js';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    UserSelectMenuBuilder,
} from 'discord.js';

class ActionHelper {
    constructor() {}

    /**
     * Creates a set of action components (buttons and menus) for a room in a Discord guild.
     *
     * @param {Object} guild - The Discord guild the room belongs to.
     * @param {string} roomId - The ID of the room.
     * @returns {Array<import(discord.js).ActionRowBuilder>} An array of action row builders containing the created components.
     */
    async createRoomActions(guild, roomId) {
        const room = await roomsActions.getRoom(guild.id, roomId);

        const depositButton = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`Deposit:${roomId}`).setLabel('Deposit').setStyle(ButtonStyle.Primary)
        );

        const inviteMenu = new ActionRowBuilder().addComponents(
            new UserSelectMenuBuilder()
                .setCustomId(`Invite:${roomId}`)
                .setPlaceholder('Select a member')
                .setMinValues(1)
        );

        const kickMenu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(`Kick:${roomId}`)
                .setPlaceholder('Select a member to kick')
                .addOptions(
                    room.members.map(userId => ({
                        label: guild.members.cache.get(userId).user.username,
                        value: userId,
                    }))
                )
        );
        return [depositButton, inviteMenu, kickMenu];
    }
}

export const actionHelper = new ActionHelper();
