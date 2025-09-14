// sounds.js

// ====== Load all sounds ======
const sounds = {
    boxFill: new Audio('assets/sounds/box_fill.mp3'),          // 3x3 box completed
    lineFill: new Audio('assets/sounds/line_fill.mp3'),        // row/column completed
    win: new Audio('assets/sounds/win.mp3'),                  // full grid completed
    hintReceived: new Audio('assets/sounds/hint_received.mp3'),// hint received
    click: new Audio('assets/sounds/click.mp3'),              // number button / new game
    gameOver: new Audio('assets/sounds/game_over.mp3'),       // game over
    wrong: new Audio('assets/sounds/wrong.mp3')               // wrong placement
};

// ====== Unlock audio on first user interaction ======
let audioUnlocked = false;
document.addEventListener('click', () => {
    if (!audioUnlocked) {
        Object.values(sounds).forEach(s => s.play().catch(()=>{}));
        Object.values(sounds).forEach(s => s.pause());
        Object.values(sounds).forEach(s => s.currentTime = 0);
        audioUnlocked = true;
    }
}, { once: true });

// ====== Play sound utility ======
function playSound(key) {
    const sound = sounds[key];
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(err => console.log(`Failed to play ${key}:`, err));
    }
}

// ====== Button-specific sound handling ======
document.addEventListener('DOMContentLoaded', () => {

    // Number buttons → click sound
    document.querySelectorAll('.number-btn').forEach(btn => {
        btn.addEventListener('click', () => playSound('click'));
    });

    // Hint button → hintReceived sound
    const hintBtn = document.getElementById('hint-btn');
    if (hintBtn) hintBtn.addEventListener('click', () => playSound('hintReceived'));

    // New game button → click sound
    const newGameBtn = document.getElementById('new-game-btn');
    if (newGameBtn) newGameBtn.addEventListener('click', () => playSound('click'));

    // Note: erase, undo, notes buttons → no sound
});

// ====== Functions to be called from game.js ======
function wrongSound() { playSound('wrong'); }
function boxFillSound() { playSound('boxFill'); }
function lineFillSound() { playSound('lineFill'); }
function winSound() { playSound('win'); }
function gameOverSound() { playSound('gameOver'); }

// Export to window for global access in game.js
window.sudokuSounds = {
    wrongSound,
    boxFillSound,
    lineFillSound,
    winSound,
    gameOverSound,
    playSound
};
