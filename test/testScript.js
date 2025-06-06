// === GLOBAL DEĞİŞKENLER ===
let score = 0;
let highScore = parseInt(localStorage.getItem("highScore")) || 0;
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
let timer, gameLoop, arrowInterval, spawnInterval, arrowCountdown;
let arrowElapsed = 0, arrowDuration = 0;
let onArrowKeyDown = null;
let playerY = 30, velocityY = 0, gravity = -0.30, jumpStrength = 10.3, isJumping = false;
let worldOffset = 0, worldSpeed = 2;
let keysToPress = [], arrows = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
let successfulArrowCount = 0, totalArrowCount = 0;
let timeRate = 1;

let totalTimePlayed = 0;
let totalLostLives = 0;

const statsScreen = $("statsScreen");
const statsList = $("statsList");
const statsBackBtn = $("statsBackBtn");


function applyCharacterColor() {
    const color = colorPicker.value;
    player.style.backgroundColor = color;
    player.style.boxShadow = `0 0 15px ${color}`;
}

startBtn.onclick = () => {
    $("score").style.display = "block";
    mainMenu.classList.remove("active");
    $("score").style.display = "block";
    $("score").style.display = "block";
    applyCharacterColor();
    if (musicOn) bgm.play();
    startLevel();
};

resumeBtn.onclick = () => {
    pauseMenu.classList.remove("active");
    $("score").style.display = "block";
    $("score").style.display = "block";
    isPaused = false;

    if (arrowPrompt.style.display === "block" && arrowElapsed < arrowDuration) {
        arrowCountdown = setInterval(() => {
            arrowElapsed += 50;
            keyFill.style.width = (100 - arrowElapsed / arrowDuration * 100) + "%";

            if (arrowElapsed >= arrowDuration) {
                clearInterval(arrowCountdown);
                handleArrowFail();
                cleanupArrowPrompt();
            }
        }, 50);
    }
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
    $("score").style.display = "none";
    pauseMenu.classList.remove("active");
    mainMenu.classList.add("active");
    $("score").style.display = "none";
    $("score").style.display = "none";
    [timer, gameLoop, arrowInterval, spawnInterval].forEach(clearInterval);
    isPaused = true;
    level = 1;
    lives = 0;
    successfulArrowCount = 0;
    totalArrowCount = 0;
    timeRate = 1;
};

nextLevelBtn.onclick = () => {
    levelTransition.classList.remove("active");
    startLevel();
};

restartBtn.onclick = () => {
    score = 0;
    level = 1;
    lives = 0;
    overlay.classList.remove("active");
    startLevel();
};

statsBackBtn.onclick = () => {
    statsScreen.classList.remove("active");
    mainMenu.classList.add("active");
    $("score").style.display = "none";

    score = 0;
    level = 1;
    lives = 0;
    totalTimePlayed = 0;
    totalLostLives = 0;
};

document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
        isPaused = true;
        pauseMenu.classList.add("active");
        $("score").style.display = "none";
        $("score").style.display = "none";
        arrowPrompt.style.display = "none";
        keyBar.style.display = "none";
        if (arrowCountdown) clearInterval(arrowCountdown);
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
    $("score").textContent = `Skor: ${score} | En Yüksek: ${highScore}`;
    isPaused = true;
    time = 20 + (level - 1) * 10;
    totalTimePlayed += time;
    timeDisplay.textContent = time;
    levelDisplay.textContent = level;
    worldOffset = 0; playerY = 30; velocityY = 0; isJumping = false;
    updatePlayerPosition(); applyCharacterColor();
    removeAll(".obstacle, .questionBox");
    successfulArrowCount = 0;
    totalArrowCount = 0;
    startTimer(); scheduleArrowPrompts(); scheduleObstacles();
    startGameLoop(); overlay.classList.remove("active");
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
        if (playerY <= 30) { playerY = 30; velocityY = 0; isJumping = false; }
        updatePlayerPosition();
        checkCollisions();
    }, 16);
}

function startTimer() {
    clearInterval(timer);
    timer = setInterval(() => {
        if (!isPaused) {
            time -= 1 * timeRate;
            timeDisplay.textContent = Math.ceil(time);
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
        isPaused ||
        pauseMenu.classList.contains("active") ||
        levelTransition.classList.contains("active") ||
        mainMenu.classList.contains("active")
    ) return;

    isPaused = true;
    keysToPress = [];
    for (let i = 0; i < Math.min(1 + Math.floor(level / 2), 3); i++) {
        keysToPress.push(arrows[Math.floor(Math.random() * arrows.length)]);
    }

    totalArrowCount++;

    arrowPrompt.innerHTML = keysToPress.map(k => ({
        ArrowLeft: "⬅️", ArrowRight: "➡️", ArrowUp: "⬆️", ArrowDown: "⬇️"
    }[k])).join(" ");

    arrowPrompt.style.display = "block";
    keyBar.style.display = "block";
    keyFill.style.width = "100%";

    arrowElapsed = 0;
    arrowDuration = Math.max(3000 - level * 150, 1000);

    arrowCountdown = setInterval(() => {
        arrowElapsed += 50;
        keyFill.style.width = (100 - arrowElapsed / arrowDuration * 100) + "%";

        if (arrowElapsed >= arrowDuration) {
            clearInterval(arrowCountdown);
            handleArrowFail();
            cleanupArrowPrompt();
        }
    }, 50);

    onArrowKeyDown = function(e) {
        if (!arrows.includes(e.key)) return;

        const index = keysToPress.indexOf(e.key);
        if (index !== -1) {
            keysToPress.splice(index, 1);
            if (keysToPress.length === 0) {
                updateScore(50);
                successfulArrowCount++;
                clearInterval(arrowCountdown);
                cleanupArrowPrompt();
                isPaused = false;
            }
        } else {
            clearInterval(arrowCountdown);
            glitchEffect();
            setTimeout(() => {
                handleArrowFail();
                cleanupArrowPrompt();
            }, 400);
        }
    };

    document.addEventListener("keydown", onArrowKeyDown);
}

function cleanupArrowPrompt() {
    arrowPrompt.style.display = "none";
    keyBar.style.display = "none";
    clearInterval(arrowCountdown);
    document.removeEventListener("keydown", onArrowKeyDown);
}

function handleArrowFail() {
    isPaused = false;
    if (lives > 0) {
        lives--;
        totalLostLives++;
        livesDisplay.textContent = lives;
        floatingMessage.textContent = "Zamanda Geriye Gittin!";
        floatingMessage.style.display = "block";
        setTimeout(() => {
            floatingMessage.style.display = "none";
            startLevel();
        }, 1500);
    } else {
        showMessage("Oyun bitti.");
        showStats();
        score = 0;
        level = 1;
        successfulArrowCount = 0;
        totalArrowCount = 0;
        isPaused = true;
        [timer, gameLoop, arrowInterval, spawnInterval].forEach(clearInterval);
    }
}
function glitchEffect() {
    game.classList.add("glitch");
    setTimeout(() => game.classList.remove("glitch"), 400);
}

function showStats() {
    $("score").style.display = "none";
    statsList.innerHTML = `
    <li>Ulaşılan Seviye: ${level}</li>
    <li>Toplam Skor: ${score}</li>
    <li>Geçen Tahmini Süre: ${totalTimePlayed} sn</li>
    <li>Başarılı Zaman Durmaları: ${successfulArrowCount}</li>
    <li>Kaybedilen Can: ${totalLostLives}</li>
  `;
    statsScreen.classList.add("active");
    overlay.classList.remove("active");
}

function loseLifeOrRestart() {
    if (lives > 0) {
        lives--;
        totalLostLives++;
        livesDisplay.textContent = lives;
        showMessage("Bir can kaybettin! Devam...");
        setTimeout(() => {
            if (!overlay.classList.contains("active")) startLevel();
        }, 2000);
    } else {
        showMessage("Oyun bitti.");
        isPaused = true;
        [timer, gameLoop, arrowInterval, spawnInterval].forEach(clearInterval);
    }
}

function nextLevel() {
    isPaused = true;
    [timer, gameLoop, arrowInterval, spawnInterval].forEach(clearInterval);
    if (totalArrowCount > 0 && successfulArrowCount === totalArrowCount) {
        addLife();
    }
    successfulArrowCount = 0;
    totalArrowCount = 0;
    updateScore(100);
    level++;
    levelTransitionText.textContent = "Seviye " + (level - 1) + " tamamlandı!";
    levelTransition.classList.add("active");
    levelTransitionText.textContent = "Seviye " + (level - 1) + " tamamlandı!";
    levelTransition.classList.add("active");
}

function scheduleObstacles() {
    clearInterval(spawnInterval);
    spawnInterval = setInterval(() => {
        if (isPaused) return;

        const newX = 900 + Math.floor(Math.random() * 300);
        const allObstacles = Array.from(document.querySelectorAll(".obstacle, .questionBox"));

        const collision = allObstacles.some(ob => {
            const existingX = parseInt(ob.style.left || 0);
            return Math.abs(existingX - newX) < 80;
        });

        if (collision) return;

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
                const slow = Math.random() < 0.5;
                timeRate = slow ? 0.5 : 2;
                floatingMessage.textContent = slow ? "Zaman yavaşladı!" : "Zaman hızlandı!";
                floatingMessage.style.display = "block";
                setTimeout(() => {
                    timeRate = 1;
                    floatingMessage.style.display = "none";
                }, 3000);
            } else {
                if (!isJumping) loseLifeOrRestart();
            }
            ob.remove();
        }
    });
}

function updateScore(amount) {
    score += amount;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem("highScore", highScore);
    }
    $("score").textContent = `Skor: ${score} | En Yüksek: ${highScore}`;
}

function removeAll(sel) {
    document.querySelectorAll(sel).forEach(e => e.remove());
}

function showMessage(txt) {
    if (txt.includes("Skor")) return;
    if (overlay.classList.contains("active")) return;
    messageText.textContent = txt;
    overlay.classList.add("active");
    if (!txt.includes("bitti") && !txt.includes("can") && !txt.includes("Seviye")) {
        setTimeout(() => overlay.classList.remove("active"), 1500);
    }
}

function addLife() {
    updateScore(75);
    lives++;
    livesDisplay.textContent = lives;
    floatingMessage.textContent = "Ekstra Can Kazandın!";
    floatingMessage.style.display = "block";
    setTimeout(() => floatingMessage.style.display = "none", 1500);
}
