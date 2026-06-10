// Game Constants
const GAME_WIDTH = window.innerWidth;
const GAME_HEIGHT = window.innerHeight;
const TILE_SIZE = 40;

// Game States
const GameState = {
    LOADING: 'loading',
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    MISSION: 'mission',
    SHOP: 'shop',
    GAMEOVER: 'gameover'
};

// Weapon Data
const Weapons = {
    fists: { name: 'Fists', damage: 10, range: 30, ammo: -1, fireRate: 200, price: 0 },
    pistol: { name: '9mm Pistol', damage: 25, range: 400, ammo: 30, fireRate: 100, price: 500 },
    smg: { name: 'SMG', damage: 15, range: 300, ammo: 30, fireRate: 50, price: 1000 },
    rifle: { name: 'Rifle', damage: 50, range: 600, ammo: 30, fireRate: 200, price: 2000 },
    shotgun: { name: 'Shotgun', damage: 80, range: 150, ammo: 8, fireRate: 400, price: 1500 }
};

// Shop Items
const ShopItems = [
    { name: 'Health Pack', price: 100, type: 'health' },
    { name: 'Armor', price: 150, type: 'armor' },
    { name: '9mm Ammo', price: 200, type: 'ammo', weapon: 'pistol' },
    { name: 'SMG Ammo', price: 300, type: 'ammo', weapon: 'smg' },
    { name: 'Rifle Ammo', price: 400, type: 'ammo', weapon: 'rifle' },
    { name: 'Shotgun Ammo', price: 350, type: 'ammo', weapon: 'shotgun' }
];

// Missions
const Missions = [
    {
        id: 1,
        name: 'Tutorial Mission',
        description: 'Learn the basics of combat',
        objective: 'Defeat 5 enemies',
        reward: 500,
        enemies: 5,
        location: { x: 300, y: 300 }
    },
    {
        id: 2,
        name: 'Destroy the Rival Gang',
        description: 'Eliminate the opposing gang members',
        objective: 'Defeat 10 enemies',
        reward: 2000,
        enemies: 10,
        location: { x: 800, y: 400 }
    },
    {
        id: 3,
        name: 'Steal the Vehicle',
        description: 'Get to the vehicle and drive to the location',
        objective: 'Reach the destination',
        reward: 3000,
        vehicles: 1,
        location: { x: 1200, y: 600 }
    },
    {
        id: 4,
        name: 'Protect the VIP',
        description: 'Defend the VIP from attackers',
        objective: 'Protect the target for 60 seconds',
        reward: 5000,
        enemies: 15,
        location: { x: 500, y: 800 }
    }
];

// Main Game Class
class Game {
    constructor() {
        console.log('Initializing Game...');
        
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            console.error('Canvas not found!');
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        
        this.canvas.width = GAME_WIDTH;
        this.canvas.height = GAME_HEIGHT;

        this.gameState = GameState.LOADING;
        this.player = null;
        this.entities = [];
        this.projectiles = [];
        this.particles = [];
        this.world = null;
        this.camera = { x: 0, y: 0 };
        this.lastTime = Date.now();
        this.frameCount = 0;
        this.fps = 60;

        this.keys = {};
        this.mousePos = { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 };
        this.isMouseDown = false;

        this.gameTime = 0;
        this.currentMission = null;
        this.completedMissions = [];

        this.initEventListeners();
        this.loadGame();
    }

    initEventListeners() {
        console.log('Setting up event listeners...');
        
        // Keyboard
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            this.handleKeyDown(e);
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        // Mouse
        document.addEventListener('mousemove', (e) => {
            this.mousePos = { x: e.clientX, y: e.clientY };
        });

        document.addEventListener('mousedown', (e) => {
            this.isMouseDown = true;
        });

        document.addEventListener('mouseup', (e) => {
            this.isMouseDown = false;
        });

        // Menu buttons
        const startBtn = document.getElementById('start-game-btn');
        if (startBtn) startBtn.addEventListener('click', () => this.startGame());
        
        const closeShopBtn = document.getElementById('close-shop-btn');
        if (closeShopBtn) closeShopBtn.addEventListener('click', () => this.closeShop());
        
        const closeMissionBtn = document.getElementById('close-mission-btn');
        if (closeMissionBtn) closeMissionBtn.addEventListener('click', () => this.closeMissions());

        console.log('Event listeners initialized');
    }

    handleKeyDown(e) {
        const key = e.key.toLowerCase();

        switch(key) {
            case 'e': // Interact
                this.interact();
                break;
            case 'f': // Enter/Exit Vehicle
                this.toggleVehicle();
                break;
            case 'r': // Reload
                this.reload();
                break;
            case 'h': // Horn
                this.hornSound();
                break;
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
                this.switchWeapon(parseInt(key) - 1);
                break;
            case 'escape':
                this.togglePause();
                break;
            case 'm':
                this.toggleMissions();
                break;
        }
    }

    loadGame() {
        console.log('Loading game...');
        
        // Simulate loading
        let progress = 0;
        const loadingInterval = setInterval(() => {
            progress += Math.random() * 30;
            if (progress >= 100) {
                progress = 100;
                clearInterval(loadingInterval);
                this.updateLoadingBar(progress);
                setTimeout(() => this.showMenu(), 500);
            } else {
                this.updateLoadingBar(progress);
            }
        }, 100);
    }

    updateLoadingBar(progress) {
        const fill = document.getElementById('loading-fill');
        const text = document.getElementById('loading-text');
        if (fill) fill.style.width = progress + '%';
        if (text) text.textContent = 'Loading... ' + Math.floor(progress) + '%';
    }

    showMenu() {
        console.log('Showing menu...');
        
        const loadingScreen = document.getElementById('loading-screen');
        const menuOverlay = document.getElementById('menu-overlay');
        
        if (loadingScreen) loadingScreen.style.display = 'none';
        if (menuOverlay) menuOverlay.style.display = 'flex';
        
        this.gameState = GameState.MENU;
    }

    startGame() {
        console.log('Starting game...');
        
        const menuOverlay = document.getElementById('menu-overlay');
        if (menuOverlay) menuOverlay.style.display = 'none';
        
        this.gameState = GameState.PLAYING;
        
        if (!this.world) {
            this.initWorld();
        }
    }

    initWorld() {
        console.log('Initializing world...');
        
        // Create game world
        this.world = new World();
        
        // Create player (CJ style character)
        this.player = new Player(this.world.width / 2, this.world.height / 2);
        this.entities.push(this.player);

        // Spawn some NPCs and enemies
        this.spawnNPCs();
        
        console.log('Starting game loop...');
        this.startGameLoop();
    }

    spawnNPCs() {
        // Spawn random NPCs
        for (let i = 0; i < 10; i++) {
            const x = Math.random() * this.world.width;
            const y = Math.random() * this.world.height;
            const npc = new NPC(x, y);
            this.entities.push(npc);
        }

        // Spawn vehicles
        for (let i = 0; i < 5; i++) {
            const x = Math.random() * this.world.width;
            const y = Math.random() * this.world.height;
            const vehicle = new Vehicle(x, y, 'car');
            this.entities.push(vehicle);
        }
    }

    startGameLoop() {
        const gameLoop = () => {
            const now = Date.now();
            const deltaTime = Math.min((now - this.lastTime) / 1000, 0.016); // Cap at 60fps
            this.lastTime = now;

            if (this.gameState === GameState.PLAYING) {
                this.update(deltaTime);
                this.render();
                this.updateHUD();
            }

            this.frameCount++;
            if (this.frameCount % 10 === 0) {
                this.fps = Math.round(1 / deltaTime);
            }

            requestAnimationFrame(gameLoop);
        };

        gameLoop();
    }

    update(deltaTime) {
        if (!this.player || !this.world) return;

        this.gameTime += deltaTime;

        // Update player
        this.player.update(deltaTime, this.keys, this.mousePos, this.isMouseDown, this.world);

        // Update camera to follow player
        this.camera.x = this.player.x - GAME_WIDTH / 2;
        this.camera.y = this.player.y - GAME_HEIGHT / 2;

        // Update entities
        for (let entity of this.entities) {
            if (entity !== this.player) {
                entity.update(deltaTime, this.player, this.world);
            }
        }

        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            this.projectiles[i].update(deltaTime);
            
            // Check collisions
            for (let entity of this.entities) {
                if (entity !== this.player && this.projectiles[i].collidesWith(entity)) {
                    entity.takeDamage(this.projectiles[i].damage);
                    this.projectiles.splice(i, 1);
                    break;
                }
            }

            // Remove if off screen
            if (this.projectiles[i] && (
                this.projectiles[i].x < this.camera.x - 100 ||
                this.projectiles[i].x > this.camera.x + GAME_WIDTH + 100 ||
                this.projectiles[i].y < this.camera.y - 100 ||
                this.projectiles[i].y > this.camera.y + GAME_HEIGHT + 100
            )) {
                this.projectiles.splice(i, 1);
            }
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update(deltaTime);
            if (this.particles[i].life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Remove dead entities
        this.entities = this.entities.filter(e => e.health > 0 || e === this.player);

        // Update HUD elements
        this.updateInteractionPrompt();
        this.updateMissionObjective();
    }

    render() {
        if (!this.ctx) return;

        // Clear canvas
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Draw world
        if (this.world) {
            this.world.render(this.ctx, this.camera);
        }

        // Draw entities
        for (let entity of this.entities) {
            entity.render(this.ctx, this.camera);
        }

        // Draw projectiles
        for (let projectile of this.projectiles) {
            projectile.render(this.ctx, this.camera);
        }

        // Draw particles
        for (let particle of this.particles) {
            particle.render(this.ctx, this.camera);
        }

        // Draw minimap
        this.renderMinimap();
    }

    renderMinimap() {
        const minimapCanvas = document.getElementById('minimap');
        if (!minimapCanvas) return;

        const minimapCtx = minimapCanvas.getContext('2d');
        const scale = 0.5;

        minimapCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        minimapCtx.fillRect(0, 0, minimapCanvas.width, minimapCanvas.height);

        // Draw world bounds
        minimapCtx.strokeStyle = '#FFD700';
        minimapCtx.strokeRect(0, 0, this.world.width * scale, this.world.height * scale);

        // Draw player
        minimapCtx.fillStyle = '#FFD700';
        minimapCtx.fillRect(
            (this.player.x * scale) % minimapCanvas.width,
            (this.player.y * scale) % minimapCanvas.height,
            4, 4
        );

        // Draw entities
        minimapCtx.fillStyle = 'rgba(255, 0, 0, 0.7)';
        for (let entity of this.entities) {
            if (entity !== this.player) {
                minimapCtx.fillRect(
                    (entity.x * scale) % minimapCanvas.width,
                    (entity.y * scale) % minimapCanvas.height,
                    2, 2
                );
            }
        }
    }

    updateHUD() {
        if (!this.player) return;

        // Health & Armor
        const healthFill = document.getElementById('health-fill');
        const healthText = document.getElementById('health-text');
        if (healthFill) healthFill.style.width = (this.player.health / this.player.maxHealth) * 100 + '%';
        if (healthText) healthText.textContent = Math.floor(this.player.health);

        const armorFill = document.getElementById('armor-fill');
        const armorText = document.getElementById('armor-text');
        if (armorFill) armorFill.style.width = (this.player.armor / 100) * 100 + '%';
        if (armorText) armorText.textContent = Math.floor(this.player.armor);

        // Wanted Level
        const stars = '★'.repeat(this.player.wantedLevel);
        const wantedStars = document.getElementById('wanted-stars');
        const wantedText = document.getElementById('wanted-text');
        if (wantedStars) wantedStars.textContent = stars;
        if (wantedText) wantedText.textContent = this.player.wantedLevel + '★';

        // Money
        const moneyText = document.getElementById('money-text');
        if (moneyText) moneyText.textContent = '$' + this.player.money.toLocaleString();

        // Weapon Info
        const currentWeapon = this.player.currentWeapon;
        const weaponName = document.getElementById('weapon-name');
        const ammoDisplay = document.getElementById('ammo-display');
        if (weaponName) weaponName.textContent = currentWeapon.name;
        if (ammoDisplay) {
            if (currentWeapon.ammo === -1) {
                ammoDisplay.textContent = '∞';
            } else {
                ammoDisplay.textContent = this.player.ammo[this.player.weaponIndex] || 0;
            }
        }

        // Time
        const hours = Math.floor((this.gameTime / 3600) % 24);
        const minutes = Math.floor((this.gameTime / 60) % 60);
        const timeStr = String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0');
        const timeEl = document.getElementById('time');
        if (timeEl) timeEl.textContent = timeStr;

        // Debug Info
        if (this.keys['`']) {
            const debugInfo = document.getElementById('debug-info');
            if (debugInfo) debugInfo.style.display = 'block';
            
            const fps = document.getElementById('fps');
            const pos = document.getElementById('pos');
            const vel = document.getElementById('vel');
            if (fps) fps.textContent = this.fps;
            if (pos) pos.textContent = Math.floor(this.player.x) + ', ' + Math.floor(this.player.y);
            if (vel) vel.textContent = Math.floor(this.player.vx) + ', ' + Math.floor(this.player.vy);
        }
    }

    updateInteractionPrompt() {
        const prompt = document.getElementById('interaction-prompt');
        if (!prompt) return;

        let showPrompt = false;
        let promptText = '';

        // Check for nearby NPCs or objects
        for (let entity of this.entities) {
            const dist = Math.hypot(
                entity.x - this.player.x,
                entity.y - this.player.y
            );
            
            if (dist < 100) {
                if (entity instanceof Vehicle) {
                    promptText = 'Press F to enter vehicle';
                    showPrompt = true;
                } else if (entity instanceof NPC && !(entity instanceof Enemy)) {
                    promptText = 'Press E to talk';
                    showPrompt = true;
                }
                break;
            }
        }

        if (showPrompt) {
            const text = document.getElementById('interaction-text');
            if (text) text.textContent = promptText;
            prompt.style.display = 'block';
        } else {
            prompt.style.display = 'none';
        }
    }

    updateMissionObjective() {
        const missionObj = document.getElementById('mission-objective');
        if (!missionObj) return;

        if (this.currentMission) {
            missionObj.style.display = 'block';
            const title = document.getElementById('mission-title');
            const text = document.getElementById('mission-text');
            if (title) title.textContent = 'MISSION: ' + this.currentMission.name;
            if (text) text.textContent = this.currentMission.objective;
        } else {
            missionObj.style.display = 'none';
        }
    }

    interact() {
        for (let entity of this.entities) {
            const dist = Math.hypot(
                entity.x - this.player.x,
                entity.y - this.player.y
            );
            
            if (dist < 100 && entity instanceof NPC && !(entity instanceof Enemy)) {
                this.showShop();
                break;
            }
        }
    }

    toggleVehicle() {
        for (let entity of this.entities) {
            const dist = Math.hypot(
                entity.x - this.player.x,
                entity.y - this.player.y
            );
            
            if (dist < 100 && entity instanceof Vehicle) {
                this.player.enterVehicle(entity);
                break;
            }
        }
    }

    reload() {
        this.player.reload();
    }

    hornSound() {
        if (this.player.vehicle) {
            try {
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                
                osc.frequency.value = 800;
                osc.type = 'sine';
                
                gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
                
                osc.start(audioCtx.currentTime);
                osc.stop(audioCtx.currentTime + 0.2);
            } catch (e) {
                console.log('Audio not supported');
            }
        }
    }

    switchWeapon(index) {
        this.player.switchWeapon(index);
    }

    showShop() {
        const shopOverlay = document.getElementById('shop-overlay');
        if (!shopOverlay) return;

        shopOverlay.style.display = 'flex';
        const shopItems = document.getElementById('shop-items');
        shopItems.innerHTML = '';

        for (let item of ShopItems) {
            const itemEl = document.createElement('div');
            itemEl.className = 'shop-item';
            itemEl.innerHTML = `
                <div class="shop-item-name">${item.name}</div>
                <div class="shop-item-price">$${item.price}</div>
            `;
            itemEl.addEventListener('click', () => {
                if (this.player.money >= item.price) {
                    this.player.money -= item.price;
                    
                    if (item.type === 'health') {
                        this.player.health = Math.min(this.player.health + 50, this.player.maxHealth);
                    } else if (item.type === 'armor') {
                        this.player.armor = Math.min(this.player.armor + 50, 100);
                    } else if (item.type === 'ammo') {
                        const weaponIndex = Object.keys(Weapons).indexOf(item.weapon);
                        if (!this.player.ammo[weaponIndex]) {
                            this.player.ammo[weaponIndex] = 0;
                        }
                        this.player.ammo[weaponIndex] += 30;
                    }
                }
            });
            shopItems.appendChild(itemEl);
        }
    }

    closeShop() {
        const shopOverlay = document.getElementById('shop-overlay');
        if (shopOverlay) shopOverlay.style.display = 'none';
    }

    toggleMissions() {
        const missionsSelect = document.getElementById('mission-select');
        if (!missionsSelect) return;

        if (missionsSelect.style.display === 'none' || missionsSelect.style.display === '') {
            this.showMissions();
        } else {
            this.closeMissions();
        }
    }

    showMissions() {
        const missionsSelect = document.getElementById('mission-select');
        if (!missionsSelect) return;

        missionsSelect.style.display = 'flex';
        const missionsList = document.getElementById('missions-list');
        missionsList.innerHTML = '';

        for (let mission of Missions) {
            const missionEl = document.createElement('div');
            missionEl.className = 'mission-item';
            if (this.completedMissions.includes(mission.id)) {
                missionEl.classList.add('completed');
            }

            missionEl.innerHTML = `
                <div class="mission-name">${mission.name}</div>
                <div class="mission-desc">${mission.description}</div>
                <div class="mission-reward">Reward: $${mission.reward}</div>
            `;

            missionEl.addEventListener('click', () => {
                this.startMission(mission);
                this.closeMissions();
            });

            missionsList.appendChild(missionEl);
        }
    }

    closeMissions() {
        const missionsSelect = document.getElementById('mission-select');
        if (missionsSelect) missionsSelect.style.display = 'none';
    }

    startMission(mission) {
        this.currentMission = mission;
        this.player.wantedLevel = 0; // Reset wanted level
        
        // Spawn enemies for the mission
        if (mission.enemies) {
            for (let i = 0; i < mission.enemies; i++) {
                const angle = (i / mission.enemies) * Math.PI * 2;
                const distance = 300;
                const x = mission.location.x + Math.cos(angle) * distance;
                const y = mission.location.y + Math.sin(angle) * distance;
                const enemy = new Enemy(x, y);
                this.entities.push(enemy);
            }
        }
    }

    completeMission() {
        if (this.currentMission) {
            this.player.money += this.currentMission.reward;
            this.completedMissions.push(this.currentMission.id);
            this.currentMission = null;
        }
    }

    togglePause() {
        if (this.gameState === GameState.PLAYING) {
            this.gameState = GameState.PAUSED;
        } else if (this.gameState === GameState.PAUSED) {
            this.gameState = GameState.PLAYING;
        }
    }
}

// World Class
class World {
    constructor() {
        this.width = GAME_WIDTH * 4;
        this.height = GAME_HEIGHT * 4;
        this.buildings = this.generateBuildings();
        this.streets = this.generateStreets();
    }

    generateBuildings() {
        const buildings = [];
        for (let x = 0; x < this.width; x += 200) {
            for (let y = 0; y < this.height; y += 200) {
                if (Math.random() > 0.3) {
                    buildings.push({
                        x: x + Math.random() * 50,
                        y: y + Math.random() * 50,
                        width: 150 + Math.random() * 50,
                        height: 150 + Math.random() * 50,
                        color: ['#8B4513', '#A0522D', '#704214'][Math.floor(Math.random() * 3)]
                    });
                }
            }
        }
        return buildings;
    }

    generateStreets() {
        const streets = [];
        // Vertical streets
        for (let x = 0; x < this.width; x += 300) {
            streets.push({ x, y: 0, width: 50, height: this.height, type: 'vertical' });
        }
        // Horizontal streets
        for (let y = 0; y < this.height; y += 300) {
            streets.push({ x: 0, y, width: this.width, height: 50, type: 'horizontal' });
        }
        return streets;
    }

    render(ctx, camera) {
        // Draw streets
        ctx.fillStyle = '#444';
        for (let street of this.streets) {
            ctx.fillRect(
                street.x - camera.x,
                street.y - camera.y,
                street.width,
                street.height
            );
        }

        // Draw street markings
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        for (let street of this.streets) {
            if (street.type === 'horizontal') {
                for (let x = street.x; x < street.x + street.width; x += 40) {
                    ctx.beginPath();
                    ctx.moveTo(x - camera.x, street.y + street.height / 2 - camera.y);
                    ctx.lineTo(x + 20 - camera.x, street.y + street.height / 2 - camera.y);
                    ctx.stroke();
                }
            }
        }

        // Draw buildings
        for (let building of this.buildings) {
            ctx.fillStyle = building.color;
            ctx.fillRect(
                building.x - camera.x,
                building.y - camera.y,
                building.width,
                building.height
            );

            // Draw windows
            ctx.fillStyle = '#FFD700';
            for (let wx = 0; wx < building.width; wx += 25) {
                for (let wy = 0; wy < building.height; wy += 25) {
                    ctx.fillRect(
                        building.x + wx - camera.x,
                        building.y + wy - camera.y,
                        15, 15
                    );
                }
            }

            // Building border
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.strokeRect(
                building.x - camera.x,
                building.y - camera.y,
                building.width,
                building.height
            );
        }
    }
}

// Player Class
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 30;
        this.vx = 0;
        this.vy = 0;
        this.speed = 150;
        this.health = 100;
        this.maxHealth = 100;
        this.armor = 0;
        this.money = 5000;
        this.wantedLevel = 0;
        
        // Weapons
        this.weapons = ['fists', 'pistol', 'smg', 'rifle', 'shotgun'];
        this.weaponIndex = 0;
        this.currentWeapon = Weapons[this.weapons[this.weaponIndex]];
        this.ammo = [0, 0, 0, 0, 0]; // Ammo for each weapon
        this.lastShotTime = 0;

        // Vehicle
        this.vehicle = null;
        this.inVehicle = false;

        // Animation
        this.angle = 0;
        this.walking = false;
    }

    update(deltaTime, keys, mousePos, isMouseDown, world) {
        // Movement
        this.vx = 0;
        this.vy = 0;

        if (keys['w']) this.vy = -this.speed;
        if (keys['s']) this.vy = this.speed;
        if (keys['a']) this.vx = -this.speed;
        if (keys['d']) this.vx = this.speed;

        // Normalize diagonal movement
        if (this.vx !== 0 && this.vy !== 0) {
            const length = Math.hypot(this.vx, this.vy);
            this.vx = (this.vx / length) * this.speed;
            this.vy = (this.vy / length) * this.speed;
        }

        // Update position
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;

        // Clamp to world bounds
        this.x = Math.max(0, Math.min(this.x, world.width - this.width));
        this.y = Math.max(0, Math.min(this.y, world.height - this.height));

        // Calculate angle to mouse
        const centerX = GAME_WIDTH / 2;
        const centerY = GAME_HEIGHT / 2;
        this.angle = Math.atan2(mousePos.y - centerY, mousePos.x - centerX);

        // Shooting
        if (isMouseDown && Date.now() - this.lastShotTime > this.currentWeapon.fireRate) {
            this.shoot();
            this.lastShotTime = Date.now();
        }

        // Walking animation
        this.walking = this.vx !== 0 || this.vy !== 0;
    }

    shoot() {
        if (this.currentWeapon.ammo === -1 || this.ammo[this.weaponIndex] > 0) {
            const startX = this.x + Math.cos(this.angle) * 15;
            const startY = this.y + Math.sin(this.angle) * 15;
            
            const projectile = new Projectile(
                startX,
                startY,
                this.angle,
                this.currentWeapon.damage,
                this.currentWeapon.range
            );
            
            game.projectiles.push(projectile);

            // Consume ammo
            if (this.currentWeapon.ammo !== -1) {
                this.ammo[this.weaponIndex]--;
            }

            // Recoil
            this.x -= Math.cos(this.angle) * 5;
            this.y -= Math.sin(this.angle) * 5;
        }
    }

    reload() {
        if (this.currentWeapon.ammo > 0) {
            this.ammo[this.weaponIndex] = this.currentWeapon.ammo;
        }
    }

    switchWeapon(index) {
        if (index < this.weapons.length) {
            this.weaponIndex = index;
            this.currentWeapon = Weapons[this.weapons[this.weaponIndex]];
        }
    }

    enterVehicle(vehicle) {
        this.vehicle = vehicle;
        this.inVehicle = true;
    }

    exitVehicle() {
        this.inVehicle = false;
        this.vehicle = null;
    }

    takeDamage(damage) {
        const damageAfterArmor = Math.max(0, damage - (this.armor * 0.5));
        this.health -= damageAfterArmor;
        
        if (this.armor > 0) {
            this.armor -= damage * 0.2;
        }

        // Increase wanted level if damaged by others
        if (Math.random() > 0.7) {
            this.wantedLevel = Math.min(6, this.wantedLevel + 1);
        }
    }

    render(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        // Draw character body (CJ style)
        ctx.fillStyle = '#ff9900';
        ctx.beginPath();
        ctx.arc(screenX, screenY - 5, 8, 0, Math.PI * 2);
        ctx.fill();

        // Draw torso
        ctx.fillStyle = '#0066cc';
        ctx.fillRect(screenX - 6, screenY + 3, 12, 12);

        // Draw legs
        ctx.fillStyle = '#333';
        ctx.fillRect(screenX - 4, screenY + 15, 4, 8);
        ctx.fillRect(screenX, screenY + 15, 4, 8);

        // Draw weapon
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(screenX, screenY + 5);
        const gunLength = 20;
        ctx.lineTo(
            screenX + Math.cos(this.angle) * gunLength,
            screenY + Math.sin(this.angle) * gunLength
        );
        ctx.stroke();

        // Draw health bar above player
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(screenX - 15, screenY - 30, 30, 4);
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(screenX - 15, screenY - 30, (this.health / this.maxHealth) * 30, 4);
    }
}

// NPC Class
class NPC {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 30;
        this.vx = 0;
        this.vy = 0;
        this.speed = 60;
        this.health = 50;
        this.angle = 0;
        this.moveTimer = 0;
        this.moveInterval = Math.random() * 3 + 2;
    }

    update(deltaTime, player, world) {
        this.moveTimer += deltaTime;
        
        if (this.moveTimer > this.moveInterval) {
            this.angle = Math.random() * Math.PI * 2;
            this.moveTimer = 0;
            this.moveInterval = Math.random() * 3 + 2;
        }

        this.vx = Math.cos(this.angle) * this.speed;
        this.vy = Math.sin(this.angle) * this.speed;

        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;

        // Clamp to world
        this.x = Math.max(0, Math.min(this.x, world.width - this.width));
        this.y = Math.max(0, Math.min(this.y, world.height - this.height));
    }

    takeDamage(damage) {
        this.health -= damage;
    }

    render(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        ctx.fillStyle = '#ffccaa';
        ctx.beginPath();
        ctx.arc(screenX, screenY - 5, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ff6666';
        ctx.fillRect(screenX - 5, screenY + 3, 10, 10);

        ctx.fillStyle = '#222';
        ctx.fillRect(screenX - 3, screenY + 13, 3, 8);
        ctx.fillRect(screenX, screenY + 13, 3, 8);
    }
}

// Enemy Class
class Enemy extends NPC {
    constructor(x, y) {
        super(x, y);
        this.health = 30;
        this.speed = 80;
        this.weapon = Weapons.pistol;
        this.lastShotTime = 0;
        this.shootRange = 400;
    }

    update(deltaTime, player, world) {
        const distToPlayer = Math.hypot(
            player.x - this.x,
            player.y - this.y
        );

        if (distToPlayer < this.shootRange) {
            // Chase and shoot player
            this.angle = Math.atan2(player.y - this.y, player.x - this.x);
            this.vx = Math.cos(this.angle) * this.speed;
            this.vy = Math.sin(this.angle) * this.speed;

            if (Date.now() - this.lastShotTime > 500) {
                this.shoot(player);
                this.lastShotTime = Date.now();
            }
        } else {
            this.moveTimer += deltaTime;
            
            if (this.moveTimer > this.moveInterval) {
                this.angle = Math.random() * Math.PI * 2;
                this.moveTimer = 0;
                this.moveInterval = Math.random() * 3 + 2;
            }

            this.vx = Math.cos(this.angle) * this.speed;
            this.vy = Math.sin(this.angle) * this.speed;
        }

        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;

        this.x = Math.max(0, Math.min(this.x, world.width - this.width));
        this.y = Math.max(0, Math.min(this.y, world.height - this.height));
    }

    shoot(player) {
        const projectile = new Projectile(
            this.x,
            this.y,
            this.angle,
            this.weapon.damage,
            this.weapon.range
        );
        game.projectiles.push(projectile);
    }

    render(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        ctx.fillStyle = '#ff3333';
        ctx.beginPath();
        ctx.arc(screenX, screenY - 5, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#990000';
        ctx.fillRect(screenX - 5, screenY + 3, 10, 10);

        ctx.fillStyle = '#222';
        ctx.fillRect(screenX - 3, screenY + 13, 3, 8);
        ctx.fillRect(screenX, screenY + 13, 3, 8);

        // Health bar
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(screenX - 10, screenY - 25, 20, 3);
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(screenX - 10, screenY - 25, (this.health / 30) * 20, 3);
    }
}

// Vehicle Class
class Vehicle {
    constructor(x, y, type = 'car') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = 40;
        this.height = 60;
        this.vx = 0;
        this.vy = 0;
        this.angle = 0;
        this.speed = 200;
        this.health = 100;
        this.maxHealth = 100;
    }

    update(deltaTime, player, world) {
        // Simple movement
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;

        this.x = Math.max(0, Math.min(this.x, world.width - this.width));
        this.y = Math.max(0, Math.min(this.y, world.height - this.height));
    }

    takeDamage(damage) {
        this.health -= damage;
    }

    render(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        // Draw car
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(screenX, screenY, this.width, this.height);

        // Windows
        ctx.fillStyle = 'rgba(0, 100, 200, 0.5)';
        ctx.fillRect(screenX + 5, screenY + 10, 12, 10);
        ctx.fillRect(screenX + 23, screenY + 10, 12, 10);

        // Wheels
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(screenX + 10, screenY + this.height - 5, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(screenX + this.width - 10, screenY + this.height - 5, 5, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Projectile Class
class Projectile {
    constructor(x, y, angle, damage, range) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.damage = damage;
        this.range = range;
        this.speed = 400;
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        this.distance = 0;
        this.radius = 2;
    }

    update(deltaTime) {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        this.distance += this.speed * deltaTime;
    }

    collidesWith(entity) {
        const dist = Math.hypot(
            entity.x - this.x,
            entity.y - this.y
        );
        return dist < entity.width;
    }

    render(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Particle Class
class Particle {
    constructor(x, y, vx, vy, life = 1) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = life;
        this.maxLife = life;
        this.radius = 3;
    }

    update(deltaTime) {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        this.vy += 200 * deltaTime; // Gravity
        this.life -= deltaTime;
    }

    render(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        ctx.fillStyle = `rgba(255, 215, 0, ${this.life / this.maxLife})`;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    console.log('Page loaded, initializing game...');
    game = new Game();
});

// Handle window resize
window.addEventListener('resize', () => {
    if (game && game.canvas) {
        game.canvas.width = window.innerWidth;
        game.canvas.height = window.innerHeight;
    }
});

// Global game instance
let game = null;
