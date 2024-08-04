//board - quadro
let board;
let boardWidth = 360;
let boardHeight = 640;
let context;
let gameStarted = false;

// onload game - carregar jogo
let onloadImg;

//bird -  pássaro
let birdWidth = 34; //width/height ratio = 408/228 = 17/12
let birdHeight = 24;
let birdX = boardWidth / 8;
let birdY = boardHeight / 2;

// imagens
let birdUpImg;
let birdDownImg;
let birdMidImg;

let bird = {
  x: birdX,
  y: birdY,
  width: birdWidth,
  height: birdHeight,
};

//pipes - tubos
let pipeArray = [];
let pipeWidth = 64; //width/height ratio = 384/3072 = 1/8
let pipeHeight = 512;
let pipeX = boardWidth;
let pipeY = 0;
// imagens
let topPipeImg;
let bottomPipeImg;

//physics - física
let velocityX = -2; //pipes moving left speed
let velocityY = 0; //bird jump speed
let gravity = 0.4;

let gameOver = false;
let score = 0;

// game over
let gameOverImg;

// score logic - lógica de pontuação
let scoreImages = [];
for (let i = 0; i < 10; i++) {
  let img = new Image();
  img.src = `./assets/sprites/${i}.png`;
  scoreImages.push(img);
}

// audio
let hitSound;
let wingSound;
let pointSound;

window.onload = function () {
  board = document.getElementById("gameCanvas");
  board.height = boardHeight;
  board.width = boardWidth;
  context = board.getContext("2d"); //used for drawing on the board - usado para desenhar no quadro

  //load images - carregar imagens
  onloadImg = new Image();
  onloadImg.src = "./assets/sprites/message.png";
  onloadImg.onload = function () {
    context.drawImage(
      onloadImg,
      (boardWidth - onloadImg.width) / 2,
      (boardHeight - onloadImg.height) / 2,
      onloadImg.width,
      onloadImg.height
    );
  };
  birdUpImg = new Image();
  birdUpImg.src = "./assets/sprites/redbird-upflap.png";

  birdDownImg = new Image();
  birdDownImg.src = "./assets/sprites/redbird-downflap.png";

  birdMidImg = new Image();
  birdMidImg.src = "./assets/sprites/redbird-midflap.png";
  birdMidImg.onload = function () {
    context.drawImage(birdMidImg, bird.x, bird.y, bird.width, bird.height);
  };

  topPipeImg = new Image();
  topPipeImg.src = "./assets/sprites/toppipe.png";

  bottomPipeImg = new Image();
  bottomPipeImg.src = "./assets/sprites/bottompipe.png";

  gameOverImg = new Image();
  gameOverImg.src = "./assets/sprites/gameover.png";

  // load sounds - carregar sons
  hitSound = new Audio("./assets/audios/hit.wav");
  wingSound = new Audio("./assets/audios/wing.wav");
  pointSound = new Audio("./assets/audios/point.wav");
};

window.addEventListener("keydown", () => {
  if (!gameStarted) {
    gameStarted = true;
    // Inicie o jogo quando uma tecla for pressionada
    startGame();
  }
});

function startGame() {
  requestAnimationFrame(update);
  setInterval(placePipes, 1500);
  document.addEventListener("keydown", moveBird);
}

function update() {
  requestAnimationFrame(update);
  if (gameOver) {
    return;
  }
  context.clearRect(0, 0, board.width, board.height);

  //bird - pássaro
  velocityY += gravity;
  let birdImgToUse;
  if (velocityY < 0) {
    // Se o pássaro estiver subindo
    birdImgToUse = birdUpImg;
  } else if (velocityY > 0) {
    // Se o pássaro estiver descendo
    birdImgToUse = birdDownImg;
  } else {
    // Se o pássaro estiver parado (não subindo nem descendo)
    birdImgToUse = birdMidImg;
  }

  // bird.y += velocityY;
  bird.y = Math.max(bird.y + velocityY, 0); //aplique gravidade ao bird.y atual, limite o bird.y ao topo da tela
  context.drawImage(birdImgToUse, bird.x, bird.y, bird.width, bird.height);

  if (bird.y > board.height) {
    gameOver = true;
  }

  //pipes - tubos
  for (let i = 0; i < pipeArray.length; i++) {
    let pipe = pipeArray[i];
    pipe.x += velocityX;
    context.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height);

    if (!pipe.passed && bird.x > pipe.x + pipe.width) {
      score += 0.5; //0,5 porque existem 2 tubos! então 0,5 * 2 = 1, 1 para cada conjunto de tubos
      pipe.passed = true;
      pointSound.play();
    }

    if (detectCollision(bird, pipe)) {
      gameOver = true;
    }
  }

  //clear pipes - tubos transparentes
  while (pipeArray.length > 0 && pipeArray[0].x < -pipeWidth) {
    pipeArray.shift(); //remove o primeiro elemento do array
  }

  //score - pontuação
  drawScore(score);

  if (gameOver) {
    hitSound.play();
    context.drawImage(
      gameOverImg,
      (boardWidth - gameOverImg.width) / 2,
      (boardHeight - gameOverImg.height) / 2
    );
    // context.fillText("GAME OVER", 5, 90);
  }
}

function placePipes() {
  if (gameOver) {
    return;
  }

  //(0-1) * pipeHeight/2.
  // 0 -> -128 (pipeHeight/4)
  // 1 -> -128 - 256 (pipeHeight/4 - pipeHeight/2) = -3/4 pipeHeight
  let randomPipeY = pipeY - pipeHeight / 4 - Math.random() * (pipeHeight / 2);
  let openingSpace = board.height / 4;

  let topPipe = {
    img: topPipeImg,
    x: pipeX,
    y: randomPipeY,
    width: pipeWidth,
    height: pipeHeight,
    passed: false,
  };
  pipeArray.push(topPipe);

  let bottomPipe = {
    img: bottomPipeImg,
    x: pipeX,
    y: randomPipeY + pipeHeight + openingSpace,
    width: pipeWidth,
    height: pipeHeight,
    passed: false,
  };
  pipeArray.push(bottomPipe);
}

function moveBird(e) {
  if (e.code == "Space" || e.code == "ArrowUp" || e.code == "KeyX") {
    //jump
    velocityY = -6;
    wingSound.play();
    //reset game
    if (gameOver) {
      bird.y = birdY;
      pipeArray = [];
      score = 0;
      gameOver = false;
    }
  }
}

function detectCollision(a, b) {
  return (
    a.x < b.x + b.width && //O canto superior esquerdo de a não alcança o canto superior direito de b
    a.x + a.width > b.x && //O canto superior direito de a passa pelo canto superior esquerdo de b
    a.y < b.y + b.height && //O canto superior esquerdo de /a não alcança o canto inferior esquerdo de b
    a.y + a.height > b.y
  ); //O canto inferior esquerdo de a passa pelo canto superior esquerdo de b
}

function drawScore(score) {
  let scoreStr = score.toString(); // Converte o score para string
  let digitWidth = scoreImages[0].width; // Largura de cada dígito
  let digitHeight = scoreImages[0].height; // Altura de cada dígito
  let totalWidth = digitWidth * scoreStr.length; // Largura total do score

  // Calcula a posição inicial do primeiro dígito para centralizá-lo
  let startX = (boardWidth - totalWidth) / 2;

  // Desenha cada dígito do score no canvas
  for (let i = 0; i < scoreStr.length; i++) {
    let digit = parseInt(scoreStr[i]); // Converte o dígito de string para número
    let x = startX + i * digitWidth; // Posição horizontal do dígito
    let y = 140; // Posição vertical do dígito
    context.drawImage(scoreImages[digit], x, y, digitWidth, digitHeight);
  }
}
