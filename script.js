const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
document.body.appendChild(canvas);

canvas.width = 800;
canvas.height = 400;

const FRAME_WIDTH = 200;
const FRAME_HEIGHT = 200;

const GRAVITY = 2;
const FLOOR_Y = 0;

class Player {
  constructor(name, sprites, x, facingRight = true) {
    this.name = name;
    this.sprites = sprites;
    this.x = x;
    this.y = FLOOR_Y;
    this.vx = 0;
    this.vy = 0;
    this.width = FRAME_WIDTH;
    this.height = FRAME_HEIGHT;
    this.facingRight = facingRight;

    this.state = "idle";
    this.frameIndex = 0;
    this.frameSpeed = 5;
    this.frameCounter = 0;

    this.isOnGround = true;
  }

  update() {
    // Apply velocity
    this.x += this.vx;
    this.y += this.vy;

    // Clamp player inside screen bounds
    this.x = Math.max(0, Math.min(this.x, canvas.width - this.width));

    // Gravity
    if (!this.isOnGround) {
      this.vy += GRAVITY;
    }

    // Floor collision
    if (this.y >= FLOOR_Y) {
      this.y = FLOOR_Y;
      this.vy = 0;
      this.isOnGround = true;
      if (this.state === "jump" || this.state === "fall") {
        this.changeState("idle");
      }
    } else {
      this.isOnGround = false;
    }

    // Update animation frame
    this.frameCounter++;
    if (this.frameCounter >= this.frameSpeed) {
      this.frameCounter = 0;
      this.frameIndex++;
      const maxFrames = this.getFrameCountForState();
      if (this.frameIndex >= maxFrames) this.frameIndex = 0;
    }
  }

  getFrameCountForState() {
    switch (this.state) {
      case "idle": return 8;
      case "run": return 8;
      case "jump": return 2;
      case "fall": return 2;
      case "attack1": return 4;
      case "attack2": return 4;
      case "hurt": return 2;
      case "death": return 6;
      default: return 1;
    }
  }

  changeState(newState) {
    if (this.state !== newState) {
      this.state = newState;
      this.frameIndex = 0;
      this.frameCounter = 0;
    }
  }

  draw(ctx) {
    const sprite = this.sprites[this.state];
    if (!sprite) return;

    ctx.save();

    // Flip if facing left
    if (!this.facingRight) {
      ctx.translate(this.x + this.width / 2, canvas.height - this.y - this.height / 2);
      ctx.scale(-1, 1);
      ctx.translate(-this.width / 2, -this.height / 2);
    } else {
      ctx.translate(this.x, canvas.height - this.y - this.height);
    }

    ctx.drawImage(
      sprite,
      this.frameIndex * FRAME_WIDTH,
      0,
      FRAME_WIDTH,
      FRAME_HEIGHT,
      0,
      0,
      FRAME_WIDTH,
      FRAME_HEIGHT
    );

    ctx.restore();
  }
}

function loadImage(path) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = path;
    img.onload = () => resolve(img);
  });
}

// Background
let backgroundImage;
const backgroundPaths = [
  "Assets/Background1/Battleground1.png",
  "Assets/Background2/Battleground2.png",
  "Assets/Background3/Battleground3.png"
];

function pickRandomBackground() {
  const index = Math.floor(Math.random() * backgroundPaths.length);
  return loadImage(backgroundPaths[index]);
}

function drawBackground() {
  if (!backgroundImage) return;

  const patternWidth = backgroundImage.width;
  const patternHeight = backgroundImage.height;

  for (let x = 0; x < canvas.width; x += patternWidth) {
    for (let y = 0; y < canvas.height; y += patternHeight) {
      ctx.drawImage(backgroundImage, x, y);
    }
  }
}

let sprites = {};
let player1, player2;
const keysPressed = new Set();

async function loadAllSprites() {
  const [p1, p2, bg] = await Promise.all([
    Promise.all([
      loadImage("Assets/Assasin/Idle.png"),
      loadImage("Assets/Assasin/Run.png"),
      loadImage("Assets/Assasin/Jump.png"),
      loadImage("Assets/Assasin/Fall.png"),
      loadImage("Assets/Assasin/Attack1.png"),
      loadImage("Assets/Assasin/Attack2.png"),
      loadImage("Assets/Assasin/Take-hit.png"),
      loadImage("Assets/Assasin/Death.png"),
    ]),
    Promise.all([
      loadImage("Assets/Wu/Idle.png"),
      loadImage("Assets/Wu/Run.png"),
      loadImage("Assets/Wu/Jump.png"),
      loadImage("Assets/Wu/Fall.png"),
      loadImage("Assets/Wu/Attack1.png"),
      loadImage("Assets/Wu/Attack2.png"),
      loadImage("Assets/Wu/Take Hit.png"),
      loadImage("Assets/Wu/Death.png"),
    ]),
    pickRandomBackground()
  ]);

  backgroundImage = bg;

  sprites = {
    player1: {
      idle: p1[0],
      run: p1[1],
      jump: p1[2],
      fall: p1[3],
      attack1: p1[4],
      attack2: p1[5],
      hurt: p1[6],
      death: p1[7],
    },
    player2: {
      idle: p2[0],
      run: p2[1],
      jump: p2[2],
      fall: p2[3],
      attack1: p2[4],
      attack2: p2[5],
      hurt: p2[6],
      death: p2[7],
    },
  };
}

function updatePlayers() {
  // Player 1 (WASD + Q/E)
  if (keysPressed.has("a")) {
    player1.vx = -5;
    player1.facingRight = false;
    if (player1.isOnGround) player1.changeState("run");
  } else if (keysPressed.has("d")) {
    player1.vx = 5;
    player1.facingRight = true;
    if (player1.isOnGround) player1.changeState("run");
  } else {
    player1.vx = 0;
    if (player1.isOnGround) player1.changeState("idle");
  }

  if (keysPressed.has("w") && player1.isOnGround) {
    player1.vy = -25;
    player1.isOnGround = false;
    player1.changeState("jump");
  }

  if (keysPressed.has("q")) {
    player1.changeState("attack1");
  } else if (keysPressed.has("e")) {
    player1.changeState("attack2");
  } else if (["attack1", "attack2"].includes(player1.state)) {
    if (player1.isOnGround) player1.changeState("idle");
  }

  // Player 2 (Arrow keys + ,/.)
  if (keysPressed.has("ArrowLeft")) {
    player2.vx = -5;
    player2.facingRight = false;
    if (player2.isOnGround) player2.changeState("run");
  } else if (keysPressed.has("ArrowRight")) {
    player2.vx = 5;
    player2.facingRight = true;
    if (player2.isOnGround) player2.changeState("run");
  } else {
    player2.vx = 0;
    if (player2.isOnGround) player2.changeState("idle");
  }

  if (keysPressed.has("ArrowUp") && player2.isOnGround) {
    player2.vy = -25;
    player2.isOnGround = false;
    player2.changeState("jump");
  }

  if (keysPressed.has(",")) {
    player2.changeState("attack1");
  } else if (keysPressed.has(".")) {
    player2.changeState("attack2");
  } else if (["attack1", "attack2"].includes(player2.state)) {
    if (player2.isOnGround) player2.changeState("idle");
  }
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();

  updatePlayers();
  player1.update();
  player2.update();

  player1.draw(ctx);
  player2.draw(ctx);

  requestAnimationFrame(gameLoop);
}

loadAllSprites().then(() => {
  player1 = new Player("player1", sprites.player1, 150, true);
  player2 = new Player("player2", sprites.player2, 550, false);

  window.addEventListener("keydown", (e) => keysPressed.add(e.key));
  window.addEventListener("keyup", (e) => keysPressed.delete(e.key));

  gameLoop();
});
