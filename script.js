const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d')
canvas.width = 900;
canvas.height = 600;

// global variables
const cellSize = 100;
const cellGap = 3;
let numberOfResources = 300;
let enemiesInterval = 300;
let health = 100;    // initial value to 100... defender health needs to update!!!!
let frame = 0;
let gameOver = false;
let score = 0;
const winningScore = 2000;
let chosenDefender = 1;

const enemies = [];
const enemyPosition = [];
const gameGrid = [];
const defenders = [];
const projectiles = [];
const resources = [];

// mouse
const mouse = {
    x: 10,
    y: 10,
    width: 0.1,
    height: 0.1,
    clicked: false
}
canvas.addEventListener('mousedown', function (){
    mouse.clicked = true;
});
canvas.addEventListener('mouseup', function (){
    mouse.clicked = false;
});

let canvasPosition = canvas.getBoundingClientRect();
canvas.addEventListener('mousemove', function (e){
    mouse.x = e.x - canvasPosition.left;
    mouse.y = e.y - canvasPosition.top;
});

canvas.addEventListener('mouseleave', function () {
    mouse.x = undefined;
    mouse.y = undefined;
})

// game board
const controlsBar = {
    width: canvas.width,
    height: cellSize
}

class Cell {
    constructor( x, y) {
        this.x = x;
        this.y = y;
        this.width = cellSize;
        this.height = cellSize;
    }
    draw() {
        if(mouse.x && mouse.y && collision(this, mouse)) {
            ctx.strokeStyle = 'black';
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
    }
}
function createGrid() {
    for (let y = cellSize; y < canvas.height; y += cellSize) {
        for (let x = 0; x < canvas.width; x += cellSize) {
            gameGrid.push(new Cell(x, y));
        }
    }
}
createGrid();
function handleGameGrid(){
    for (let i = 0; i <gameGrid.length; i++) {
        gameGrid[i].draw();
    }
}

// projectiles
const bullet1 = new Image();
bullet1.src = 'Sprites/Projectiles/pngs_with_blur/blue/broad-2.png';
const bullet2 = new Image();
bullet2.src = 'Sprites/Projectiles/pngs_with_blur/yellow/broad-2.png';

class Projectiles {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 10;
        this.height = 10;
        this.power = 25;
        this.speed = 8;
        this.frameX = 0;
        this.frameY = 0;
        this.spriteWidth = 399;
        this.spriteHeight = 377;
        this.minFrame = 0;
        this.maxFrame = 6;
    }
    update() {
        this.x += this.speed;
    }
    draw() {
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width, 0, Math.PI * 2);
        ctx.drawImage(bullet1, this.frameX * this.spriteWidth + 10, this.frameY * this.spriteHeight + 10, this.spriteWidth, this.spriteHeight,
            this.x, this.y, this.width, this.height);
        ctx.fill();
    }
}
function handleProjectiles() {
    for ( let i =0; i < projectiles.length; i++) {
        projectiles[i].update();
        projectiles[i].draw();
        for(let j = 0; j < enemies.length; j++ ) {
            if(enemies[j] && projectiles[i] && collision(projectiles[i], enemies[j])) {
                enemies[j].health -= projectiles[i].power;
                projectiles.splice(i, 1);
                i--;
            }
        }
        if(projectiles[i] && projectiles[i].x > canvas.width - cellSize) {
            projectiles.splice(i, 1);
            i--;
        }
    }
}

// defenders
const defender1 = new Image();
defender1.src = 'Sprites/Jetpack/tower1.png';
const defender2 = new Image();
defender2.src = 'Sprites/Jetpack/tower2.png';
//lets add a defender 3

class Defender {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = cellSize - cellGap * 2;
        this.height = cellSize - cellGap * 2;
        this.shooting = false;
        this.timer = 0;
        this.frameX = 0;
        this.frameY = 0;
        this.spriteWidth = 871;
        this.spriteHeight = 663;
        this.minFrame = 0;
        this.maxFrame = 6;
        this.chosenDefender = chosenDefender;
        
        // Need to set health before drawing
        if(this.chosenDefender === 1) {
            this.health = 100;
        } else if(this.chosenDefender === 2) {
            this.health = 150;
        }
    }

    draw() {
        ctx.fillStyle = 'black';
        ctx.font = '20px orbitron';
        ctx.fillText(Math.floor(this.health), this.x + 15, this.y + 0);
        if (this.chosenDefender === 1) {
            ctx.drawImage(
                defender1, 
                this.frameX * this.spriteWidth, 
                0, 
                this.spriteWidth, 
                this.spriteHeight,
                this.x, this.y, this.width, this.height
            );
        } else if (this.chosenDefender === 2) {
            ctx.drawImage(
                defender2, 
                this.frameX * this.spriteWidth, 
                0, 
                this.spriteWidth, 
                this.spriteHeight,
                this.x, 
                this.y, 
                this.width, 
                this.height
            );
        }
    }

    update() {
        if (frame % 10 === 0) {
            if (this.frameX < this.maxFrame) this.frameX++;
            else this.frameX = this.minFrame;
       }
        if (this.shooting) {
            this.timer++;
            if (this.timer % 100 === 0) {
                projectiles.push(new Projectiles(this.x + 70, this.y + 50));
            }
        } else {
            this.timer = 0;
        }
    }
}

function handleDefenders() {
    for (let i = 0; i < defenders.length; i++ ) {
        defenders[i].draw();
        defenders[i].update();
        defenders[i].shooting = enemyPosition.indexOf(defenders[i].y) !== -1;
        for(let j = 0; j < enemies.length; j++) {
            if (defenders[i] && collision(defenders[i], enemies[j])) {
                enemies[j].movement = 0;
                defenders[i].health -= 0.2;
            }
            if (defenders[i] && defenders[i].health <= 0) {
                defenders.splice(i, 1);
                i--;
                enemies[j].movement = enemies[j].speed;
            }
        }
    }
}

const card1 = {
    x: 10,
    y: 10,
    width: 70,
    height: 85
}
const card2 = {
    x: 90,
    y: 10,
    width: 70,
    height: 85
}

function chooseDefender() {
    let card1stroke = 'black';
    let card2stroke = 'black';
    if (collision(mouse, card1) && mouse.clicked) {
        chosenDefender = 1;
    } else if (collision(mouse, card2) && mouse.clicked) {
        chosenDefender = 2;
    }
    // lets add a 3rd defender in here!!!
    if (chosenDefender === 1) {
         card1stroke = 'gold';
         card2stroke = 'black';
    } else if (chosenDefender === 2) {
         card1stroke = 'black';
         card2stroke = 'gold';
    } else {
         card1stroke = 'black';
         card2stroke = 'black';
    }

    ctx.lineWidth = 1;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(card1.x + 25,card1.y + -7, card1.width, card1.height);
    ctx.strokeStyle = card1stroke;
    ctx.strokeRect(card1.x + 25,card1.y + -7, card1.width, card1.height);
    ctx.drawImage(defender1, 0, 0, 871, 663, 0, 5, 871/7, 663/7);
    ctx.fillRect(card2.x + 25 ,card2.y + -7 , card2.width, card2.height);
    ctx.strokeStyle = card2stroke;
    ctx.strokeRect(card2.x + 25 ,card2.y + -7 , card2.width, card2.height);
    ctx.drawImage(defender2, 0, 0, 871, 663, 80, 5, 871/7, 663/7);
}

// Floating messages
const floatingMessages = [];
class floatingMessage {
    constructor(value,x, y, size, color) {
        this.value = value;
        this.x = x;
        this.y = y;
        this.size = size;
        this.lifeSpan = 0;
        this.color = color;
        this.opacity = 1;
    }
    update() {
        this.y -= 0.3;
        this.lifeSpan += 1;
        if(this.opacity > 0.05) this.opacity -= 0.05;
    }
    draw(){
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        ctx.font = this.size + 'px orbitron';
        ctx.fillText(this.value, this.x, this.y);
        ctx.globalAlpha = 1;
    }
}
function handleFloatingMessages() {
    for(let i = 0; i < floatingMessages.length; i++) {
        floatingMessages[i].update();
        floatingMessages[i].draw();
        if(floatingMessages[i].lifeSpan >= 50) {
            floatingMessages.splice(i, 1);
            i--;
        }
    }
}

// enemies
const enemyTypes = [];
const enemy1 = new Image();
enemy1.src = 'Sprites/Aliens/Alien1.png';
enemyTypes.push(enemy1);
const enemy2 = new Image();
enemy2.src = 'Sprites/Aliens/Alien2.png'
enemyTypes.push(enemy2);
const enemy3 = new Image();
enemy3.src = 'Sprites/Aliens/Alien3.png';
enemyTypes.push(enemy3);

class Enemy {
    constructor(verticalPosition) {
        this.x = canvas.width;
        this.y = verticalPosition;
        this.width = cellSize - cellGap * 2;
        this.height = cellSize - cellGap * 2;
        this.speed = Math.random() * 0.4 + 0.8;
        this.movement = this.speed;
        this.health = 100;
        this.maxHealth = this.health;
        this.enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        this.frameX = 0;
        this.frameY = 0;
        this.minFrame = 0;
        this.maxFrame = 4;
        this.spriteWidth = 575;
        this.spriteHeight = 817;
    }
    update() {
        this.x -= this.movement;
        if (frame % 9 === 0) {
            if (this.frameX < this.maxFrame) this.frameX++;
            else this.frameX = this.minFrame;
        }
    }
    draw() {
        ctx.fillStyle = 'black';
        ctx.font = '20px orbitron';
        ctx.fillText(Math.floor(this.health), this.x + 15, this.y + 0);
        ctx.drawImage(this.enemyType, this.frameX * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight,
            this.x, this.y, this.width, this.height);
    }
}
function handleEnemies(){
    for(let i = 0; i < enemies.length; i++) {
      enemies[i].update();
      enemies[i].draw();
      if (enemies[i].x < 0) {
          gameOver = true;
      }
      if (enemies[i].health <= 0) {
          let gainedResources = enemies[i].maxHealth/5;
          floatingMessages.push(new floatingMessage('+' + gainedResources, enemies[i].x, enemies[i].y, 30, 'black'));
          floatingMessages.push(new floatingMessage('+' + gainedResources, 465, 65, 30, 'gold'));
          numberOfResources += gainedResources;
          score += gainedResources;
          const findThisIndex = enemyPosition.indexOf(enemies[i].y);
          enemyPosition.splice(findThisIndex, 1);
          enemies.splice(i,1);

          i--;
      }
    }
    if (frame % enemiesInterval === 0 && score < winningScore) {
        let verticalPosition = Math.floor(Math.random() * 5 + 1) * cellSize + cellGap;
        enemies.push(new Enemy(verticalPosition));
        enemyPosition.push(verticalPosition);
        if (enemiesInterval > 120) enemiesInterval -= 50;
    }
}
// resources
const resource1 = new Image();
resource1.src = 'Sprites/Collectables/goldStar.png';
const  amounts = [20, 30, 40];
// also.. lets color these up for different point values.
class Resource {
    constructor() {
        this.x = Math.random() * (canvas.width - cellSize);
        this.y = (Math.floor(Math.random() * 5) + 1) * cellSize + 25;
        this.width = cellSize * 0.6;
        this.height = cellSize * 0.6;
        this.amount = amounts[Math.floor(Math.random() * amounts.length)];
        this.speed = Math.random() * 0.4 + 0.8;
        this.frameX = 0;
        this.frameY = 0;
        this.frame = 0;
        this.spriteWidth = 318;
        this.spriteHeight = 307;
        this.minFrame = 0;
        this.maxFrame = 6 - 1;
    }

    draw() {
        ctx.fillStyle = 'black';
        ctx.font = '20px orbitron';
        ctx.fillText(this.amount, this.x + 12, this.y + 0);
        ctx.drawImage(resource1, this.frameX * this.spriteWidth, this.frameY * this.spriteHeight, this.spriteWidth, this.spriteHeight,
            this.x, this.y, this.width, this.height);
    }
    
    update() {
        if (frame % 10 === 0) {
            if (this.frameX < this.maxFrame) this.frameX++;
            else this.frameX = this.minFrame;
        }
    }
}

function handleResources() {
    if(frame % 500 === 0 && score < winningScore) {
        resources.push(new Resource());
    }
    for (let i = 0; i < resources.length; i++) {
        resources[i].update();
        resources[i].draw();
        if(resources[i] && mouse.x && mouse.y && collision(resources[i], mouse)) {
            numberOfResources += resources[i].amount;
            floatingMessages.push(new floatingMessage('+' + resources[i].amount,
            resources[i].x, resources[i].y, 30, 'black'));
            floatingMessages.push(new floatingMessage('+' + resources[i].amount,
            480, 70, 30, 'gold'));
            resources.splice(i, 1);
            i--;
        }
    }
}

//utilities
function handleGameStatus() {
    ctx.fillStyle = 'gold';
    ctx.font = '30px orbitron';
    ctx.fillText('Score: ' + score, 200, 40 );
    ctx.fillText('Resources: ' + numberOfResources, 200, 80 );
    if(gameOver) {
        if(score <= 100) {
        ctx.fillStyle = 'black';
        ctx.font = '90px orbitron';
        ctx.fillText('Wow you suck!', 100, 250);
        ctx.fillText('Game over Noob', 50, 340);
    } else if (score > 100 && score <= 500) {
            ctx.fillStyle = 'black';
            ctx.font = '90px orbitron';
            ctx.fillText('You still suck, Game Over', 135, 330);}
    }
    if( score >= winningScore && enemies.length === 0 ) {
        ctx.fillStyle = 'black';
        ctx.font = '60px orbitron';
        ctx.fillText('Level Complete', 130, 300);
        ctx.font = '30px orbitron';
        ctx.fillText('Your score is ' + score + ' points!',134,340);
    }
}

canvas.addEventListener('click', function() {
    const gridPositionX = mouse.x - (mouse.x % cellSize) + cellGap;
    const gridPositionY = mouse.y - (mouse.y % cellSize) + cellGap;
    if (gridPositionY < cellSize) return;
    for (let i = 0; i < defenders.length; i++) {
        if(defenders[i].x === gridPositionX && defenders[i].y === gridPositionY)
            return;
    }
    let defendersCost = 100;
    if (numberOfResources >= defendersCost) {
        defenders.push(new Defender(gridPositionX, gridPositionY));
        numberOfResources -= defendersCost;
    } else {
        floatingMessages.push(new floatingMessage("need more resources", mouse.x, mouse.y,
            25,'red'));
    }
});

//repeating background
const background = new Image();
background.src = 'Sprites/Background/example/sky_background_green_hills.png';

function handleBackground() {
    ctx.drawImage(background, 0 ,0, canvas.width, canvas.height);
}

function animate() {
    ctx.clearRect(0,0,canvas.width, canvas.height);
    handleBackground();
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0,0,controlsBar.width, controlsBar.height);
    handleGameGrid();
    handleDefenders();
    handleResources();
    handleProjectiles();
    handleEnemies();
    chooseDefender();
    handleGameStatus();
    handleFloatingMessages();
    frame++;
    if (!gameOver) requestAnimationFrame(animate);
}
animate();

function collision(first, second) {
    if (  !(first.x > second.x + second.width ||
            first.x + first.width < second.x ||
            first.y > second.y + second.height ||
            first.y + first.height < second.y)) {
        return true;
    }
}
window.addEventListener('resize', function() {
    canvasPosition = canvas.getBoundingClientRect();
})
