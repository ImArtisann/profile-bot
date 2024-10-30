import {Events} from "discord.js";

export const name = Events.InteractionCreate;
export const once = false;
export async function execute(interaction) {
    if (!interaction.isAutocomplete()) return;

    if (interaction.commandName === 'stats') {
        const stats = ['Warrior', 'Mage', 'Rogue', 'Priest',
            'Paladin', 'Druid', 'Shaman', 'Warlock', 'Hunter',
            'Monk'
        ];
        const focusedValue = interaction.options.getFocused();

        const filtered = stats.filter(stat =>
            stat.startsWith(focusedValue.toLowerCase())
        );

        await interaction.respond(
            filtered.map(stat => ({ name: stat, value: stat }))
        );
    }
}