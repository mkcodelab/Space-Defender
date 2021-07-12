const canvas = document.querySelector('#canvas1');
const ctx = canvas.getContext('2d');

function setSize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
addEventListener('resize', setSize);
setSize();
// GLOBALS==================

let frame = 0;
let SFXVol = 0.5;
let musicVol = 0.5;
let gameOn = false;
// in future make player object and put all that shit inside
let enemySpeedModifier = 20;
let enemyHpModifier = 10;
let credits = 0;
let level = 1;
// showing hitboxes
const debug = false;

// ==== LOADING ASSETS ===================
// imgs=================

const cannonImg = new Image();
cannonImg.src = 'assets/img/cannon.png'
const baseImg = new Image();
baseImg.src = 'assets/img/base.png'
const sandImg = new Image();
sandImg.src = 'assets/img/sand.png';
const starsImg = new Image();
starsImg.src = 'assets/img/stars.png';
const crosshairImg = new Image();
crosshairImg.src = 'assets/img/crosshair.png';
const laserImg = new Image();
laserImg.src = 'assets/img/laser.png';
const projectileImg = new Image();
projectileImg.src = 'assets/img/projectile.png';
const enemyImg = new Image();
enemyImg.src = 'assets/img/hydra.png';
const bgImg = new Image();
bgImg.src = 'assets/img/bg3.png';
const hudImg = new Image();
hudImg.src = 'assets/img/hud1.png';

//sounds
const laserSnd = new Audio();
laserSnd.src = 'assets/sound/laser3.mp3';
laserSnd.volume = SFXVol + 0.1;
// laserSnd.playbackRate = 1;
const laser2Snd = new Audio();
laser2Snd.src = 'assets/sound/laser6.mp3';
laser2Snd.volume = SFXVol;

const killSound = new Audio();
killSound.src = 'assets/sound/boom.wav';
killSound.playbackRate = 0.5;
// console.log(laserSnd.volume);

const shieldUpSnd = new Audio();
shieldUpSnd.src = 'assets/sound/shieldUp.wav';
const shieldDownSnd = new Audio();
shieldDownSnd.src = 'assets/sound/shieldDown.wav';

const menuOpenSnd = new Audio();
menuOpenSnd.src = 'assets/sound/ui/Click_Electronic_14.mp3';
const menuCloseSnd = new Audio();
menuCloseSnd.src = 'assets/sound/spaceTrash2.mp3';
const repairSnd = new Audio();
repairSnd.src = 'assets/sound/ui/Click_Electronic_10.mp3';


const bgm1 = new Audio();
bgm1.src = 'assets/sound/Phantom from Space.mp3';
bgm1.volume = musicVol;
const bgm2 = new Audio();
bgm2.src = 'assets/sound/Space Fighter Loop.mp3';
bgm2.volume = 0.2;




// click to start game
ctx.fillStyle = 'rgb(0,220,220)';
ctx.font = '100px Papyrus';
ctx.fillText('Space Defender', canvas.width/2 - 500, canvas.height/2);
ctx.font = '50px Papyrus';
ctx.fillText('click anywhere to start!', canvas.width/2 - 100, canvas.height/2 + 100)
ctx.font = '20px arial';
ctx.fillText('Created by MKCodelab. Music by Amazing Kevin McLeod', 20, canvas.height - 100);
addEventListener('click', ()=>{
    if (!gameOn){
        loop();
        bgm1.play();
        gameOn = true;
    }
    
});


// BASE OF THE CANNON
const base = {
    size: 128,
    x: canvas.width/2,
    y: canvas.height/2,
    maxHp: 1000,
    hp: 1000,
    maxEnergy: 1000,
    energy: 1000,
    // energy recharge 
    recharge: 0.5,
    // tarcza musi spowalniac wrogow, i zadawac obrazenia
    shieldEnergyUsage: 0.5,
    skillActive: false,
    shieldRadius: 100,
    draw: function() {
        if (debug) {
            ctx.strokeStyle = 'lime'
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size/2, 0, Math.PI *2);
            ctx.stroke();
            ctx.closePath();
        }
        ctx.drawImage(baseImg, this.x-this.size/2, this.y-this.size/2, this.size, this.size);
    },
    // zrob dwie funkcje on i off, zeby to mialo rece i nogi
    drawShield(){
        if(this.skillActive ){
            ctx.strokeStyle = 'rgba(20,200,255, 0.2)';
            ctx.fillStyle = 'rgba(20,200,255,0.1)';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.shieldRadius, 0, Math.PI*2);
            ctx.stroke();
            ctx.fill();
            ctx.closePath();
          
        }
    },
    update(){
        // dodaj tutaj % fps 
        if (this.energy < this.maxEnergy) {
            this.energy += this.recharge;
        }
        if(this.skillActive){
            this.energy -= this.shieldEnergyUsage;
        }
    }
}
// CANNON TURRET =============================
const cannon = {
    size: 50,
    name: 'Valkyrie XT-8',
    x: base.x + 25,
    y: base.y + 25,
   
    angle: 0,
    power: 100,
    projectileSize: 10,
    // time between each shot
    reload: 20,
    // projectile velocity
    speed: 30,
    spread: 0.5,
    shooting: false,
    trail: true,
    trailSize: 10,
    // energy recuperation
    eneRec: 2,
    energyConsumption: 0,
    description: 'Powerful cannon that shoots dense plasma projectiles via magnetic repulsion',
    draw: function(){
        if (debug) {
            ctx.strokeStyle = '#555';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI *2);
            ctx.stroke();
            ctx.closePath();
        }
        ctx.save();
        ctx.translate(this.x - this.size/2, this.y - this.size/2);
        ctx.rotate(mouse.angle * Math.PI / 180);
        ctx.drawImage(cannonImg, 0- 64, 0 - 64, 128, 128);
        ctx.restore();
    },
    calcEnergyConsumption(){
        this.energyConsumption = this.power/10 - this.eneRec;
    },
    calcTrailSize(){
        this.trailSize = this.power/10;
    }
}
// MOUSE AND CROSSHAIR
const mouse = {
    x: 0,
    y: 0, 
    size: 32,
    angle : 0,
    // crosshair / reticle
    draw: function(){
       
        let centerX = this.x - this.size/2;
        let centerY = this.y - this.size/2;
        ctx.drawImage(crosshairImg, centerX, centerY, this.size, this.size);
    }
}

// LASER =========================
class Laser {
    constructor(x, y, dx, dy) {
        this.x = x;
        this.y = y;
        this.color = 'rgba(50,150,255,1)';
        // change this size from hardcoded to value from the cannon
        this.size = cannon.projectileSize;
        // this.size = 32;
        this.image = projectileImg;
        this.dx = dx;
        this.dy = dy;
        this.angle = mouse.angle;
        // this.sound = new Audio();
        // this.sound.src = 'assets/sound/laser2.mp3';
    }
    update() {
        
        this.x += this.dx;
        this.y += this.dy;
        // this.size -= 0.2;
    }
    draw() {
        // drawing hitbox
        if (debug){
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI *2);
            ctx.stroke();
            ctx.closePath();
        }
        //drawing projectile
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle * Math.PI / 180);
        
        ctx.drawImage(this.image, -this.size, -this.size*3.5, this.size*2, this.size*4);
        ctx.restore();
    }
    
}
// emitter
class LaserTrail {
    constructor(x, y, dx, dy){
        this.x = x;
        this.y = y;
        this.drag = 1;
        this.dx = dx * this.drag;
        this.dy = dy * this.drag;
        this.size = Math.random() * 10 + 1;
        this.lifespan = 0;
    }
    update(){
        this.lifespan ++;
        this.x += this.dx;
        this.y += this.dy; 
    }
    emit(){
       laserParticleArray.push(new LaserParticle(this.x, this.y))
    }
}
// laser trail particles
class LaserParticle {
    constructor(x, y){
        this.x = x;
        this.y = y;
        this.size = cannon.trailSize;
        this.lifespan = 0;
        this.color = 'rgba(50,200,255,0.1)'
        
    }
    update(){
        
        this.size -= 0.5;
        this.lifespan ++;
        
    }
    draw(){
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y , this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.closePath();
    }
}
// projectile array
const laserArray = [];
// emitters array
const laserTrailArray = [];
// particles from emitter
const laserParticleArray = [];
// LASER =======================================

// COLLISIONS INSIDE


function handleLaser() {
    let l = laserArray;
    let e = enemyArray;
 
    // update & draw
    for (i = 0; i < l.length; i++) {
        l[i].update();
        l[i].draw();
    }
    // collision with walls and splicing array
    for (let i = 0; i < l.length; i++) {
         if(l[i].x < 0 ||
            l[i].x > canvas.width ||
            l[i].y < 0 ||
            l[i].y > canvas.height) {
            l.splice(i, 1);
        }
    }
    // check for collisions between laser and enemies
    for (let i = 0; i < l.length; i++) {
        let laser = l[i];
        for (let j = 0; j < e.length; j++) {
            let enemy = e[j];

            let dx = enemy.x - laser.x;
            let dy = enemy.y - laser.y;
            let dist = Math.sqrt(dx*dx + dy*dy);
            let sumOfRadii = laser.size + enemy.size;

            if ( dist < sumOfRadii) {
                //true
                // dmg calc
                let dmg = Math.random()*cannon.power + cannon.power/2;
                enemy.hp -= dmg;

                // pushing enemies when hit
                let randomDirX = Math.random() * 2 + 1;
                let randomDirY = Math.random() * 2 + 1;
                // let sign = Math.random() > 0.5 ? -1 : 1;
                // directions 
                if (enemy.x < base.x && enemy.y < base.y) {
                    enemy.x -= randomDirX;
                    enemy.y -= randomDirY;
                } else if (enemy.x > base.x && enemy.y < base.y) {
                    enemy.x += randomDirX;
                    enemy.y -= randomDirY;
                } else if (enemy.x > base.x && enemy.y > base.y) {
                    enemy.x += randomDirX;
                    enemy.y += randomDirY;
                } else {
                    enemy.x -= randomDirX;
                    enemy.y -= randomDirY;
                }
                
                // l.splice(laser, 1);
                l.splice(laser, 1);
                // usuwa
                laserTrailArray.splice(i, 1);
                // dodaj ten efekt uderzenia
                // w klasie enemy stworz metode drawHit albo cos
                // tu wywołaj enemy.drawHit();
            
            } 
        }
    }
    
}
function handleLaserTrail(){
    let l = laserTrailArray;
    for (let i = 0; i < l.length; i++) {
        if(cannon.trail && l[i].lifespan < 50){
            l[i].update();
            l[i].emit();
        }
        if (l[i].lifespan >= 50) l.splice(i, 1);
    }
}
function handleLaserParticles() {
    let l = laserParticleArray;
    for (let i = 0; i < l.length; i++) {
        if (l[i].size > 0.1 ){
            l[i].draw();
        }
        // if po to by nie bylo errora zwiazanego z negatywnym radiusem
        // w metodzie draw
        // dlatego nie dzialalo bo update byl w ifie, i nigdy sie
        // do konca nie spelnial, dlatego nie spliceowało 
        l[i].update();
        if (l[i].lifespan >= 50) l.splice(i, 1); 
    }
}

// IMMA FIRIN MA LAZAAAAAH!!!!!!! ============================
function laserSound() {
// bass laser xd
laserSnd.pause();
laserSnd.playbackRate = 0.2;
laserSnd.currentTime = 0.1;
laserSnd.play();
// violin laser xd
laser2Snd.pause();
laser2Snd.currentTime = 0.09;
laser2Snd.playbackRate = 1;
laser2Snd.play();
}

function shoot() {
    if (cannon.shooting){
        if (frame % cannon.reload === 0 && base.energy > 0) {
            
            laserSound();
            // centerpoint of the mouse
            let p1x = mouse.x
            let p1y = mouse.y
            // centerpoint of the cannon turret
            let p2x = cannon.x - cannon.size/2;
            let p2y = cannon.y - cannon.size/2;
        
            let vx = p2x - p1x;
            let vy = p2y - p1y;
        
            let dist = Math.sqrt(vx * vx + vy * vy);
            let dx = vx/dist
            let dy = vy/dist
            dx *= -cannon.speed;
            dy *= -cannon.speed;
        // x & y coords of the laser projectile starting point
            let x = cannon.x - cannon.size/2;
            let y = cannon.y - cannon.size/2;
            laserArray.push(new Laser(x, y, dx, dy));
            laserTrailArray.push(new LaserTrail(x, y, dx, dy));
            base.energy -= cannon.energyConsumption;
            // console.log(laserParticleArray);
        }
    }
}

// shooting on mousedown
addEventListener('mousedown', (e)=>{
    if(e.button == '0'){
        cannon.shooting = true
    }
    if(e.button == '2' && base.energy > 0){
        base.skillActive = true;
        console.log('shield activated')
        shieldUpSnd.pause();
        shieldUpSnd.currentTime = 0;
        shieldUpSnd.play();
    }
});
// turning off the contextmenu on rmbclick
addEventListener('contextmenu',e=>e.preventDefault());

addEventListener('mouseup', (e)=>{

    if(e.button == '0') {
        cannon.shooting = false;
    }
    if(e.button == '2') {
        base.skillActive = false;
        console.log('shield deactivated')
        shieldDownSnd.pause();
        shieldDownSnd.currentTime = 0;
        shieldDownSnd.play();
    }
})

// handling rotation of cannon and its coordinates
addEventListener('mousemove', function(e){
    let p1x = mouse.x = e.clientX;
    let p1y = mouse.y = e.clientY;
    let p2x = cannon.x;
    let p2y = cannon.y;
    // angle in radians
    let angle = Math.atan2(p1x - p2x, p1y - p2y) * 180 / Math.PI;
    mouse.angle = -angle;

});

// ==========================================================

// ENEMIES --------------------------------------
class Enemy {
    constructor(x, y,) {
        this.size = Math.floor(Math.random()*30 + 10);
        this.x = x;
        this.y = y;
        this.dx = 0;
        this.dy = 0;
        this.speed = enemySpeedModifier / this.size;
        this.color = 'red';
        this.hp = this.size * enemyHpModifier;
        this.credits = Math.floor(Math.random() * 100 + 20);
        this.angle = 0;
    }
    update() {
// enemy movement towards the cannon / base
        let p1x = this.x;
        let p1y = this.y;
        let p2x = base.x;
        let p2y = base.y;

        let vx = p2x - p1x;
        let vy = p2y - p1y;

        let dist = Math.sqrt(vx * vx + vy * vy);
        let dx = vx/dist
        let dy = vy/dist
        // let spd = this.speed;
        dx *= this.speed;
        dy *= this.speed;
        this.dx = dx;
        this.dy = dy;
        // zamieniony punkt 1 z punktem 2, bo musza sie obracac
        // wzgledem srodka base
        this.angle = Math.atan2(p1y - p2y,p1x - p2x) * 180 / Math.PI;

        let halfBase = base.size/2
        let sumOfRadii = this.size + base.size/2;

        //collision between base and enemy if enemy hitbox is circle

        if (sumOfRadii > dist) {
            this.dx = 0;
            this.dy = 0;
            base.hp -= 0.1;
        } else {
            this.x += this.dx;
            this.y += this.dy;
        }
    }
    draw() {
        let centerX = this.x - this.size/2;
        let centerY = this.y - this.size/2;
        if (debug) {
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI*2);
            ctx.stroke();
            ctx.closePath();
        }
        ctx.save();
        ctx.translate(this.x, this.y);
        // * Math.PI / 180
        ctx.rotate(this.angle * Math.PI /180);
        ctx.drawImage(enemyImg, -this.size, -this.size, this.size*2, this.size*2);
        ctx.restore();
    }
    drawExplosion(){
        explosionArray.push(new Explosion(this.x, this.y, this.size/2))
    }
    // drawJet(){
    // tu rysuj jeta od statków za nimi itp, w ten sam
    // sposob mozesz robic efekty do pociskow
    // }
}
// explosion
class Explosion {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.opacity = 0.2;
        this.sat = 100;
    }
    update() {
        this.radius +=10;
        this.opacity -= 0.02;
        this.sat -= 5;
    }
    draw() {
        if (this.opacity > 0){
            let q = 10
            for (let i = 0; i < q; i++){
               
                ctx.fillStyle = `hsla(200, ${this.sat}%, 60%, ${this.opacity})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
                ctx.fill();
                ctx.closePath();
            }
           
        }
    }
}
const explosionArray = []
function handleExplosions() {
    let e = explosionArray;
    for (let i = 0; i < e.length; i++) {
        e[i].update();
        e[i].draw();
        if(e[i].opacity <= 0) e.splice(i, 1);
    }

}

// nie wiem czemu to nie dziala...
// wsadz to do handle enemies
function handleCollisionBetweenEnemies(){
    let e = enemyArray;
    for (let i = 0; i < e.length; i++) {
        let enemy1 = e[i];
        for (let j = 0; j < e.length; j++) {
            let enemy2 = e[j];

            let dx = enemy2.x - enemy1.x;
            let dy = enemy2.y - enemy1.y;

            let dist = Math.sqrt(dx*dx + dy*dy);
            let sumOfRadii = enemy1.size + enemy2.size;
            
            if (dist < sumOfRadii){
                // collide
                // console.log('collision')
                // e[i].x -=1;
                // e[i].y -=1;

                // e[j].x -=1;
                // e[j].y -=1;
            }

        }
    }
}
class Boss {
    constructor(x, y){
        this.x = x;
        this.y = y;
        this.size = 100;
        this.dx = 0;
        this.dy = 0;
        this.speed = 5;
        this.hp = Math.random() * 100 + 500;
        this.shield = 100;
        this.credits = 2000;

    }
    update(){
        // flying pattern and logic
            this.x += this.dx;
            this.y += this.dy;
        // shooting
        
    }
    draw(){
        ctx.fillStyle = 'orange'
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI*2);
        ctx.fill();
        ctx.closePath();
    }
}
const bossArray = [];
function spawnBoss(q) {
    for (let i = 0; i < q; i++) {
        let x = Math.random() * canvas.width;
        let y = Math.random() * canvas.heigth;
        bossArray.push(new Boss(x, y));
    }
}
function handleBoss(){
    for (let i = 0; i < bossArray.length; i++){
        bossArray[i].update();
        bossArray[i].draw();
    }
}

// enemy array and function to populate it
const enemyArray = [];
// respawn engine =============================================
function addEnemies(q) {
    for (let i = 0; i < q; i++) {
        
        let signX = Math.random() > .5 ? -1 : 1;
        let signY = Math.random() > .5 ? -1 : 1;
        let w = canvas.width;
        let h = canvas.height;
        let x = (Math.random() *w*2 + w/2) * signX;
        let y = (Math.random() *h*2 + h/2) * signY;
        enemyArray.push(new Enemy(x, y));
    }
}

let enemyCount = 20;
let wave = 0;
function respawn() {
    let q = Math.random() * enemyCount + enemyCount/2;
    addEnemies(q)
    enemyCount+=5;
    wave++;
    console.log('wave '+wave)
    if(wave == 10) {
        clearInterval(spawnTimer);
        console.log('end')
    }
}
respawn();
let spawnTimer = window.setInterval(respawn, 50000)

// killing enemies etc
// render and delete
function handleEnemies() {
    let e = enemyArray;
    for (let i = 0; i < e.length; i++){
        // draw only when hp is more than 0
        // in other words, kill :D
        if (e[i].hp > 0) {
            e[i].update();
            e[i].draw();
        } else {
            credits += e[i].credits;
            killSound.pause();
            killSound.currentTime = 0;
            killSound.play();
            // explo effect
            e[i].drawExplosion();
            // cyferki
            drawText(e[i].x, e[i].y, 'violet', 25, `+ ${e[i].credits}`);
            // removing dead enemy from array
            e.splice(i, 1);
        }
    }
}
// stats displayed
function drawStats() {
    // banner width
    // replace it with graphics
    let font = 'Audiowide';
    let w = 600;
    let center = canvas.width/2
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(center - w/2, 0, w, 80);
    // ctx.drawImage(hudImg, center - w/2, 0, w, 80)

    ctx.fillStyle = 'violet';
    ctx.font = `25px ${font}`;
    ctx.fillText(`Credits: ${credits}`, center - 250, 50);
    ctx.fillStyle = 'crimson';
    ctx.fillText(`Base Hull: ${Math.floor(base.hp)}`, center - 100, 50);
    ctx.fillStyle = 'skyblue';
    ctx.fillText(`Energy: ${Math.floor(base.energy)}`, center + 100, 50);
}

// background 
function bg() { 
    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
}
class Text {
    constructor (x, y, col, size, msg){
        this.x = x;
        this.y = y;
        this.col = col;
        this.size = size;
        this.msg = msg;
        this.opacity = 1;
        this.lifespan = 0;
        
    }
    draw(){
        if (this.size > 0.1){
            ctx.globalAlpha = this.opacity;
            ctx.beginPath();
            ctx.font = `${this.size}px Audiowide`;
            ctx.fillStyle = this.col;
            ctx.fillText(this.msg, this.x, this.y);
            ctx.fill();
            ctx.closePath();
            //restoring the opacity of context
            ctx.globalAlpha = 1;
        }
    }
    update() {
        if(this.opacity > 0.01) this.opacity -= 0.01;
        this.y -= 1;
        this.lifespan ++;
        // this.size -= 0.1;
    }
}
// animated text 
function drawText(x, y, col, size, msg) {
    textArray.push(new Text(x, y, col, size, msg))
}

const textArray = []
function handleText(){
    for (let i = 0; i < textArray.length; i++) {
        textArray[i].update();
        textArray[i].draw();
        
        if(textArray[i].lifespan >= 100){
            textArray.splice(i, 1);
        }
    }
}

// GAME OVER
function gameOver() {
    // todo pausing game via cancelanimationframe
    
    if (enemyArray.length == 0) {
        ctx.font = '50px Audiowide'
        ctx.fillStyle = 'gold';
        ctx.fillText('VICTORY', canvas.width/2 - 20, canvas.height/2);
    }
    if (base.hp <= 0) {
        ctx.font = '50px Arial';
        ctx.fillStyle = 'red';
        ctx.fillText('Your base is destroyed... DEFEAT!',
         canvas.width/2 - 20, canvas.height/2);
        // cancelAnimationFrame(game)
        // nie dziala
        for (let i = 0; i < enemyArray.length; i++){
            enemyArray[i].dx *= -1;
            enemyArray[i].dy *= -1;
        }
        bgm1.pause();

    }
}
// let game = requestAnimationFrame(loop);
function loop() {
    ctx.imageSmoothingEnabled = false;
    frame++;
    
    bg();
    base.draw();
    base.update();
    handleText();
    cannon.calcEnergyConsumption();
    cannon.calcTrailSize();
    handleEnemies();
    // handleCollisionBetweenEnemies();
    handleLaser();
    handleLaserTrail();
    handleLaserParticles();
    handleExplosions();
    shoot();
    cannon.draw();
    base.drawShield();
    mouse.draw();
    drawStats();
    gameOver();
    // console.log(laserParticleArray, laserTrailArray)
    // game = requestAnimationFrame(loop)
    requestAnimationFrame(loop)
    
}
// loop();




// UI ==========================================================



const menu = document.querySelector('.menu');

addEventListener('keydown', function(e){
    if(e.key === 'm' || e.key === 'i'){
        menu.classList.toggle('off');
        // checks if upgrade menu contains off class to toggle it off
        //  when pressed menu button
        if(!upgradesMenu.classList.contains('off')){
            upgradesMenu.classList.toggle('off')
        }
        menuOpenSnd.pause();
        menuOpenSnd.currentTime = 0;
        menuOpenSnd.play();
    };
});
function playRepairSnd(){
    repairSnd.pause();
    repairSnd.currentTime = 0;
    repairSnd.play();
}

function repair() {
    // let cost = Math.floor(base.maxHp - base.hp) * 2;
    let cost = 100;
    if (credits > cost){
        credits -= cost;
        
        // base.hp = base.maxHp;
        base.hp += cost;
        if(base.hp > base.maxHp) base.hp = base.maxHp;
        playRepairSnd();
    }
}

const repairBtn = document.querySelector('#repairBtn').addEventListener('click', repair)

const upgradesBtn = document.querySelector('#upgradesBtn');
upgradesBtn.addEventListener('click', openUpgrades);
const upgradesMenu = document.querySelector('#upgradesMenu');
function openUpgrades(){
    menuOpenSnd.pause();
    menuOpenSnd.currentTime = 0;
    menuOpenSnd.play();
    upgradesMenu.classList.toggle('off');
}
//  UPGRADES ======================================
document.querySelector('#firepowerUp').addEventListener('click', upgradeFirepower);
function upgradeFirepower() {
    let cost = cannon.power * 5;
    const firepowerCost = document.querySelector('#firepowerCost');
    if (credits >= cost) {
        cannon.power += 20;
        cannon.projectileSize ++;
        firepowerCost.innerText = cost;
        credits -= cost;
        console.log(`Firepower Upgraded! Cost: ${cost}, power: ${cannon.power}`)
        playRepairSnd();
        
    }
}
document.querySelector('#reloadUp').addEventListener('click', upgradeReload)
function upgradeReload(){
    let cost = 1000;
    const reloadCost = document.querySelector('#reloadCost');
    if (credits >= cost) {
        cannon.reload --;
        reloadCost.innerText = cost;
        credits -= cost;
        playRepairSnd();
    }
}
document.querySelector('#hullUp').addEventListener('click', upgradeHull);
function upgradeHull(){
    let cost = 2000;
    if (credits >= cost){
        base.maxHp = 2000;
        base.hp = 2000;
        credits -= cost;
        playRepairSnd();
    }
}
document.querySelector('#eneCapUp').addEventListener('click', upgradeEneCap);
function upgradeEneCap(){
    let cost = 2000;
    if (credits >= cost) {
        base.maxEnergy += 1000;
        base.energy = base.maxEnergy;
        credits -= cost;
        playRepairSnd();
    }
}


// injecting calculated costs
function calcUpgradeCosts() {

}