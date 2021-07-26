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
let SFXVol = 0.1;
let musicVol = 0.1;
let uiVol = 0.1;
let gameOn = false;
let gamePaused = false;
// in future make player object and put all that inside
let enemySpeedModifier = 20;
let enemyHpModifier = 15;
let enemyDmgModifier = 0.5;
let credits = 0;
let level = 1;
// showing hitboxes
let debug = false;

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
const enemy2Img = new Image();
enemy2Img.src = 'assets/img/ogre.png';
const bgImg = new Image();
bgImg.src = 'assets/img/Starset.png';
const hudImg = new Image();
hudImg.src = 'assets/img/hud1.png';

//sounds
const laserSnd = new Audio();
laserSnd.src = 'assets/sound/laser3.mp3';
laserSnd.volume = SFXVol;
// laserSnd.playbackRate = 1;
const laser2Snd = new Audio();
laser2Snd.src = 'assets/sound/laser6.mp3';
laser2Snd.volume = SFXVol;

const killSound = new Audio();
killSound.src = 'assets/sound/boom.wav';
killSound.playbackRate = 0.5;
killSound.volume = SFXVol;
// console.log(laserSnd.volume);

const shieldUpSnd = new Audio();
shieldUpSnd.src = 'assets/sound/shieldUp.wav';
const shieldDownSnd = new Audio();
shieldDownSnd.src = 'assets/sound/shieldDown.wav';

const menuOpenSnd = new Audio();
menuOpenSnd.src = 'assets/sound/ui/Click_Electronic_14.mp3';
menuOpenSnd.volume = uiVol;
const menuCloseSnd = new Audio();
menuCloseSnd.src = 'assets/sound/spaceTrash2.mp3';
const repairSnd = new Audio();
repairSnd.src = 'assets/sound/ui/Click_Electronic_10.mp3';
repairSnd.vol = uiVol;

//BGM

const bgm1 = new Audio();
bgm1.src = 'assets/sound/Phantom from Space.mp3';
bgm1.volume = musicVol;
const bgm2 = new Audio();
bgm2.src = 'assets/sound/Space Fighter Loop.mp3';
bgm2.volume = musicVol;

// todo 
// some music engine


// click to start game
ctx.fillStyle = 'rgb(0,220,220)';
ctx.font = '100px Papyrus';
ctx.fillText('Space Defender', canvas.width/2 - 500, canvas.height/2);
ctx.font = '50px Papyrus';
ctx.fillText('click anywhere to start!', canvas.width/2 - 100, canvas.height/2 + 100)
ctx.font = '20px arial';
ctx.fillText('LMB to shoot, RMB for shield, Esc to pause, M to open Menu', 20, canvas.height/2 + 200)
ctx.fillText('Created by MKCodelab. Music by Amazing Kevin MacLeod', 20, canvas.height - 100);
// start a game
addEventListener('click', ()=>{
    if (!gameOn){
        loop();
        bgm2.play();
        gameOn = true;
        respawn();
        spawnTimer = setInterval(respawn, 50000);
    }
    // init spawn engine here
    

});


// BASE OF THE CANNON
const base = {
    // size: 128,
    size: Math.floor(canvas.height/10),
    x: canvas.width/2,
    y: canvas.height/2,
    maxHp: 1000,
    hp: 1000,
    maxEnergy: 1000,
    energy: 1000,
    // energy recharge 
    recharge: 0.5,
   
// shield
    shieldEnergyUsage: 1,
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
        // decrementing energy by hit, stopping enemies from 
        // getting too close
        // or slowing enemies down? 
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
    },
    // calculate x y and size (after resize ev)
    calcXYS() {
        this.x = canvas.width/2;
        this.y = canvas.height/2;
        this.size = Math.floor(canvas.height/10);
    }
}

// CANNON TURRET =============================
const cannon = {
    // size: 50,
    size: Math.floor(canvas.height/10),
    name: 'Valkyrie XT-8',
    // 25 magic number XD
    x: base.x,
    y: base.y,
   
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
        ctx.translate(this.x , this.y );
        ctx.rotate(mouse.angle * Math.PI / 180);
        ctx.drawImage(cannonImg, 0- this.size/2, 0 - this.size/2, this.size, this.size);
        ctx.restore();
    },
    calcEnergyConsumption(){
        this.energyConsumption = this.power/10 - this.eneRec;
    },
    calcTrailSize(){
        this.trailSize = this.power/10;
    },
    calcXYS(){
        this.x = base.x;
        this.y = base.y;
        this.size = Math.floor(canvas.height/10);
    }
    
}
// calculating x, y, size after resize
addEventListener('resize', ()=>{
    base.calcXYS();
    cannon.calcXYS();
});
// MOUSE AND CROSSHAIR
const mouse = {
    x: 0,
    y: 0, 
    size: 32,
    angle : 0,
    rotation: 0,
    // crosshair / reticle
    draw: function(){
       
        let centerX = this.x - this.size/2;
        let centerY = this.y - this.size/2;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation * Math.PI/2);
        ctx.drawImage(crosshairImg, 0 - this.size/2, 0 - this.size/2, this.size, this.size);
        ctx.restore();
    },
    update: function() {
        // optional ??
        this.rotation += 0.01;
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
// addGold(10000);
// laser trail particles
class LaserParticle {
    constructor(x, y){
        this.x = x;
        this.y = y;
        this.size = cannon.trailSize/2 + Math.random()* cannon.trailSize/5;
        this.lifespan = 0;
        this.color = 'hsla(180, 100%, 80%, 0.7)';
        this.shadowColor = 'hsl(190, 100%, 60%)';
        this.wobble = Math.floor(Math.random() * 5 + 1);
        this.fading = Math.random();
        
    }
    update(){
        // wobbling left / right
        let PoM = Math.random() < .5 ? -1 : 1;
        // fading
        this.size -= 0.5;
        // movement with wobble
        this.x += Math.random() * this.wobble * PoM;
        this.y += Math.random() * this.wobble * PoM;
        this.lifespan ++;
        
    }
    draw(){
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.shadowColor = this.shadowColor;
            ctx.shadowBlur = 10;
            ctx.arc(this.x, this.y , this.size/2, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
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
// i know i know... lasers don't makes sounds, especially in vacuum of space.
// say it to George L... :D

function laserSound() {
// bass laser xd
laserSnd.pause();
laserSnd.volume = SFXVol;
laserSnd.playbackRate = 0.5;
laserSnd.currentTime = 0;
laserSnd.play();
// violin laser xd
laser2Snd.pause();
laser2Snd.volume = SFXVol;
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
            let p2x = cannon.x;
            let p2y = cannon.y;
        
            let vx = p2x - p1x;
            let vy = p2y - p1y;
        
            let dist = Math.sqrt(vx * vx + vy * vy);
            let dx = vx/dist
            let dy = vy/dist
            dx *= -cannon.speed;
            dy *= -cannon.speed;
        // x & y coords of the laser projectile starting point
            let x = cannon.x ;
            let y = cannon.y ;
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

// pausing the game with escape key
const pauseScreen = document.querySelector('#pauseScreen');
addEventListener('keydown', (e)=> {
   if (e.key === 'Escape')  {
    gamePaused = !gamePaused;
    if(gamePaused){
        clearInterval(spawnTimer);
        console.log('spawnTimer Cleared')
    }
    if (!gamePaused){
        spawnTimer = setInterval(respawn, timeToNext)
        console.log('spawnTimer Started')
    }
    console.log(gamePaused)
    loop();
    pauseScreen.classList.toggle('pause-off')
   }
   
})

// ==========================================================

// ENEMIES --------------------------------------
// todo:
// add some sprites
// add randomized sprites based on enemy size / hp / lvl ?
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
        this.dmg = (Math.random() * 5 + 2) * enemyDmgModifier;
        this.img = enemyImg;
    }
    update() {
        //change img
        if (this.size >= 30) this.img = enemy2Img;
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
            // zerowanie hp
            if (base.hp <= 0){
                base.hp = 0;
                // modulo frame zeby nie odejmowalo hp z klatkami
            }else if (base.hp >= 0 && frame % 20 == 0) {
                // tu wstaw modyfikator obrazen przeciwnika
                base.hp -= this.dmg;
            }

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
        ctx.drawImage(this.img, -this.size, -this.size, this.size*2, this.size*2);
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
        this.angle = 0;
        this.hp = Math.random() * 100 + 500;
        this.shield = 100;
        this.credits = 2000;

    }
    update(){
        // flying pattern and logic
            this.x += this.dx;
            this.y += this.dy;
            // atan and things
        // shooting
        
    }
    draw(){
        if(debug){
            ctx.fillStyle = 'orange'
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI*2);
            ctx.stroke();
            ctx.closePath();
        }
        // rotating and other things
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle * Math.PI /180);
        ctx.drawImage(enemy2Img, this.x, this.y, this.size, this.size);
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


// respawn engine =============================================



// enemy array and function to populate it
const enemyArray = [];
function addEnemies(q) {
    for (let i = 0; i < q; i++) {
        
        let signX = Math.random() > .5 ? -1 : 1;
        let signY = Math.random() > .5 ? -1 : 1;
        // respawn site
        let w = canvas.width;
        let h = canvas.height;
        let x = (Math.random() *w*2 + w/2) * signX;
        let y = (Math.random() *h*2 + h/2) * signY;
        enemyArray.push(new Enemy(x, y));
    }
}
// globals for respawn engine
let enemyCount = 20;
let wave = 0;
let maxWave = 5;
// time to next wave
let timeToNext = 50000;
let spawnTimer;

function respawn() {
    let q = Math.random() * enemyCount + enemyCount/2;
    addEnemies(q)
    enemyCount+=5;
    wave++;
    console.log('wave '+wave)
    // nie ma dostepu do textArray
    // drawText(canvas.width/2, canvas.height/2, 'skyblue', 50, `Get ready for next wave`)
    if(wave == maxWave) {
        console.log('end')
        clearInterval(spawnTimer);
    }
    console.log('enemies spawned')

}

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
            drawText(e[i].x, e[i].y, 'violet', 15, `+ ${e[i].credits}`);
            // removing dead enemy from array
            e.splice(i, 1);
        }
    }
}
// stats displayed
function drawStats() {
    // replace it with graphics
    // or maybe not?
    let font = 'Audiowide';
    let size = 15;
    // banner width
    let w = 600;
    let center = canvas.width/2
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(center - w/2, 0, w, 80);
    
    ctx.fillStyle = 'white';
    ctx.font = `${size}px ${font}`;
    ctx.shadowBlur = 7;
    ctx.lineWidth = 2;
    // credits
    ctx.strokeStyle = 'violet';
    ctx.shadowColor = 'violet';
    ctx.strokeText(`Credits: ${credits}`, center - 250, 50);
    ctx.fillText(`Credits: ${credits}`, center - 250, 50);
    // base hp
    ctx.strokeStyle = 'crimson';
    ctx.shadowColor = 'crimson';
    ctx.strokeText(`Base Hull: ${Math.floor(base.hp)}`, center - 100, 50);
    ctx.fillText(`Base Hull: ${Math.floor(base.hp)}`, center - 100, 50);
    // energy
    ctx.strokeStyle = 'skyblue';
    ctx.shadowColor = 'skyblue';
    ctx.strokeText(`Energy: ${Math.floor(base.energy)}`, center + 100, 50);
    ctx.fillText(`Energy: ${Math.floor(base.energy)}`, center + 100, 50);
    ctx.shadowBlur = 0;

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
            ctx.shadowColor = this.col;
            ctx.shadowBlur = 7;
            ctx.lineWidth = 2;
            ctx.strokeStyle = this.col;
            ctx.strokeText(this.msg, this.x, this.y);
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'white';
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
        this.size += 0.1;
    }
}
// animated text 
//  w sumie troche zbedna ta funkcja ale opakowuje
// pusha
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
        ctx.font = '50px Audiowide';
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
        if(gamePaused) return;
        bg();
        base.draw();
        base.update();
        handleText();
        // cannon.calcEnergyConsumption();
        // cannon.calcTrailSize();
        handleEnemies();
        // handleCollisionBetweenEnemies();
        handleLaserTrail();
        handleLaserParticles();
        handleLaser();
        handleExplosions();
        shoot();
        cannon.draw();
        base.drawShield();
        // mouse.update();
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
function playMenuOpenSnd() {
    menuOpenSnd.pause();
    menuOpenSnd.currentTime = 0;
    menuOpenSnd.play();
}
addEventListener('keydown', function(e){
    if(e.key === 'm' || e.key === 'i'){
        menu.classList.toggle('off');
        // checks if upgrade menu contains off class to toggle it off
        //  when pressed menu button
        if (!upgradesMenu.classList.contains('off')){
            upgradesMenu.classList.toggle('off');
        }
        if (!statsMenu.classList.contains('off')){
            statsMenu.classList.toggle('off');
        }
        if (!optionsMenu.classList.contains('options-off')){
            optionsMenu.classList.toggle('options-off');
        }
        playMenuOpenSnd();
    };
});
function playRepairSnd(){
    repairSnd.pause();
    repairSnd.volume = uiVol;
    repairSnd.currentTime = 0;
    repairSnd.play();
}

function repair() {
    // let cost = Math.floor(base.maxHp - base.hp) * 2;
    let cost = 100;
    if (credits > cost && base.hp != base.maxHp){
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
    playMenuOpenSnd();
    upgradesMenu.classList.toggle('off');
}
//  UPGRADES ======================================
// setting base upgrade cost first
let firepowerUpCost = 500;
document.querySelector('#firepowerUp').addEventListener('click', upgradeFirepower);

function upgradeFirepower() {
    
    const firepowerCost = document.querySelector('#firepowerCost');
    if (credits >= firepowerUpCost) {
        cannon.power += 20;
        cannon.projectileSize ++;
        cannon.calcTrailSize();
        cannon.calcEnergyConsumption();
        credits -= firepowerUpCost;
        firepowerUpCost = Math.floor(firepowerUpCost *1.5);
        firepowerCost.innerText = firepowerUpCost;
        console.log(`Firepower Upgraded! Cost: ${firepowerUpCost}, power: ${cannon.power}`)
        playRepairSnd();
        
    }
}
let reloadUpgradeCost = 1000;
document.querySelector('#reloadUp').addEventListener('click', upgradeReload);

function upgradeReload(){

    const reloadCost = document.querySelector('#reloadCost');
    if (credits >= reloadUpgradeCost && cannon.reload > 5) {
        cannon.reload --;
        credits -= reloadUpgradeCost;
        reloadUpgradeCost = Math.floor(reloadUpgradeCost * 2.5);
        reloadCost.innerText = reloadUpgradeCost;
        if (cannon.reload === 5) {
            reloadCost.innerText = 'Max reload speed'
        }
        playRepairSnd();
    }
}
// hull upgrade

let hullUpCost = 2000;
document.querySelector('#hullUp').addEventListener('click', upgradeHull);

function upgradeHull(){
    
    const hullCost = document.querySelector('#hullCost');
    if (credits >= hullUpCost){
        base.maxHp += 1000;
        base.hp += base.maxHp;
        credits -= hullUpCost;
        hullUpCost = Math.floor(hullUpCost * 2);
        hullCost.innerText = hullUpCost;
        playRepairSnd();
    }
}

let eneCapUpCost = 2000;
document.querySelector('#eneCapUp').addEventListener('click', upgradeEneCap);
function upgradeEneCap(){
    const energyCost = document.querySelector('#energyCost');
    if (credits >= eneCapUpCost) {
        base.maxEnergy += 1000;
        base.energy = base.maxEnergy;
        credits -= eneCapUpCost;
        eneCapUpCost = Math.floor(eneCapUpCost * 1.5);
        energyCost.innerText = eneCapUpCost;
        playRepairSnd();
    }
}

// stats menu
const statsBtn = document.querySelector('#statsBtn');
const statsMenu = document.querySelector('#statsMenu');
statsBtn.addEventListener('click', openStats);
function openStats() {
    statsMenu.classList.toggle('off');
    playMenuOpenSnd();

}
// options menu
const optionsBtn = document.querySelector('#optionsBtn');
const optionsMenu = document.querySelector('#optionsMenu');
optionsBtn.addEventListener('click', openOptionsMenu);
function openOptionsMenu(){
    optionsMenu.classList.toggle('options-off');
    playMenuOpenSnd();
}

const SFXVolInput = document.querySelector('#SFXVolInput');
SFXVolInput.addEventListener('change', () => {
    SFXVol = SFXVolInput.value;
    playMenuOpenSnd();
})
const musicVolInput = document.querySelector('#musicVolInput');
musicVolInput.addEventListener('change', () => {
    bgm2.pause();
    musicVol = musicVolInput.value;
    bgm2.play();
    // hmmm something wrong here
    playMenuOpenSnd();

})
const uiVolInput = document.querySelector('#uiVolInput');
uiVolInput.addEventListener('change', () => {
    musicVol = uiVolInput.value;
    playMenuOpenSnd();

})

function addGold(quantity) {
    credits += quantity;
}

// injecting calculated costs
function calcUpgradeCosts() {

}