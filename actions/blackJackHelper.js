import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'node:path';
import fs from 'fs';
import Canvas from '@napi-rs/canvas';

const __dirname = dirname(fileURLToPath(import.meta.url));
const foldersPath = path.join(__dirname, '../../images');

class BlackJackHelper {
    constructor() {
        this.table = path.join(foldersPath, '/blackjack_table/blackjack_table.png');
        this.cards = [...fs.readdirSync(path.join(foldersPath, '/playing_cards'))];
        this.decks = 4;
    }

    async startGame() {
        let gameDeck = [];
        for (let i = 0; i < this.cards.length; i++) {
            for (let j = 0; j < this.decks; j++) {
                gameDeck.push(this.cards[i]);
            }
        }
        gameDeck = this.shuffleDeck(gameDeck);
        return gameDeck;
    }

    async makeStartingImage(deck) {
        const image = await Canvas.loadImage(this.table);
        const canvas = Canvas.createCanvas(image.width, image.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);
        for (let i = 0; i < deck.length; i++) {
            const card = await Canvas.loadImage(path.join(foldersPath, '/playing_cards', deck[i]));
            ctx.drawImage(card, 0, 0, 100, 140, 100 + i * 100, 100, 100, 140);
        }
        return canvas.toBuffer();
    }

    async makeHitImage(deck, hand) {
        const image = await Canvas.loadImage(this.table);
        const canvas = Canvas.createCanvas(image.width, image.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);
        for (let i = 0; i < deck.length; i++) {
            const card = await Canvas.loadImage(path.join(foldersPath, '/playing_cards', deck[i]));
            ctx.drawImage(card, 0, 0, 100, 140, 100 + i * 100, 100, 100, 140);
        }
        for (let i = 0; i < hand.length; i++) {
            const card = await Canvas.loadImage(path.join(foldersPath, '/playing_cards', hand[i]));
            ctx.drawImage(card, 0, 0, 100, 140, 100 + i * 100, 100, 100, 140);
        }
        return canvas.toBuffer();
    }

    async shuffleDeck(deck) {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    }

    dealCard(deck) {
        return deck.pop();
    }

    getCardValue(card) {
        const cardValue = card.split('_')[0];
        if (cardValue === 'ace') return 11;
        if (cardValue === 'jack' || cardValue === 'queen' || cardValue === 'king') return 10;
        return parseInt(cardValue);
    }

    getHandValue(hand) {
        let value = 0;
        for (let i = 0; i < hand.length; i++) {
            value += this.getCardValue(hand[i]);
        }
        return value;
    }

    checkForAce(hand) {
        for (let i = 0; i < hand.length; i++) {
            if (hand[i].split('_')[0] === 'ace') return true;
        }
        return false;
    }

    checkForBust(hand) {
        return this.getHandValue(hand) > 21;
    }

    checkForBlackJack(hand) {
        return this.getHandValue(hand) === 21 && hand.length === 2;
    }

    checkForSplit(hand) {
        return hand.length === 2 && hand[0].split('_')[0] === hand[1].split('_')[0];
    }

    checkForNaturalBlackJack(hand) {
        return this.getHandValue(hand) === 21 && hand.length === 2;
    }
}

export const blackJack = new BlackJackHelper();
