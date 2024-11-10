import { createImage } from '../commands/utility/profile.js';

const testData = {
    class: 'Mage',
    level: 10,
    timestamp: '12/12/2023',
    health: 10,
    mood: 10,
    focus: 10,
    mana: 10,
    abyssal: true,
    wendigo: true,
}

async function runTest() {
    await createImage('Artisann', testData, null, true);
}

runTest();
