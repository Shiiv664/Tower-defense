import { Game } from './Game.js';

const gameContainer = document.body;
const game = new Game(gameContainer);

game.start();

console.log('Tower Defense game started!');