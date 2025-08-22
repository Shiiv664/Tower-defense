import { Game } from './Game.js';

async function startGame() {
  const gameContainer = document.body;
  const game = new Game(gameContainer);
  
  try {
    await game.initialize();
    game.start();
    console.log('Tower Defense game started!');
  } catch (error) {
    console.error('Failed to initialize game:', error);
    // Show user-friendly error message
    document.body.innerHTML = `
      <div style="color: red; padding: 20px; font-family: monospace;">
        <h2>Failed to load game configuration</h2>
        <p>Error: ${error instanceof Error ? error.message : String(error)}</p>
        <p>Please check the browser console for more details.</p>
      </div>
    `;
  }
}

startGame();