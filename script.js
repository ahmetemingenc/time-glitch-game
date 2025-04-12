// Oyun durumu
const gameState = {
    isPlaying: false,
    level: 1,
    lives: 1,
    player: {
        x: 50,
        y: 300,
        width: 30,
        height: 50,
        speed: 5,
        jumpForce: 15,
        velocityX: 0,
        velocityY: 0,
        isJumping: false,
        isCrouching: false
    },
    platforms: [],
    mysteryBoxes: [],
    gravity: 0.8,
    friction: 0.8,
    time: {
        current: 20, // Başlangıç süresi
        levelDurations: [20, 30, 40, 50, 60], // Her seviye için süreler
        timeSpeed: 1, // Zaman akış hızı (1=normal, <1=yavaş, >1=hızlı)
        lastTimeUpdate: 0,
        paused: false
    },
    keyEvents: {
        active: false,
        frequency: 5, // Saniye başına kaç kez
        keysToPress: 1, // Basılması gereken tuş sayısı
        timeToPress: 3, // Basma süresi (saniye)
        successRate: 0, // Başarı oranı
        totalEvents: 0,
        correctResponses: 0,
        timeLeft: 0,
        currentKeys: [],
        expectedKeys: []
    },
    controls: {
        left: false,
        right: false,
        up: false,
        down: false
    }
};

// DOM Elementleri
const gameContainer = document.getElementById('game-container');
const player = document.getElementById('player');
const levelDisplay = document.getElementById('level-display');
const timerDisplay = document.getElementById('timer-display');
const livesDisplay = document.getElementById('lives-display');
const keyEvent = document.getElementById('key-event');
const keysContainer = document.getElementById('keys-container');
const progressBar = document.getElementById('progress');
const gameOver = document.getElementById('game-over');
const levelComplete = document.getElementById('level-complete');
const finalScore = document.getElementById('final-score');
const levelStats = document.getElementById('level-stats');
const restartButton = document.getElementById('restart-button');
const nextLevelButton = document.getElementById('next-level-button');

// Oyun başlatma
function initGame() {
    resetGameState();
    createLevel(gameState.level);
    gameState.isPlaying = true;
    gameState.time.lastTimeUpdate = Date.now();
    requestAnimationFrame(gameLoop);
}

// Oyun durumunu sıfırlama
function resetGameState() {
    gameState.player.x = 50;
    gameState.player.y = 300;
    gameState.player.velocityX = 0;
    gameState.player.velocityY = 0;
    gameState.player.isJumping = false;
    gameState.player.isCrouching = false;
    gameState.platforms = [];
    gameState.mysteryBoxes = [];
    gameState.time.current = gameState.time.levelDurations[gameState.level - 1] || 60;
    gameState.time.timeSpeed = 1;
    gameState.time.paused = false;
    gameState.keyEvents.active = false;
    gameState.keyEvents.successRate = 0;
    gameState.keyEvents.totalEvents = 0;
    gameState.keyEvents.correctResponses = 0;
    gameState.controls.left = false;
    gameState.controls.right = false;
    gameState.controls.up = false;
    gameState.controls.down = false;

    // DOM güncellemeleri
    levelDisplay.textContent = `Seviye: ${gameState.level}`;
    timerDisplay.textContent = `Süre: ${gameState.time.current.toFixed(1)}`;
    livesDisplay.textContent = `Can: ${gameState.lives}`;
    gameOver.style.display = 'none';
    levelComplete.style.display = 'none';
    keyEvent.style.display = 'none';

    // Oyun alanındaki platformları temizle
    document.querySelectorAll('.platform, .mystery-box').forEach(el => el.remove());
}

// Seviye oluşturma
function createLevel(level) {
    // Oyun zorluğunu ayarla
    gameState.keyEvents.frequency = 5 + level;
    gameState.keyEvents.keysToPress = Math.min(1 + Math.floor(level / 2), 4);
    gameState.keyEvents.timeToPress = Math.max(3 - (level * 0.3), 1);

    // Zemin platformu
    createPlatform(0, 450, 800, 50);

    // Seviyeye göre platformlar
    switch(level) {
        case 1:
            createPlatform(200, 350, 100, 20);
            createPlatform(400, 280, 100, 20);
            createPlatform(600, 200, 100, 20);
            createMysteryBox(250, 320);
            break;
        case 2:
            createPlatform(150, 380, 100, 20);
            createPlatform(300, 320, 100, 20);
            createPlatform(450, 260, 100, 20);
            createPlatform(600, 200, 100, 20);
            createMysteryBox(350, 290);
            createMysteryBox(650, 170);
            break;
        case 3:
            createPlatform(120, 380, 80, 20);
            createPlatform(280, 330, 80, 20);
            createPlatform(440, 280, 80, 20);
            createPlatform(600, 230, 80, 20);
            createPlatform(400, 180, 80, 20);
            createPlatform(240, 130, 80, 20);
            createMysteryBox(290, 300);
            createMysteryBox(610, 200);
            createMysteryBox(250, 100);
            break;
        case 4:
            createPlatform(100, 380, 70, 20);
            createPlatform(240, 340, 70, 20);
            createPlatform(380, 300, 70, 20);
            createPlatform(520, 260, 70, 20);
            createPlatform(660, 220, 70, 20);
            createPlatform(520, 180, 70, 20);
            createPlatform(380, 140, 70, 20);
            createPlatform(240, 100, 70, 20);
            createMysteryBox(135, 350);
            createMysteryBox(415, 270);
            createMysteryBox(695, 190);
            createMysteryBox(275, 70);
            break;
        default:
            // Seviye 5 ve sonrası için daha karmaşık platformlar
            const platformCount = 10 + level;
            for (let i = 0; i < platformCount; i++) {
                const x = Math.random() * 700;
                const y = 100 + Math.random() * 300;
                const width = 50 + Math.random() * 100;
                createPlatform(x, y, width, 20);

                // %30 ihtimalle mystery box ekle
                if (Math.random() < 0.3) {
                    createMysteryBox(x + width / 2 - 15, y - 30);
                }
            }
            break;
    }
}

// Platform oluşturma
function createPlatform(x, y, width, height) {
    const platform = document.createElement('div');
    platform.className = 'platform';
    platform.style.left = `${x}px`;
    platform.style.top = `${y}px`;
    platform.style.width = `${width}px`;
    platform.style.height = `${height}px`;
    gameContainer.appendChild(platform);

    gameState.platforms.push({
        x, y, width, height
    });
}

// Mystery box oluşturma
function createMysteryBox(x, y) {
    const box = document.createElement('div');
    box.className = 'mystery-box';
    box.style.left = `${x}px`;
    box.style.top = `${y}px`;
    box.textContent = '?';
    gameContainer.appendChild(box);

    gameState.mysteryBoxes.push({
        x, y, width: 30, height: 30, active: true
    });
}

// Oyun döngüsü
function gameLoop() {
    if (!gameState.isPlaying) return;

    // Oyuncu hareketi
    movePlayer();

    // Çarpışma kontrolü
    checkCollisions();

    // Zaman kontrolü
    updateTime();

    // Oyuncu pozisyonunu güncelle
    updatePlayerPosition();

    // Seviye tamamlama kontrolü
    checkLevelCompletion();

    // Zaman durma olayları
    checkTimeEvents();

    requestAnimationFrame(gameLoop);
}

// Oyuncu hareketi
function movePlayer() {
    // Yerçekimi
    gameState.player.velocityY += gameState.gravity;

    // Sürtünme
    gameState.player.velocityX *= gameState.friction;

    // Tuş kontrollerine göre hareket
    if (gameState.controls.left) {
        gameState.player.velocityX = -gameState.player.speed;
    }
    if (gameState.controls.right) {
        gameState.player.velocityX = gameState.player.speed;
    }
    if (gameState.controls.up && !gameState.player.isJumping) {
        gameState.player.velocityY = -gameState.player.jumpForce;
        gameState.player.isJumping = true;
    }
    if (gameState.controls.down && !gameState.player.isCrouching) {
        gameState.player.isCrouching = true;
        gameState.player.height = 25; // Eğilme yüksekliği
        player.style.height = `${gameState.player.height}px`;
        player.style.top = `${gameState.player.y + 25}px`; // Eğilirken pozisyonu ayarla
    } else if (!gameState.controls.down && gameState.player.isCrouching) {
        gameState.player.isCrouching = false;
        gameState.player.height = 50; // Normal yükseklik
        player.style.height = `${gameState.player.height}px`;
    }
}

// Çarpışma kontrolü
function checkCollisions() {
    // Platform çarpışmaları
    let onGround = false;
    gameState.platforms.forEach(platform => {
        // Yere düşme kontrolü
        if (gameState.player.velocityY > 0 &&
            gameState.player.x + gameState.player.width > platform.x &&
            gameState.player.x < platform.x + platform.width &&
            gameState.player.y + gameState.player.height >= platform.y &&
            gameState.player.y + gameState.player.height <= platform.y + 10) {

            gameState.player.y = platform.y - gameState.player.height;
            gameState.player.velocityY = 0;
            gameState.player.isJumping = false;
            onGround = true;
        }

        // Yatay çarpışma kontrolü
        if (gameState.player.x + gameState.player.width > platform.x &&
            gameState.player.x < platform.x + platform.width &&
            gameState.player.y + gameState.player.height > platform.y &&
            gameState.player.y < platform.y + platform.height) {

            // Soldan çarpışma
            if (gameState.player.velocityX > 0 &&
                gameState.player.x + gameState.player.width <= platform.x + 10) {
                gameState.player.x = platform.x - gameState.player.width;
                gameState.player.velocityX = 0;
            }
            // Sağdan çarpışma
            else if (gameState.player.velocityX < 0 &&
                gameState.player.x >= platform.x + platform.width - 10) {
                gameState.player.x = platform.x + platform.width;
                gameState.player.velocityX = 0;
            }
        }
    });

    if (!onGround) {
        gameState.player.isJumping = true;
    }

    // Mystery box çarpışmaları
    for (let i = gameState.mysteryBoxes.length - 1; i >= 0; i--) {
        const box = gameState.mysteryBoxes[i];
        if (box.active &&
            gameState.player.x + gameState.player.width > box.x &&
            gameState.player.x < box.x + box.width &&
            gameState.player.y + gameState.player.height > box.y &&
            gameState.player.y < box.y + box.height) {

            activateMysteryBox(i);
        }
    }

    // Oyun alanı sınırları
    if (gameState.player.x < 0) {
        gameState.player.x = 0;
        gameState.player.velocityX = 0;
    }
    if (gameState.player.x + gameState.player.width > gameContainer.offsetWidth) {
        gameState.player.x = gameContainer.offsetWidth - gameState.player.width;
        gameState.player.velocityX = 0;
    }
    if (gameState.player.y < 0) {
        gameState.player.y = 0;
        gameState.player.velocityY = 0;
    }
    if (gameState.player.y + gameState.player.height > gameContainer.offsetHeight) {
        gameState.player.y = gameContainer.offsetHeight - gameState.player.height;
        gameState.player.velocityY = 0;
        gameState.player.isJumping = false;
    }
}

// Mystery box aktivasyonu
function activateMysteryBox(index) {
    const box = gameState.mysteryBoxes[index];
    if (!box.active) return;

    // Box'u deaktive et
    box.active = false;
    document.querySelectorAll('.mystery-box')[index].style.opacity = "0.3";

    // Rastgele efekt
    const effect = Math.random();
    if (effect < 0.5) {
        // Zaman hızlandır
        gameState.time.timeSpeed = 2;
        player.classList.add('time-fast');
        setTimeout(() => {
            gameState.time.timeSpeed = 1;
            player.classList.remove('time-fast');
        }, 5000);
    } else {
        // Zaman yavaşlat
        gameState.time.timeSpeed = 0.5;
        player.classList.add('time-slow');
        setTimeout(() => {
            gameState.time.timeSpeed = 1;
            player.classList.remove('time-slow');
        }, 5000);
    }
}

// Zaman güncelleme
function updateTime() {
    if (gameState.time.paused) return;

    const now = Date.now();
    const delta = (now - gameState.time.lastTimeUpdate) / 1000; // Saniye olarak geçen süre
    gameState.time.lastTimeUpdate = now;

    // Zamanı güncelle
    gameState.time.current -= delta * gameState.time.timeSpeed;
    timerDisplay.textContent = `Süre: ${Math.max(0, gameState.time.current).toFixed(1)}`;

    // Süre bitti mi kontrolü
    if (gameState.time.current <= 0) {
        loseGame();
    }
}

// Oyuncu pozisyonunu güncelleme
function updatePlayerPosition() {
    gameState.player.x += gameState.player.velocityX;
    gameState.player.y += gameState.player.velocityY;

    player.style.left = `${gameState.player.x}px`;
    player.style.top = `${gameState.player.y}px`;
}

// Seviye tamamlama kontrolü
function checkLevelCompletion() {
    // Oyuncu sağ tarafa ulaştığında seviye tamamlanır
    if (gameState.player.x > gameContainer.offsetWidth - 100) {
        completeLevel();
    }
}

// Zaman durma olayları kontrolü
function checkTimeEvents() {
    if (gameState.keyEvents.active || gameState.time.paused) return;

    // Belirli bir olasılıkla zaman durma olayı başlat
    const eventProbability = gameState.keyEvents.frequency * (1/60); // 60fps'de olasılık
    if (Math.random() < eventProbability) {
        startTimeEvent();
    }
}

// Zaman durma olayı başlat
function startTimeEvent() {
    gameState.time.paused = true;
    gameState.keyEvents.active = true;
    gameState.keyEvents.timeLeft = gameState.keyEvents.timeToPress;
    gameState.keyEvents.totalEvents++;

    // Rastgele tuşlar oluştur
    generateRandomKeys();

    // Arayüzü göster
    keyEvent.style.display = 'block';
    progressBar.style.width = '100%';

    // Zamanlayıcı başlat
    const timerInterval = 50; // ms
    const timerStep = timerInterval / 1000;
    const timeEventInterval = setInterval(() => {
        gameState.keyEvents.timeLeft -= timerStep;
        const progressWidth = (gameState.keyEvents.timeLeft / gameState.keyEvents.timeToPress) * 100;
        progressBar.style.width = `${Math.max(0, progressWidth)}%`;

        if (gameState.keyEvents.timeLeft <= 0) {
            clearInterval(timeEventInterval);
            failTimeEvent();
        }
    }, timerInterval);

    // Olay nesnesini hatırla
    gameState.keyEvents.intervalId = timeEventInterval;
}

// Rastgele tuşlar oluştur
function generateRandomKeys() {
    keysContainer.innerHTML = '';
    gameState.keyEvents.currentKeys = [];
    gameState.keyEvents.expectedKeys = [];

    const possibleKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

    for (let i = 0; i < gameState.keyEvents.keysToPress; i++) {
        const randomKey = possibleKeys[Math.floor(Math.random() * possibleKeys.length)];
        gameState.keyEvents.expectedKeys.push(randomKey);

        // Tuş gösterimi oluştur
        const keyElement = document.createElement('div');
        keyElement.classList.add('key');

        let keySymbol = '';
        switch(randomKey) {
            case 'ArrowUp': keySymbol = '↑'; break;
            case 'ArrowDown': keySymbol = '↓'; break;
            case 'ArrowLeft': keySymbol = '←'; break;
            case 'ArrowRight': keySymbol = '→'; break;
        }

        keyElement.textContent = keySymbol;
        keysContainer.appendChild(keyElement);
    }
}

// Zaman olayı başarısız
function failTimeEvent() {
    clearInterval(gameState.keyEvents.intervalId);
    gameState.keyEvents.active = false;
    keyEvent.style.display = 'none';

    // Tuş sayısına göre sonuç belirle
    const successRate = gameState.keyEvents.currentKeys.length / gameState.keyEvents.expectedKeys.length;

    if (successRate === 0) {
        // Hiç tuşa basmadıysa oyunu kaybetsin
        loseGame();
    } else if (successRate < 1) {
        // Kısmen başarılıysa zamanda geriye gitsin
        gameContainer.classList.add('glitch');
        setTimeout(() => {
            gameContainer.classList.remove('glitch');
            gameState.time.current -= 5; // 5 saniye ceza
            resumeGame();
        }, 500);
    } else {
        // Tüm tuşlara doğru bastıysa normal devam etsin
        resumeGame();
    }
}

// Oyunu kaybetme
function loseGame() {
    gameState.isPlaying = false;

    if (gameState.lives > 1) {
        // Can var ise bir can azalt ve oyuna devam et
        gameState.lives--;
        livesDisplay.textContent = `Can: ${gameState.lives}`;
        resumeGame();
        gameState.isPlaying = true;
    } else {
        // Can yoksa oyun biter
        finalScore.textContent = `Ulaşılan Seviye: ${gameState.level}`;
        gameOver.style.display = 'flex';
    }
}

// Tuşa basma işlemi
function handleKeyPress(key) {
    if (!gameState.keyEvents.active) return;

    const expectedKeyIndex = gameState.keyEvents.currentKeys.length;
    const expectedKey = gameState.keyEvents.expectedKeys[expectedKeyIndex];

    if (key === expectedKey) {
        // Doğru tuş
        gameState.keyEvents.currentKeys.push(key);
        keysContainer.children[expectedKeyIndex].style.backgroundColor = 'green';

        // Tüm tuşlara basıldı mı kontrol et
        if (gameState.keyEvents.currentKeys.length === gameState.keyEvents.expectedKeys.length) {
            clearInterval(gameState.keyEvents.intervalId);
            gameState.keyEvents.correctResponses++;

            // %100 başarı oranı yakaladı mı kontrol et
            if (gameState.keyEvents.correctResponses === gameState.keyEvents.totalEvents) {
                gameState.lives++;
                livesDisplay.textContent = `Can: ${gameState.lives}`;
            }

            setTimeout(() => {
                gameState.keyEvents.active = false;
                keyEvent.style.display = 'none';
                resumeGame();
            }, 300);
        }
    } else {
        // Yanlış tuş
        clearInterval(gameState.keyEvents.intervalId);
        keysContainer.children[expectedKeyIndex].style.backgroundColor = 'red';

        setTimeout(() => {
            gameState.keyEvents.active = false;
            keyEvent.style.display = 'none';
            failTimeEvent();
        }, 300);
    }
}

// Oyunu devam ettir
function resumeGame() {
    gameState.time.paused = false;
    gameState.time.lastTimeUpdate = Date.now();
}

// Seviye tamamlama
function completeLevel() {
    gameState.isPlaying = false;

    // Başarı oranını hesapla
    const successRate = gameState.keyEvents.correctResponses / Math.max(1, gameState.keyEvents.totalEvents);
    const successPercentage = Math.round(successRate * 100);

    // Level tamamlandı mesajı
    levelStats.textContent = `Kalan Süre: ${gameState.time.current.toFixed(1)} saniye
                              Başarı Oranı: %${successPercentage}`;
    levelComplete.style.display = 'flex';
}

// Sonraki seviyeye geçme
function nextLevel() {
    gameState.level++;
    resetGameState();
    createLevel(gameState.level);
    gameState.isPlaying = true;
    gameState.time.lastTimeUpdate = Date.now();
}

// Olayları dinle
document.addEventListener('keydown', (e) => {
    if (gameState.keyEvents.active) {
        handleKeyPress(e.key);
        return;
    }

    switch(e.key) {
        case 'ArrowLeft':
            gameState.controls.left = true;
            break;
        case 'ArrowRight':
            gameState.controls.right = true;
            break;
        case 'ArrowUp':
            gameState.controls.up = true;
            break;
        case 'ArrowDown':
            gameState.controls.down = true;
            break;
    }
});

document.addEventListener('keyup', (e) => {
    switch(e.key) {
        case 'ArrowLeft':
            gameState.controls.left = false;
            break;
        case 'ArrowRight':
            gameState.controls.right = false;
            break;
        case 'ArrowUp':
            gameState.controls.up = false;
            break;
        case 'ArrowDown':
            gameState.controls.down = false;
            break;
    }
});

restartButton.addEventListener('click', () => {
    gameState.level = 1;
    gameState.lives = 1;
    initGame();
});

nextLevelButton.addEventListener('click', () => {
    nextLevel();
});

// Oyunu başlat
window.addEventListener('load', () => {
    initGame();
});