const $ = id => document.getElementById(id);
const player = $("player"), world = $("world"), game = $("game");
const arrowPrompt = $("arrowPrompt"), timeDisplay = $("timeLeft");
const livesDisplay = $("livesCount"), levelDisplay = $("levelNum");
const overlay = $("messageOverlay"), messageText = $("messageText");
const restartBtn = $("restartBtn"), keyBar = $("keyTimerBar");
const keyFill = $("keyTimerFill"), floatingMessage = $("floatingMessage");
const mainMenu = $("mainMenu"), startBtn = $("startBtn");
const pauseMenu = $("pauseMenu"), resumeBtn = $("resumeBtn");
const toggleMusicBtn = $("toggleMusicBtn"), volumeRange = $("volumeRange");
const backToMenuBtn = $("backToMenuBtn");
const levelTransition = $("levelTransition"), levelTransitionText = $("levelTransitionText");
const nextLevelBtn = $("nextLevelBtn"), bgm = $("bgm");
const colorPicker = $("colorPicker");

let musicOn = true, isPaused = true, level = 1, time = 20, lives = 0;
let timer, gameLoop, arrowInterval, spawnInterval;
let playerY = 30, velocityY = 0, gravity = -0.3, jumpStrength = 10.3, isJumping = false;
let worldOffset = 0, worldSpeed = 2;
let keysToPress = [], arrows = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];

function applyCharacterColor() {
    const color = colorPicker.value;
    player.style.backgroundColor = color;
    player.style.boxShadow = `0 0 15px ${color}`;
}

startBtn.onclick = () => {
    mainMenu.classList.remove("active");
    applyCharacterColor();
    if (musicOn) bgm.play();
    startLevel();
};

resumeBtn.onclick = () => {
    pauseMenu.classList.remove("active");
    isPaused = false;
};

toggleMusicBtn.onclick = () => {
    musicOn = !musicOn;
    toggleMusicBtn.textContent = musicOn ? "Müziği Kapat" : "Müziği Aç";
    musicOn ? bgm.play() : bgm.pause();
};

volumeRange.oninput = () => {
    bgm.volume = volumeRange.value;
};

backToMenuBtn.onclick = () => {
    pauseMenu.classList.remove("active");
    mainMenu.classList.add("active");
    [timer, gameLoop, arrowInterval, spawnInterval].forEach(clearInterval);
    isPaused = true;
};

nextLevelBtn.onclick = () => {
    levelTransition.classList.remove("active");
    startLevel();
};

restartBtn.onclick = () => {
    overlay.classList.remove("active");
    startLevel();
};

document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
        isPaused = true;
        pauseMenu.classList.add("active");
    }
    if (e.key.toLowerCase() === "w" && !isJumping && !isPaused) {
        velocityY = jumpStrength;
        isJumping = true;
    }
    if (e.key.toLowerCase() === "s" && !isPaused) {
        player.style.height = "20px";
    }
});

document.addEventListener("keyup", e => {
    if (e.key.toLowerCase() === "s") {
        player.style.height = "40px";
    }
});

function startLevel() {
    isPaused = true;
    time = 20 + (level - 1) * 10;
    timeDisplay.textContent = time;
    levelDisplay.textContent = level;
    worldOffset = 0;
    playerY = 30;
    velocityY = 0;
    isJumping = false;
    updatePlayerPosition();
    applyCharacterColor();
    removeAll(".obstacle, .questionBox");
    startTimer();
    scheduleArrowPrompts();
    scheduleObstacles();
    startGameLoop();
    overlay.classList.remove("active");
    setTimeout(() => isPaused = false, 1000);
}

function updatePlayerPosition() {
    player.style.bottom = playerY + "px";
}

function startGameLoop() {
    clearInterval(gameLoop);
    gameLoop = setInterval(() => {
        if (isPaused) return;
        worldOffset -= worldSpeed;
        world.style.left = worldOffset + "px";
        document.querySelectorAll(".obstacle, .questionBox").forEach(ob => {
            ob.style.left = (parseInt(ob.style.left) - worldSpeed) + "px";
            if (parseInt(ob.style.left) < -50) ob.remove();
        });
        velocityY += gravity;
        playerY += velocityY;
        if (playerY <= 30) {
            playerY = 30;
            velocityY = 0;
            isJumping = false;
        }
        updatePlayerPosition();
        checkCollisions();
    }, 16);
}

function startTimer() {
    clearInterval(timer);
    timer = setInterval(() => {
        if (!isPaused) {
            time--;
            timeDisplay.textContent = time;
            if (time <= 0) nextLevel();
        }
    }, 1000);
}

function scheduleArrowPrompts() {
    clearInterval(arrowInterval);
    arrowInterval = setInterval(() => {
        if (!isPaused) pauseGameForArrow();
    }, Math.max(4000 - level * 300, 1000));
}

function pauseGameForArrow() {
    if (
        pauseMenu.classList.contains("active") ||
        levelTransition.classList.contains("active") ||
        mainMenu.classList.contains("active")
    ) return;

    isPaused = true;
    keysToPress = [];
    for (let i = 0; i < Math.min(1 + Math.floor(level / 2), 3); i++) {
        keysToPress.push(arrows[Math.floor(Math.random() * arrows.length)]);
    }

    arrowPrompt.innerHTML = keysToPress.map(k => ({
        ArrowLeft: "⬅️", ArrowRight: "➡️", ArrowUp: "⬆️", ArrowDown: "⬇️"
    }[k])).join(" ");

    arrowPrompt.style.display = "block";
    keyBar.style.display = "block";
    keyFill.style.width = "100%";

    let elapsed = 0, duration = Math.max(3000 - level * 150, 1000);
    const countdown = setInterval(() => {
        elapsed += 50;
        keyFill.style.width = (100 - elapsed / duration * 100) + "%";
        if (elapsed >= duration) {
            clearInterval(countdown);
            handleArrowFail();
            cleanup();
        }
    }, 50);

    let pressed = [];

    function onKeyDown(e) {
        if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;

        if (keysToPress.includes(e.key)) {
            pressed.push(e.key);
            if (pressed.length === keysToPress.length) {
                isPaused = false;
                cleanup();
            }
        } else {
            glitchEffect();
            setTimeout(() => {
                handleArrowFail();
                cleanup();
            }, 400);
        }
    }

    function cleanup() {
        document.removeEventListener("keydown", onKeyDown);
        arrowPrompt.style.display = "none";
        keyBar.style.display = "none";
        clearInterval(countdown);
    }

    document.addEventListener("keydown", onKeyDown);
}

function handleArrowFail() {
    isPaused = false;
    if (keysToPress.length === 1) loseLifeOrRestart();
    else {
        showMessage("Başarısız! Zamanda geri gittin.");
        level = Math.max(1, level - 1);
        setTimeout(startLevel, 2000);
    }
}

function glitchEffect() {
    game.classList.add("glitch");
    setTimeout(() => game.classList.remove("glitch"), 400);
}

function loseLifeOrRestart() {
    if (lives > 0) {
        lives--;
        livesDisplay.textContent = lives;
        showMessage("Bir can kaybettin! Devam...");
        setTimeout(startLevel, 2000);
    } else {
        showMessage("Oyun bitti.");
        isPaused = true;
        [timer, gameLoop, arrowInterval, spawnInterval].forEach(clearInterval);
    }
}

function nextLevel() {
    isPaused = true;
    level++;
    levelTransitionText.textContent = "Seviye " + (level - 1) + " tamamlandı!";
    levelTransition.classList.add("active");
}

let lastObstacleTime = 0;
let lastObstacleX = -999;

function scheduleObstacles() {
    clearInterval(spawnInterval);
    spawnInterval = setInterval(() => {
        const newX = 900 + Math.floor(Math.random() * 300);

        const allObstacles = Array.from(document.querySelectorAll(".obstacle, .questionBox"));

        const collision = allObstacles.some(ob => {
            const existingX = parseInt(ob.style.left || 0);
            return Math.abs(existingX - newX) < 80;
        });

        if (collision) return; // Eğer çakışma varsa engel oluşturma

        const ob = document.createElement("div");
        ob.style.left = newX + "px";
        if (Math.random() < 0.85) ob.className = "obstacle";
        else {
            ob.className = "questionBox";
            ob.textContent = "?";
        }
        game.appendChild(ob);

    }, Math.max(1000, 1800 - level * 100));
}

function checkCollisions() {
    if (isPaused) return;
    const pr = player.getBoundingClientRect();
    document.querySelectorAll(".obstacle, .questionBox").forEach(ob => {
        const or = ob.getBoundingClientRect();
        if (
            pr.right > or.left &&
            pr.left < or.right &&
            pr.bottom > or.top &&
            pr.top < or.bottom
        ) {
            if (ob.classList.contains("questionBox")) {
                const bonus = Math.random() < 0.5 ? -5 : 5;
                time += bonus;
                timeDisplay.textContent = time;
                floatingMessage.textContent = bonus > 0 ? "Zaman yavaşladı!" : "Zaman hızlandı!";
                floatingMessage.style.display = "block";
                setTimeout(() => floatingMessage.style.display = "none", 1000);
            } else {
                if (!isJumping) loseLifeOrRestart();
            }
            ob.remove();
        }
    });
}

function removeAll(sel) {
    document.querySelectorAll(sel).forEach(e => e.remove());
}

function showMessage(txt) {
    messageText.textContent = txt;
    overlay.classList.add("active");
    if (!txt.includes("bitti") && !txt.includes("can") && !txt.includes("Seviye")) {
        setTimeout(() => overlay.classList.remove("active"), 1500);
    }
}