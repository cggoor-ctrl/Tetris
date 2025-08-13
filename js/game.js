// Tetris Neo - Main Game Logic

// Game constants
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const COLORS = [
    null,
    '#FF0D72', // I
    '#0DC2FF', // J
    '#0DFF72', // L
    '#F538FF', // O
    '#FF8E0D', // S
    '#FFE138', // T
    '#3877FF'  // Z
];

// Mobile detection
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Tetromino shapes
const SHAPES = [
    null,
    // I
    [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    // J
    [
        [2, 0, 0],
        [2, 2, 2],
        [0, 0, 0]
    ],
    // L
    [
        [0, 0, 3],
        [3, 3, 3],
        [0, 0, 0]
    ],
    // O
    [
        [4, 4],
        [4, 4]
    ],
    // S
    [
        [0, 5, 5],
        [5, 5, 0],
        [0, 0, 0]
    ],
    // T
    [
        [0, 6, 0],
        [6, 6, 6],
        [0, 0, 0]
    ],
    // Z
    [
        [7, 7, 0],
        [0, 7, 7],
        [0, 0, 0]
    ]
];

// Game variables
let canvas = document.getElementById('tetris-canvas');
let nextCanvas = document.getElementById('next-piece-canvas');
let ctx = canvas.getContext('2d');
let nextCtx = nextCanvas.getContext('2d');
let board = createMatrix(COLS, ROWS);
let score = 0;
let level = 1;
let lines = 0;
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let gameActive = true;
let currentPiece = null;
let nextPiece = null;
let particles = [];
let floatingTexts = [];

// Audio variables
let soundEnabled = true;
let backgroundAudio = new Audio('audio/background.mp3');
let moveAudio = new Audio('audio/move.mp3');
let rotateAudio = new Audio('audio/rotate.mp3');
let dropAudio = new Audio('audio/drop.mp3');
let clearAudio = new Audio('audio/clear.mp3');
let gameOverAudio = new Audio('audio/gameover.mp3');

// Set audio properties
backgroundAudio.loop = true;
backgroundAudio.volume = 0.3;

// UI elements
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const linesElement = document.getElementById('lines');
const pauseButton = document.getElementById('pause-btn');
const restartButton = document.getElementById('restart-btn');
const soundButton = document.getElementById('sound-btn');
const fullscreenButton = document.getElementById('fullscreen-btn');

// Initialize the game
function init() {
    // Adapt canvas size for mobile devices
    adaptCanvasSize();
    
    // Scale canvases
    ctx.scale(BLOCK_SIZE, BLOCK_SIZE);
    nextCtx.scale(BLOCK_SIZE, BLOCK_SIZE);
    
    // Load saved settings
    loadSettings();
    
    // Create first pieces
    currentPiece = createPiece();
    nextPiece = createPiece();
    
    // Draw initial state
    draw();
    
    // Event listeners
    document.addEventListener('keydown', handleKeyPress);
    pauseButton.addEventListener('click', togglePause);
    restartButton.addEventListener('click', restartGame);
    soundButton.addEventListener('click', toggleSound);
    
    // Fullscreen button
    if (fullscreenButton) {
        fullscreenButton.addEventListener('click', toggleFullscreen);
    }
    
    // Mobile controls
    setupMobileControls();
    
    // Initialize progress bar
    updateProgressBar();
    
    // Handle window resize and orientation change
    window.addEventListener('resize', adaptCanvasSize);
    window.addEventListener('orientationchange', () => {
        setTimeout(adaptCanvasSize, 100); // Small delay to ensure orientation change is complete
    });
    
    // Start game loop
    requestAnimationFrame(update);
}

// Adapt canvas size for mobile devices
function adaptCanvasSize() {
    const canvas = document.getElementById('tetris-canvas');
    const nextCanvas = document.getElementById('next-piece-canvas');
    
    if (isMobile) {
        // For mobile devices, adjust canvas size to fit screen
        const maxWidth = Math.min(window.innerWidth - 40, 300);
        const scale = maxWidth / 300;
        
        canvas.style.width = `${maxWidth}px`;
        canvas.style.height = `${600 * scale}px`;
        
        // Adjust next piece canvas
        const nextScale = maxWidth / 300;
        nextCanvas.style.width = `${120 * nextScale}px`;
        nextCanvas.style.height = `${120 * nextScale}px`;
    } else {
        // Reset to default size for desktop
        canvas.style.width = '300px';
        canvas.style.height = '600px';
        nextCanvas.style.width = '120px';
        nextCanvas.style.height = '120px';
    }
}

// Save settings to localStorage
function saveSettings() {
    const settings = {
        soundEnabled: soundEnabled
    };
    localStorage.setItem('tetrisSettings', JSON.stringify(settings));
}

// Load settings from localStorage
function loadSettings() {
    const settingsStr = localStorage.getItem('tetrisSettings');
    if (settingsStr) {
        try {
            const settings = JSON.parse(settingsStr);
            soundEnabled = settings.soundEnabled !== undefined ? settings.soundEnabled : false; // Отключаем звук по умолчанию
            
            // Update sound button
            const soundButton = document.getElementById('sound-btn');
            if (soundButton) {
                soundButton.textContent = soundEnabled ? 'Звук: Вкл' : 'Звук: Выкл';
            }
        } catch (e) {
            console.error('Error loading settings:', e);
        }
    } else {
        // Если настроек нет, отключаем звук по умолчанию
        soundEnabled = false;
        const soundButton = document.getElementById('sound-btn');
        if (soundButton) {
            soundButton.textContent = 'Звук: Выкл';
        }
    }
}

// Setup mobile controls
function setupMobileControls() {
    const mobileLeft = document.getElementById('mobile-left');
    const mobileRight = document.getElementById('mobile-right');
    const mobileRotate = document.getElementById('mobile-rotate');
    const mobileDrop = document.getElementById('mobile-drop');
    
    if (mobileLeft) {
        mobileLeft.addEventListener('click', () => handleMobileInput('left'));
        mobileLeft.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleMobileInput('left');
        });
    }
    
    if (mobileRight) {
        mobileRight.addEventListener('click', () => handleMobileInput('right'));
        mobileRight.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleMobileInput('right');
        });
    }
    
    if (mobileRotate) {
        mobileRotate.addEventListener('click', () => handleMobileInput('rotate'));
        mobileRotate.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleMobileInput('rotate');
        });
    }
    
    if (mobileDrop) {
        mobileDrop.addEventListener('click', () => handleMobileInput('drop'));
        mobileDrop.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleMobileInput('drop');
        });
    }
    
    // Add swipe gestures for mobile
    let touchStartX = 0;
    let touchStartY = 0;
    
    document.getElementById('tetris-canvas').addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    });
    
    document.getElementById('tetris-canvas').addEventListener('touchend', (e) => {
        if (!gameActive) return;
        
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        
        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;
        
        // Determine swipe direction
        if (Math.abs(diffX) > Math.abs(diffY)) {
            // Horizontal swipe
            if (diffX > 50) {
                // Swipe right
                handleMobileInput('right');
            } else if (diffX < -50) {
                // Swipe left
                handleMobileInput('left');
            }
        } else {
            // Vertical swipe
            if (diffY > 50) {
                // Swipe down (soft drop)
                handleMobileInput('drop');
            } else if (diffY < -50) {
                // Swipe up (rotate)
                handleMobileInput('rotate');
            }
        }
    });
}

// Handle mobile input
function handleMobileInput(action) {
    if (!gameActive) return;
    
    switch (action) {
        case 'left':
            currentPiece.pos.x--;
            if (collide()) {
                currentPiece.pos.x++;
            } else {
                playSound(moveAudio);
            }
            break;
        case 'right':
            currentPiece.pos.x++;
            if (collide()) {
                currentPiece.pos.x--;
            } else {
                playSound(moveAudio);
            }
            break;
        case 'rotate':
            rotatePiece();
            playSound(rotateAudio);
            break;
        case 'drop':
            dropPiece();
            playSound(dropAudio);
            break;
    }
}

// Create matrix for game board
function createMatrix(width, height) {
    const matrix = [];
    while (height--) {
        matrix.push(new Array(width).fill(0));
    }
    return matrix;
}

// Create a random tetromino piece
function createPiece() {
    const rand = Math.floor(Math.random() * 7) + 1;
    return {
        pos: {x: Math.floor(COLS / 2) - 1, y: 0},
        matrix: SHAPES[rand],
        type: rand
    };
}

// Particle class
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = (Math.random() - 0.5) * 3;
        this.vy = (Math.random() - 0.5) * 3 - 1; // More upward bias
        this.life = 40; // frames to live
        this.size = Math.random() * 0.4 + 0.1;
        this.gravity = 0.05;
        this.alpha = 1;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.life--;
        
        // Fade out as life decreases
        this.alpha = this.life / 40;
        
        // Slow down over time
        this.vx *= 0.98;
        this.vy *= 0.98;
    }
    
    draw(context) {
        context.save();
        context.fillStyle = this.color;
        context.globalAlpha = this.alpha;
        
        // Draw as circle for better visual effect
        context.beginPath();
        context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        context.fill();
        
        // Add glow effect
        context.shadowColor = this.color;
        context.shadowBlur = 10;
        context.fill();
        context.restore();
    }
    
    isAlive() {
        return this.life > 0;
    }
}

// Floating text class
class FloatingText {
    constructor(text, x, y, color) {
        this.text = text;
        this.x = x;
        this.y = y;
        this.color = color;
        this.vy = -0.5; // Move upward
        this.life = 60; // frames to live
        this.alpha = 1;
        this.size = 1;
    }
    
    update() {
        this.y += this.vy;
        this.life--;
        this.alpha = this.life / 60;
        this.size = 1 + (60 - this.life) / 100; // Scale up over time
    }
    
    draw(context) {
        context.save();
        context.fillStyle = this.color;
        context.globalAlpha = this.alpha;
        context.font = `${this.size}px Arial`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.shadowColor = this.color;
        context.shadowBlur = 10;
        context.fillText(this.text, this.x, this.y);
        context.restore();
    }
    
    isAlive() {
        return this.life > 0;
    }
}

// Draw everything
function draw() {
    // Clear main canvas with animated background
    const time = Date.now() / 1000;
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, `rgba(0, 20, 40, ${0.3 + Math.sin(time) * 0.1})`);
    gradient.addColorStop(1, `rgba(0, 10, 30, ${0.5 + Math.cos(time) * 0.1})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    drawGrid();
    
    // Draw board
    drawMatrix(board, {x: 0, y: 0});
    
    // Draw current piece
    if (currentPiece) {
        drawMatrix(currentPiece.matrix, currentPiece.pos);
    }
    
    // Update and draw particles
    // Limit particles to prevent performance issues
    if (particles.length > 150) {
        particles = particles.slice(-150);
    }
    
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw(ctx);
        if (!particles[i].isAlive()) {
            particles.splice(i, 1);
        }
    }
    
    // Update and draw floating texts
    // Limit floating texts to prevent performance issues
    if (floatingTexts.length > 10) {
        floatingTexts = floatingTexts.slice(-10);
    }
    
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        floatingTexts[i].update();
        floatingTexts[i].draw(ctx);
        if (!floatingTexts[i].isAlive()) {
            floatingTexts.splice(i, 1);
        }
    }
    
    // Draw next piece preview
    nextCtx.fillStyle = '#000';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    
    // Draw grid for next piece preview
    nextCtx.strokeStyle = 'rgba(0, 168, 255, 0.1)';
    nextCtx.lineWidth = 0.05;
    for (let x = 0; x <= 4; x++) {
        nextCtx.beginPath();
        nextCtx.moveTo(x, 0);
        nextCtx.lineTo(x, 4);
        nextCtx.stroke();
    }
    for (let y = 0; y <= 4; y++) {
        nextCtx.beginPath();
        nextCtx.moveTo(0, y);
        nextCtx.lineTo(4, y);
        nextCtx.stroke();
    }
    
    if (nextPiece) {
        // Center the next piece in the preview
        const offsetX = Math.floor((4 - nextPiece.matrix[0].length) / 2);
        const offsetY = Math.floor((4 - nextPiece.matrix.length) / 2);
        drawMatrix(nextPiece.matrix, {x: offsetX, y: offsetY}, nextCtx);
    }
}

// Draw grid on the game field
function drawGrid() {
    ctx.strokeStyle = 'rgba(0, 168, 255, 0.1)';
    ctx.lineWidth = 0.05;
    
    // Draw all vertical lines in one path
    ctx.beginPath();
    for (let x = 0; x <= COLS; x++) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, ROWS);
    }
    ctx.stroke();
    
    // Draw all horizontal lines in one path
    ctx.beginPath();
    for (let y = 0; y <= ROWS; y++) {
        ctx.moveTo(0, y);
        ctx.lineTo(COLS, y);
    }
    ctx.stroke();
}

// Draw a matrix (piece or board)
function drawMatrix(matrix, offset, context = ctx) {
    // Batch shadow settings to reduce context changes
    context.shadowBlur = 3; // Уменьшено на 80% с 15 до 3
    
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                const posX = x + offset.x;
                const posY = y + offset.y;
                
                // Create gradient for pieces
                const gradient = context.createRadialGradient(
                    posX + 0.5, posY + 0.5, 0,
                    posX + 0.5, posY + 0.5, 0.8
                );
                gradient.addColorStop(0, lightenColor(COLORS[value], 20));
                gradient.addColorStop(0.5, COLORS[value]);
                gradient.addColorStop(1, darkenColor(COLORS[value], 40));
                
                // Draw main piece with glow
                context.shadowColor = COLORS[value];
                context.fillStyle = gradient;
                context.fillRect(posX, posY, 1, 1);
                
                // Add inner highlight
                const innerGradient = context.createRadialGradient(
                    posX + 0.3, posY + 0.3, 0,
                    posX + 0.3, posY + 0.3, 0.4
                );
                innerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
                innerGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                context.fillStyle = innerGradient;
                context.fillRect(posX, posY, 1, 1);
                
                // Add 3D effect
                context.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                context.lineWidth = 0.05;
                context.strokeRect(posX + 0.05, posY + 0.05, 0.9, 0.9);
                
                // Add bevel effect
                context.strokeStyle = 'rgba(0, 0, 0, 0.3)';
                context.lineWidth = 0.05;
                context.beginPath();
                context.moveTo(posX, posY);
                context.lineTo(posX + 1, posY);
                context.lineTo(posX + 1, posY + 1);
                context.stroke();
            }
        });
    });
    
    // Reset shadow
    context.shadowBlur = 0;
}

// Game loop
function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;
    
    if (gameActive) {
        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            dropPiece();
        }
        
        draw();
    }
    
    requestAnimationFrame(update);
}

// Move piece down
function dropPiece() {
    currentPiece.pos.y++;
    if (collide()) {
        currentPiece.pos.y--;
        merge();
        clearLines();
        resetPiece();
    }
    dropCounter = 0;
}

// Check for collisions
function collide() {
    const [m, o] = [currentPiece.matrix, currentPiece.pos];
    for (let y = 0; y < m.length; y++) {
        for (let x = 0; x < m[y].length; x++) {
            if (m[y][x] !== 0 &&
                (board[y + o.y] &&
                board[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

// Merge piece with board
function merge() {
    currentPiece.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                board[y + currentPiece.pos.y][x + currentPiece.pos.x] = value;
            }
        });
    });
}

// Clear completed lines
function clearLines() {
    let linesCleared = 0;
    const linesToClear = [];
    let prevScore = score;
    let prevLines = lines;
    let prevLevel = level;
    
    outer: for (let y = board.length - 1; y >= 0; y--) {
        for (let x = 0; x < board[y].length; x++) {
            if (board[y][x] === 0) {
                continue outer;
            }
        }
        
        // Mark line for clearing
        linesToClear.push(y);
        linesCleared++;
    }
    
    if (linesCleared > 0) {
        // Animate line clearing
        animateLineClear(linesToClear, () => {
            // Remove the lines after animation
            linesToClear.forEach(lineY => {
                const row = board.splice(lineY, 1)[0].fill(0);
                board.unshift(row);
            });
            
            // Update score
            const points = [0, 100, 300, 500, 800];
            score += points[linesCleared] * level;
            lines += linesCleared;
            level = Math.floor(lines / 10) + 1;
            
            // Update UI with animations
            updateUIWithAnimation(prevScore, prevLines, prevLevel);
            
            // Increase speed
            dropInterval = 1000 - (level - 1) * 100;
            if (dropInterval < 100) dropInterval = 100;
            
            // Create special effects based on lines cleared
            createSpecialEffects(linesCleared);
        });
    }
}

// Update UI with animation effects
function updateUIWithAnimation(prevScore, prevLines, prevLevel) {
    // Update score with animation
    if (score > prevScore) {
        scoreElement.textContent = `Счет: ${score}`;
        scoreElement.classList.add('value-change');
        setTimeout(() => {
            scoreElement.classList.remove('value-change');
        }, 500);
    }
    
    // Update lines with animation
    if (lines > prevLines) {
        linesElement.textContent = `Линии: ${lines}`;
        linesElement.classList.add('value-change');
        setTimeout(() => {
            linesElement.classList.remove('value-change');
        }, 500);
    }
    
    // Update level with animation
    if (level > prevLevel) {
        levelElement.textContent = `Уровень: ${level}`;
        levelElement.classList.add('value-change');
        setTimeout(() => {
            levelElement.classList.remove('value-change');
        }, 500);
    }
    
    // Update progress bar
    updateProgressBar();
}

// Update progress bar to next level
function updateProgressBar() {
    const linesToNext = 10 - (lines % 10);
    const progressPercent = ((10 - linesToNext) / 10) * 100;
    
    const progressFill = document.getElementById('progress-fill');
    const linesToNextElement = document.getElementById('lines-to-next');
    
    if (progressFill) {
        progressFill.style.width = `${progressPercent}%`;
    }
    
    if (linesToNextElement) {
        linesToNextElement.textContent = `${linesToNext} линий`;
    }
}

// Create special effects based on number of lines cleared
function createSpecialEffects(linesCleared) {
    const centerX = COLS / 2;
    const centerY = ROWS / 3; // Position higher on the screen
    
    // Play sound effect
    playSound(clearAudio);
    
    switch (linesCleared) {
        case 2: // Double line
            // Create "DOUBLE!" text effect
            createFloatingText("DOUBLE!", centerX, centerY, "#0DC2FF");
            break;
        case 3: // Triple line
            // Create "TRIPLE!" text effect
            createFloatingText("TRIPLE!", centerX, centerY, "#F538FF");
            break;
        case 4: // Tetris
            // Create "TETRIS!" text effect
            createFloatingText("TETRIS!", centerX, centerY, "#FF0D72");
            // Add extra particles for celebration (with limit)
            for (let i = 0; i < 50 && particles.length < 100; i++) {
                particles.push(new Particle(
                    Math.random() * COLS,
                    Math.random() * ROWS,
                    getRandomColor()
                ));
            }
            break;
    }
}

// Create floating text effect
function createFloatingText(text, x, y, color) {
    floatingTexts.push(new FloatingText(text, x, y, color));
}

// Get random tetromino color
function getRandomColor() {
    const colors = ['#FF0D72', '#0DC2FF', '#0DFF72', '#F538FF', '#FF8E0D', '#FFE138', '#3877FF'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Animate line clearing effect
function animateLineClear(lines, callback) {
    // Create enhanced flash effect
    lines.forEach(y => {
        // Create horizontal flash line
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(0, y, COLS, 1);
        
        // Create particles for each block in the line
        for (let x = 0; x < board[y].length; x++) {
            if (board[y][x] !== 0) {
                // Create multiple particles of different sizes
                const color = COLORS[board[y][x]];
                for (let i = 0; i < 8; i++) {
                    // Limit total particles to prevent performance issues
                    if (particles.length < 100) {
                        particles.push(new Particle(x + Math.random(), y + Math.random(), color));
                    }
                }
            }
        }
    });
    
    // Add screen flash effect for tetris (4 lines)
    if (lines.length === 4) {
        // Create full screen flash
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillRect(0, 0, COLS, ROWS);
        
        // Add "TETRIS!" text effect
        ctx.fillStyle = '#FF0D72';
        ctx.font = '1.5px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#FF0D72';
        ctx.shadowBlur = 10;
        ctx.fillText('TETRIS!', COLS/2, ROWS/2);
        ctx.shadowBlur = 0;
    }
    
    // Call callback after a short delay
    setTimeout(callback, 150);
}

// Reset current piece and get next
function resetPiece() {
    currentPiece = nextPiece;
    nextPiece = createPiece();
    
    // Create spawn effect
    createSpawnEffect(currentPiece);
    
    // Check for game over
    if (collide()) {
        gameOver();
    }
}

// Create spawn effect for new pieces
function createSpawnEffect(piece) {
    const color = COLORS[piece.type];
    for (let y = 0; y < piece.matrix.length; y++) {
        for (let x = 0; x < piece.matrix[y].length; x++) {
            if (piece.matrix[y][x] !== 0) {
                // Create particles at spawn position
                for (let i = 0; i < 3; i++) {
                    // Limit total particles to prevent performance issues
                    if (particles.length < 100) {
                        particles.push(new Particle(
                            piece.pos.x + x + Math.random(), 
                            piece.pos.y + y + Math.random(), 
                            color
                        ));
                    }
                }
            }
        }
    }
}

// Game over
function gameOver() {
    gameActive = false;
    
    // Play game over sound
    playSound(gameOverAudio);
    
    // Create game over overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#fff';
    ctx.font = '1px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('ИГРА ОКОНЧЕНА', COLS/2, ROWS/2 - 1);
    
    ctx.font = '0.5px Arial';
    ctx.fillText(`Счет: ${score}`, COLS/2, ROWS/2);
    ctx.fillText('Нажмите "Рестарт" для новой игры', COLS/2, ROWS/2 + 1);
    
    // Also show alert for better user experience
    setTimeout(() => {
        alert(`Игра окончена! Ваш счет: ${score}`);
    }, 100);
}

// Handle keyboard input
function handleKeyPress(event) {
    if (!gameActive) return;
    
    switch (event.keyCode) {
        case 37: // Left arrow
            currentPiece.pos.x--;
            if (collide()) {
                currentPiece.pos.x++;
            } else {
                playSound(moveAudio);
            }
            break;
        case 39: // Right arrow
            currentPiece.pos.x++;
            if (collide()) {
                currentPiece.pos.x--;
            } else {
                playSound(moveAudio);
            }
            break;
        case 40: // Down arrow
            dropPiece();
            playSound(dropAudio);
            break;
        case 38: // Up arrow
            rotatePiece();
            playSound(rotateAudio);
            break;
        case 32: // Space
            hardDrop();
            playSound(dropAudio);
            break;
    }
}

// Rotate piece
function rotatePiece() {
    const pos = currentPiece.pos.x;
    let offset = 1;
    rotate(currentPiece.matrix);
    while (collide()) {
        currentPiece.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > currentPiece.matrix[0].length) {
            rotate(currentPiece.matrix);
            currentPiece.pos.x = pos;
            return;
        }
    }
}

// Matrix rotation
function rotate(matrix) {
    for (let y = 0; y < matrix.length; y++) {
        for (let x = 0; x < y; x++) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }
    matrix.forEach(row => row.reverse());
}

// Hard drop (instant drop)
function hardDrop() {
    while (!collide()) {
        currentPiece.pos.y++;
    }
    currentPiece.pos.y--;
}

// Toggle pause
function togglePause() {
    gameActive = !gameActive;
    pauseButton.textContent = gameActive ? 'Пауза' : 'Продолжить';
    
    // Control background music during pause
    if (gameActive && soundEnabled) {
        backgroundAudio.play().catch(e => console.log("Audio play error:", e));
    } else {
        backgroundAudio.pause();
    }
}

// Restart game
function restartGame() {
    // Reset game state
    board = createMatrix(COLS, ROWS);
    score = 0;
    level = 1;
    lines = 0;
    dropInterval = 1000;
    gameActive = true;
    particles = []; // Clear particles
    floatingTexts = []; // Clear floating texts
    
    // Update UI
    scoreElement.textContent = `Счет: ${score}`;
    levelElement.textContent = `Уровень: ${level}`;
    linesElement.textContent = `Линии: ${lines}`;
    pauseButton.textContent = 'Пауза';
    
    // Reset pieces
    currentPiece = createPiece();
    nextPiece = createPiece();
    
    // Update progress bar
    updateProgressBar();
    
    // Play background music if sound is enabled
    if (soundEnabled) {
        backgroundAudio.currentTime = 0;
        backgroundAudio.play().catch(e => console.log("Audio play error:", e));
    }
}

// Toggle sound
function toggleSound() {
    soundEnabled = !soundEnabled;
    soundButton.textContent = soundEnabled ? 'Звук: Вкл' : 'Звук: Выкл';
    
    // Control background music
    if (soundEnabled) {
        backgroundAudio.play().catch(e => console.log("Audio play error:", e));
    } else {
        backgroundAudio.pause();
    }
    
    // Save settings
    saveSettings();
}

// Toggle fullscreen mode
function toggleFullscreen() {
    const elem = document.documentElement;
    
    if (!document.fullscreenElement) {
        // Enter fullscreen
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.mozRequestFullScreen) { // Firefox
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) { // Chrome, Safari and Opera
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) { // IE/Edge
            elem.msRequestFullscreen();
        }
        
        if (fullscreenButton) {
            fullscreenButton.textContent = 'Обычный экран';
        }
    } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) { // Firefox
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) { // Chrome, Safari and Opera
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { // IE/Edge
            document.msExitFullscreen();
        }
        
        if (fullscreenButton) {
            fullscreenButton.textContent = 'Полный экран';
        }
    }
}

// Play sound effect
function playSound(sound) {
    if (soundEnabled) {
        // Create a new audio instance to allow overlapping sounds
        const soundEffect = sound.cloneNode();
        soundEffect.volume = sound.volume;
        soundEffect.play().catch(e => {
            // Не выводим ошибки в консоль, чтобы не засорять её
            // console.log("Sound effect error:", e);
        });
    }
}

// Helper function to darken colors
function darkenColor(color, percent) {
    // Remove # if present
    color = color.replace('#', '');
    
    // Parse RGB values
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);
    
    // Darken each component
    const newR = Math.max(0, r - (r * percent / 100));
    const newG = Math.max(0, g - (g * percent / 100));
    const newB = Math.max(0, b - (b * percent / 100));
    
    // Convert back to hex
    return `#${Math.round(newR).toString(16).padStart(2, '0')}${Math.round(newG).toString(16).padStart(2, '0')}${Math.round(newB).toString(16).padStart(2, '0')}`;
}

// Helper function to lighten colors
function lightenColor(color, percent) {
    // Remove # if present
    color = color.replace('#', '');
    
    // Parse RGB values
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);
    
    // Lighten each component
    const newR = Math.min(255, r + ((255 - r) * percent / 100));
    const newG = Math.min(255, g + ((255 - g) * percent / 100));
    const newB = Math.min(255, b + ((255 - b) * percent / 100));
    
    // Convert back to hex
    return `#${Math.round(newR).toString(16).padStart(2, '0')}${Math.round(newG).toString(16).padStart(2, '0')}${Math.round(newB).toString(16).padStart(2, '0')}`;
}

// Prevent zoom on double tap and pinch gestures on mobile
function preventZoom(e) {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Add touch event listeners to prevent zoom
    document.addEventListener('touchstart', preventZoom, { passive: false });
    document.addEventListener('touchmove', preventZoom, { passive: false });
    
    // Initialize the game
    init();
});