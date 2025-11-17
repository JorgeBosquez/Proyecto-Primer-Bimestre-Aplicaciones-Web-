class ArcadeShooter {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");

    // Estados del juego
    this.STATES = {
      LOADING: "loading",
      MAIN_MENU: "main_menu",
      PLAYING: "playing",
      PAUSED: "paused",
      GAME_OVER: "game_over",
      LEVEL_COMPLETE: "level_complete",
      VICTORY: "victory",
      INSTRUCTIONS: "instructions",
      CREDITS: "credits",
    };

    this.currentState = this.STATES.LOADING;
    this.gameState = "playing";

    // ========== SISTEMA DE NIVELES ==========
    this.currentLevel = 1;
    this.levels = {
      1: {
        name: "Día Soleado",
        backgroundColor: '#6262F8',
        cloudAlpha: 0.8,
        enemySpeedMultiplier: 1,
        enemySpawnInterval: 2000,
        enemy2SpawnInterval: 5000,
        numPlatforms: 6,
        hasPits: false,
        goalX: 4800,
        enemyHealthMultiplier: 1
      },
      2: {
        name: "Noche Peligrosa",
        backgroundColor: '#0a0a1a',
        cloudAlpha: 0.3,
        enemySpeedMultiplier: 1.4,
        enemySpawnInterval: 1500,
        enemy2SpawnInterval: 3000,
        numPlatforms: 3,
        hasPits: true,
        goalX: 4500,
        enemyHealthMultiplier: 1.2,
        pits: [
          { x: 1200, width: 400 },
          { x: 2600, width: 350 },
          { x: 3800, width: 450 }
        ]
      },
      3: {
        name: "Infierno Ardiente",           
        backgroundColor: '#4a0000',        
        cloudAlpha: 0.5,                     
        enemySpeedMultiplier: 1.8,           
        enemySpawnInterval: 1000,            
        enemy2SpawnInterval: 2000,           
        numPlatforms: 4,                     
        hasPits: true,                       
        goalX: 4000,                         
        enemyHealthMultiplier: 1.5,          
        pits: [                              
          { x: 800, width: 500 },
          { x: 2000, width: 400 },
          { x: 3200, width: 600 }
        ]
      },
    };

    // Configuración del juego
    this.camera = { x: 0, y: 0 };
    this.levelWidth = 5000;
    this.levelHeight = 800;
    this.score = 0;
    this.health = 100;

    // Imágenes
    this.images = {
      ground: null,
      cloud: null,
      playerWalk: null,
      playerAttack: null,
      playerDead: null,
      enemyWalk: null,
      enemyAttack: null,
      enemyDead: null,
      enemy2Walk: null,
      enemy2Attack: null,
      enemy2Dead: null,
      heart: null,
    };

    // RAF id para controlar el bucle principal (pausa/reanudar)
    this.rafId = null;

    // Jugador con FÍSICA COMPLETA
    this.player = {
      x: 100,
      y: 0,
      width: 64 * 4,
      height: 128 * 1.5,
      speed: 10,
      isMoving: false,
      direction: "right",
      state: "idle",
      attackCooldown: false,
      soundPlayed: false,
      currentFrame: 0,
      frameCounter: 0,

      // FÍSICA DE SALTO
      isJumping: false,
      onPlatform: false,
      jumpVelocity: 0,
      jumpPower: -15,
      gravity: 0.6,
      maxFallSpeed: 15,

      animations: {
        idle: { sprite: "playerWalk", frames: [0], speed: 0, loop: true },
        walking: {
          sprite: "playerWalk",
          frames: [0, 1, 2, 3, 4, 5, 6],
          speed: 0.1,
          loop: true,
        },
        attacking: {
          sprite: "playerAttack",
          frames: [0, 1, 2, 3, 4],
          speed: 0.15,
          loop: false,
        },
        dead: {
          sprite: "playerDead",
          frames: [0, 1, 2, 3],
          speed: 0.1,
          loop: false,
        },
      },
      spriteConfig: {
        playerWalk: { frameWidth: 128, frameHeight: 128 },
        playerAttack: { frameWidth: 128, frameHeight: 128 },
        playerDead: { frameWidth: 128, frameHeight: 128 },
      },
    };

    // Sistema de plataformas
    this.platforms = [];
    this.hearts = [];
    this.pits = [];

    // Sistema de enemigos
    this.enemies = [];
    this.enemySpawnTimer = 0;
    this.enemySpawnInterval = 2000;
    this.enemy2SpawnTimer = 0;
    this.enemy2SpawnInterval = 5000;
    this.enemyConfig = {
      walk: { frameWidth: 128, frameHeight: 128 },
      attack: { frameWidth: 128, frameHeight: 128 },
      dead: { frameWidth: 128, frameHeight: 128 },
    };

    this.clouds = [];
    this.stars = [];
    this.groundConfig = { height: 100, y: 0 };

    // ========== SISTEMA DE AUDIO ==========
    this.audio = {
      menu: null,
      level1: null,
      level2: null,
      currentMusic: null,
      swordSlash: null,
    };
    
    this.audioConfig = {
      volume: 0.3,              // Volumen (0.0 a 1.0)
      startTime: 0,             // Segundo donde empieza (0 = inicio)
      fadeInDuration: 2000,      // Duración del fade-in en ms
      sfxVolume: 0.5        // Volumen de efectos de sonido
    };

    this.loadAssets();
    this.loadAudio();
  }

  // ========== SISTEMA DE ESTADOS ==========

  setState(newState) {
    this.hideAllScreens();
    this.currentState = newState;

    switch (newState) {
      case this.STATES.LOADING:
        this.showScreen("loadingScreen");
        break;
      case this.STATES.MAIN_MENU:
        this.showScreen("mainMenu");
        this.initCharacterPreview();
        this.playMusic('menu'); 
        break;
      case this.STATES.PLAYING:
        this.showScreen("gameScreen");
        this.startGameplay();
        this.startMainLoop();

        // Música según el nivel
        if (this.currentLevel === 1) {
          this.playMusic('level1', 31); // Empieza en segundo 0
        // } else if (this.currentLevel === 2) {
        //   this.playMusic('level2', 31); // Empieza en segundo 10
        }
        break;
      case this.STATES.PAUSED:
        this.showScreen("pauseScreen");
        this.stopMainLoop();
        // Pausar música
        if (this.audio.currentMusic) {
          this.audio.currentMusic.pause();
        }
        break;
      case this.STATES.GAME_OVER:
        this.showScreen("gameOverScreen");
        document.getElementById("finalScore").textContent = `PUNTUACIÓN: ${this.score}`;
        this.stopMusic(); // ⬅️ Detener música
        break;
      case this.STATES.LEVEL_COMPLETE:
        this.showLevelComplete();
        break;
      case this.STATES.INSTRUCTIONS:
        this.showScreen("instructionsScreen");
        break;
      case this.STATES.CREDITS:
        this.showScreen("creditsScreen");
        break;
    }
  }

  showLevelComplete() {
    this.hideAllScreens();
    this.showScreen("levelCompleteScreen");
    document.getElementById("levelNumberDisplay").textContent = `NIVEL ${this.currentLevel}`;
    document.getElementById("levelCompleteScore").textContent = `${Math.floor(this.score)}`;
    this.stopMainLoop();
  }

  // Inicia el bucle principal solo si no hay uno en marcha
  startMainLoop() {
    if (this.rafId) return;
    this.rafId = requestAnimationFrame(this.gameLoop.bind(this));
  }

  // Detiene el bucle principal (usado en pausa)
  stopMainLoop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  hideAllScreens() {
    const screens = document.querySelectorAll(".screen");
    screens.forEach((screen) => screen.classList.add("hidden"));
  }

  showScreen(screenId) {
    document.getElementById(screenId).classList.remove("hidden");
  }

  // ========== PREVIEW DEL PERSONAJE ==========

  initCharacterPreview() {
    const canvas = document.getElementById("characterCanvas");
    if (!canvas || !this.images.playerWalk) return;

    const ctx = canvas.getContext("2d");
    let frameIndex = 0;
    let frameCounter = 0;
    const frameSpeed = 0.15;
    const frames = [0, 1, 2, 3, 4, 5, 6];

    const animatePreview = () => {
      if (this.currentState !== this.STATES.MAIN_MENU) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Fondo gradiente
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, "#1a1f3a");
      grad.addColorStop(1, "#0a0e27");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Dibujar personaje caminando
      const spriteConfig = this.player.spriteConfig.playerWalk;
      const sx = frames[frameIndex] * spriteConfig.frameWidth;
      
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(
        this.images.playerWalk,
        sx, 0,
        spriteConfig.frameWidth,
        spriteConfig.frameHeight,
        -canvas.width + 80,
        canvas.height / 2 - 100,
        256,
        192
      );
      ctx.restore();

      // Animar frame
      frameCounter += frameSpeed;
      if (frameCounter >= 1) {
        frameIndex = (frameIndex + 1) % frames.length;
        frameCounter = 0;
      }

      requestAnimationFrame(animatePreview);
    };

    animatePreview();
  }

  // ========== LOADER ==========

  loadAssets() {
    const assets = [
      { name: "ground", src: "assets/images/piso.jpg" },
      { name: "cloud", src: "assets/images/nube.png" },
      { name: "playerWalk", src: "assets/images/player/Walk.png" },
      { name: "playerAttack", src: "assets/images/player/Attack_1.png" },
      { name: "playerDead", src: "assets/images/player/Dead.png" },
      { name: "enemyWalk", src: "assets/images/enemy/Walk.png" },
      { name: "enemyAttack", src: "assets/images/enemy/Attack.png" },
      { name: "enemyDead", src: "assets/images/enemy/Dead.png" },
      { name: "enemy2Walk", src: "assets/images/enemy2/Walk.png" },
      { name: "enemy2Attack", src: "assets/images/enemy2/Attack.png" },
      { name: "enemy2Dead", src: "assets/images/enemy2/Dead.png" },
      { name: "heart", src: "assets/images/vida.png" },
      { name: "platform", src: "assets/images/piso.jpg" },
    ];

    let loadedCount = 0;
    const totalAssets = assets.length;

    assets.forEach((asset) => {
      const img = new Image();
      img.onload = () => {
        loadedCount++;
        this.images[asset.name] = img;

        const progress = (loadedCount / totalAssets) * 100;
        document.querySelector(".loader-text").textContent = `Cargando... ${Math.round(progress)}%`;

        if (loadedCount === totalAssets) {
          setTimeout(() => {
            this.setState(this.STATES.MAIN_MENU);
          }, 500);
        }
      };

      img.onerror = () => {
        console.error(`Error cargando: ${asset.src}`);
        this.images[asset.name] = this.createFallbackImage();
        loadedCount++;

        if (loadedCount === totalAssets) {
          this.setState(this.STATES.MAIN_MENU);
        }
      };

      img.src = asset.src;
    });
  }

  createFallbackImage() {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ff4444";
    ctx.fillRect(0, 0, 128, 128);
    return canvas;
  }

  // ========== SISTEMA DE AUDIO ==========
  loadAudio() {
    // Crear objetos de audio para MÚSICA
    this.audio.menu = new Audio('assets/audio/i_run.mp3');
    this.audio.level1 = new Audio('assets/audio/i_run.mp3');
    this.audio.level2 = new Audio('assets/audio/i_run.mp3');
    
    // Crear efectos de sonido
    this.audio.swordSlash = new Audio('assets/audio/espada.mp3');
    
    // Configurar propiedades de MÚSICA (CON loop)
    [this.audio.menu, this.audio.level1, this.audio.level2].forEach(audio => {
      if (audio) {
        audio.volume = this.audioConfig.volume;
        audio.loop = true; // ⬅️ LOOP solo para música
        audio.preload = 'auto';
      }
    });
    
    // Configurar efectos de sonido (SIN loop)
    if (this.audio.swordSlash) {
      this.audio.swordSlash.volume = this.audioConfig.sfxVolume;
      this.audio.swordSlash.loop = false; // ⬅️ NO LOOP para efectos
      this.audio.swordSlash.preload = 'auto';
    }
    
    console.log('Audio cargado y configurado');
  }

  playMusic(musicName, startTime = 0) {
    // Detener música actual si existe
    if (this.audio.currentMusic) {
      this.fadeOutMusic(this.audio.currentMusic);
    }
    
    // Obtener la nueva música
    const newMusic = this.audio[musicName];
    if (!newMusic) {
      console.warn(`Música "${musicName}" no encontrada`);
      return;
    }
    
    // Configurar punto de inicio
    newMusic.currentTime = startTime; // ⬅️ DESDE QUÉ SEGUNDO EMPIEZA
    
    // Fade in (aumentar volumen gradualmente)
    newMusic.volume = 0;
    newMusic.play().catch(err => {
      console.log('Error reproduciendo audio:', err);
      console.log('Tip: El usuario debe interactuar con la página primero');
    });
    
    this.fadeInMusic(newMusic);
    this.audio.currentMusic = newMusic;
  }
  fadeInMusic(audio) {
    const targetVolume = this.audioConfig.volume;
    const duration = this.audioConfig.fadeInDuration;
    const steps = 50;
    const stepTime = duration / steps;
    const volumeIncrement = targetVolume / steps;
    
    let currentStep = 0;
    const fadeInterval = setInterval(() => {
      currentStep++;
      audio.volume = Math.min(volumeIncrement * currentStep, targetVolume);
      
      if (currentStep >= steps) {
        clearInterval(fadeInterval);
      }
    }, stepTime);
  }
  fadeOutMusic(audio) {
    const duration = 1000; // 1 segundo
    const steps = 20;
    const stepTime = duration / steps;
    const volumeDecrement = audio.volume / steps;
    
    let currentStep = 0;
    const fadeInterval = setInterval(() => {
      currentStep++;
      audio.volume = Math.max(audio.volume - volumeDecrement, 0);
      
      if (currentStep >= steps) {
        clearInterval(fadeInterval);
        audio.pause();
        audio.currentTime = 0;
      }
    }, stepTime);
  }
  stopMusic() {
    if (this.audio.currentMusic) {
      this.fadeOutMusic(this.audio.currentMusic);
      this.audio.currentMusic = null;
    }
  }
  setMusicVolume(volume) {
    this.audioConfig.volume = Math.max(0, Math.min(1, volume));
    if (this.audio.currentMusic) {
      this.audio.currentMusic.volume = this.audioConfig.volume;
    }
  }

  // ========== SISTEMA DE PLATAFORMAS ==========

  generatePlatforms() {
    this.platforms = [];
    this.hearts = [];

    const levelConfig = this.levels[this.currentLevel];

    let selectedPlatforms = [];

    // Plataformas específicas por nivel
    if (this.currentLevel === 1) {
      selectedPlatforms = [
        { x: 500, y: 400, width: 200, height: 20 },
        { x: 1000, y: 250, width: 150, height: 20 },
        { x: 1500, y: 400, width: 180, height: 20 },
        { x: 2200, y: 320, width: 220, height: 20 },
        { x: 3000, y: 280, width: 170, height: 20 },
        { x: 3800, y: 350, width: 190, height: 20 },
      ];
    } else if (this.currentLevel === 2) {
      // Nivel 2: Noche Peligrosa - con precipicios
      selectedPlatforms = [
        { x: 500, y: 400, width: 200, height: 20 },
        { x: 1000, y: 250, width: 150, height: 20 },
        { x: 1500, y: 400, width: 180, height: 20 },
        // Después del primer precipicio (1200-1600)
        { x: 1800, y: 300, width: 160, height: 20 },
        { x: 2200, y: 350, width: 200, height: 20 },
        // Después del segundo precipicio (2600-2950)
        { x: 3200, y: 280, width: 170, height: 20 },
        { x: 3600, y: 380, width: 190, height: 20 },
      ];
    } else if (this.currentLevel === 3) {
      // Nivel 3: Infierno Ardiente - más desafiante
      selectedPlatforms = [
        { x: 500, y: 380, width: 180, height: 20 },
        { x: 1000, y: 280, width: 160, height: 20 },
        // Después del primer precipicio (800-1300)
        { x: 1500, y: 350, width: 190, height: 20 },
        { x: 1900, y: 300, width: 170, height: 20 },
        // Después del segundo precipicio (2000-2400)
        { x: 2600, y: 330, width: 200, height: 20 },
        { x: 3000, y: 280, width: 160, height: 20 },
        // Después del tercer precipicio (3200-3800)
        { x: 3950, y: 350, width: 150, height: 20 },
      ];
    }

    selectedPlatforms.forEach((platform) => {
      this.platforms.push(platform);

      this.hearts.push({
        x: platform.x + platform.width / 2 - 25,
        y: platform.y - 50,
        width: 50,
        height: 50,
        collected: false,
      });
    });

    // Agregar plataforma final al nivel del piso para cada nivel
    if (this.currentLevel === 2) {
      // Plataforma sólida hasta la meta en nivel 2
      const finalPlatform = { 
        x: 4200, 
        y: this.groundConfig.y - 20, 
        width: 600, 
        height: 20 
      };
      this.platforms.push(finalPlatform);
      this.hearts.push({
        x: finalPlatform.x + finalPlatform.width / 2 - 25,
        y: finalPlatform.y - 50,
        width: 50,
        height: 50,
        collected: false,
      });
    } else if (this.currentLevel === 3) {
      // Plataforma sólida hasta la meta en nivel 3
      const finalPlatform = { 
        x: 4050, 
        y: this.groundConfig.y - 20, 
        width: 400, 
        height: 20 
      };
      this.platforms.push(finalPlatform);
      this.hearts.push({
        x: finalPlatform.x + finalPlatform.width / 2 - 25,
        y: finalPlatform.y - 50,
        width: 50,
        height: 50,
        collected: false,
      });
    }
  }

  generatePits() {
    this.pits = [];
    const levelConfig = this.levels[this.currentLevel];
    
    if (levelConfig.hasPits) {
      this.pits = levelConfig.pits.map(pit => ({
        x: pit.x,
        width: pit.width,
        y: this.groundConfig.y
      }));
    }
  }

  checkPitCollision() {
    const levelConfig = this.levels[this.currentLevel];
    if (!levelConfig.hasPits) return;
    
    for (const pit of this.pits) {
      const playerCenterX = this.player.x + this.player.width / 2;
      const playerBottom = this.player.y + this.player.height;
      
      if (playerCenterX > pit.x && 
          playerCenterX < pit.x + pit.width &&
          playerBottom >= pit.y) {
        
        this.health = 0;
        this.player.state = 'dead';
        setTimeout(() => this.gameOver(), 1000);
        break;
      }
    }
  }

  checkLevelComplete() {
    const levelConfig = this.levels[this.currentLevel];
    const playerCenterX = this.player.x + this.player.width / 2;
    
    // Debug: Mostrar en consola
    if (playerCenterX >= levelConfig.goalX - 100) {
      console.log('Cerca de la meta!', {
        playerX: playerCenterX,
        goalX: levelConfig.goalX,
        distancia: levelConfig.goalX - playerCenterX
      });
    }
    
    if (playerCenterX >= levelConfig.goalX) {
      console.log('¡META ALCANZADA! Cambiando a LEVEL_COMPLETE');
      this.stopMainLoop(); // Detener el juego
      this.setState(this.STATES.LEVEL_COMPLETE);
    }
  }

  checkPlatformCollision() {
    this.player.onPlatform = false;

    for (const platform of this.platforms) {
      if (
        this.player.x + this.player.width > platform.x &&
        this.player.x < platform.x + platform.width &&
        this.player.y + this.player.height >= platform.y &&
        this.player.y + this.player.height <= platform.y + 20 &&
        this.player.jumpVelocity >= 0
      ) {
        this.player.y = platform.y - this.player.height;
        this.player.onPlatform = true;
        this.player.isJumping = false;
        this.player.jumpVelocity = 0;
        break;
      }
    }
  }

  checkHeartCollision() {
    for (const heart of this.hearts) {
      if (heart.collected) continue;

      if (
        this.player.x + this.player.width > heart.x &&
        this.player.x < heart.x + heart.width &&
        this.player.y + this.player.height > heart.y &&
        this.player.y < heart.y + heart.height
      ) {
        heart.collected = true;
        this.health = 100;
        this.updateUI();
      }
    }
  }

  drawPlatforms() {
    for (const platform of this.platforms) {
      const screenX = platform.x - this.camera.x;
      
      if (this.images.ground) {
        const imageWidth = this.images.ground.width;
        const imageHeight = this.images.ground.height;
        const numTilesX = Math.ceil(platform.width / imageWidth);
        
        for (let i = 0; i < numTilesX; i++) {
          const tileX = screenX + (i * imageWidth);
          const remainingWidth = platform.width - (i * imageWidth);
          const drawWidth = Math.min(imageWidth, remainingWidth);
          
          this.ctx.drawImage(
            this.images.ground,
            0, 0,
            drawWidth, imageHeight,
            tileX, platform.y,
            drawWidth, platform.height
          );
        }
      } else {
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(screenX, platform.y, platform.width, platform.height);
      }
      
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      this.ctx.fillRect(screenX, platform.y + platform.height, platform.width, 5);
    }
    
    for (const heart of this.hearts) {
      if (heart.collected) continue;
      
      const screenX = heart.x - this.camera.x;
      if (this.images.heart) {
        this.ctx.drawImage(this.images.heart, screenX, heart.y, heart.width, heart.height);
      } else {
        this.ctx.fillStyle = 'red';
        this.ctx.beginPath();
        this.ctx.arc(screenX + heart.width/2, heart.y + heart.height/2, heart.width/2, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
  }

  drawPits() {
    const levelConfig = this.levels[this.currentLevel];
    if (!levelConfig.hasPits) return;
    
    this.ctx.fillStyle = '#000000';
    for (const pit of this.pits) {
      const screenX = pit.x - this.camera.x;
      this.ctx.fillRect(screenX, pit.y, pit.width, this.groundConfig.height);
    }
  }

  // ========== FÍSICA DEL JUGADOR ==========

  updatePlayerPhysics() {
    this.player.jumpVelocity += this.player.gravity;

    if (this.player.jumpVelocity > this.player.maxFallSpeed) {
      this.player.jumpVelocity = this.player.maxFallSpeed;
    }

    this.player.y += this.player.jumpVelocity;

    this.checkPlatformCollision();
    this.checkHeartCollision();
    this.checkPitCollision();
    
    const groundLevel = this.groundConfig.y - this.player.height;
    
    let onSolidGround = true;
    for (const pit of this.pits) {
      const playerCenterX = this.player.x + this.player.width / 2;
      if (playerCenterX > pit.x && playerCenterX < pit.x + pit.width) {
        onSolidGround = false;
        break;
      }
    }
    
    if (this.player.y >= groundLevel && onSolidGround) {
      this.player.y = groundLevel;
      this.player.isJumping = false;
      this.player.onPlatform = false;
      this.player.jumpVelocity = 0;
    }
  }

  jump() {
    if (
      !this.player.isJumping &&
      (this.player.onPlatform ||
        this.player.y >= this.groundConfig.y - this.player.height)
    ) {
      this.player.isJumping = true;
      this.player.jumpVelocity = this.player.jumpPower;
      this.player.onPlatform = false;
    }
  }

  // ========== SISTEMA DE ENEMIGOS ==========

  spawnEnemy(type = 1) {
    const levelConfig = this.levels[this.currentLevel];

    const enemyTypes = {
      1: {
        walk: "enemyWalk",
        attack: "enemyAttack",
        dead: "enemyDead",
        speed: 2 * levelConfig.enemySpeedMultiplier,
        health: 100 * levelConfig.enemyHealthMultiplier,
        attackRange: 150,
        points: 150,
      },
      2: {
        walk: "enemy2Walk",
        attack: "enemy2Attack",
        dead: "enemy2Dead",
        speed: 3 * levelConfig.enemySpeedMultiplier,
        health: 80 * levelConfig.enemyHealthMultiplier,
        attackRange: 180,
        points: 250,
      },
    };

    const config = enemyTypes[type];

    const enemy = {
      x: this.camera.x + this.canvas.width + 100,
      y: this.groundConfig.y - 188,
      width: 64 * 4,
      height: 128 * 1.5,

      hitboxOffsetX: 80,
      hitboxOffsetY: 60,
      hitboxWidth: 96,
      hitboxHeight: 136,

      speed: config.speed,
      health: config.health,
      state: "walking",
      direction: "left",
      currentFrame: 0,
      frameCounter: 0,
      attackCooldown: false,
      attackRange: config.attackRange,
      isActive: true,
      type: type,
      points: config.points,

      animations: {
        walking: {
          sprite: config.walk,
          frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
          speed: 0.1,
          loop: true,
        },
        attacking: {
          sprite: config.attack,
          frames: [0, 1, 2, 3, 4],
          speed: 0.15,
          loop: false,
        },
        dead: {
          sprite: config.dead,
          frames: [0, 1, 2, 3, 4],
          speed: 0.1,
          loop: false,
        },
      },
    };

    this.enemies.push(enemy);
  }

  updateEnemies() {
    const levelConfig = this.levels[this.currentLevel];

    this.enemySpawnTimer += 16;
    this.enemy2SpawnTimer += 16;

    if (this.enemySpawnTimer >= levelConfig.enemySpawnInterval) {
      this.spawnEnemy(1);
      this.enemySpawnTimer = 0;
    }

    if (this.enemy2SpawnTimer >= levelConfig.enemy2SpawnInterval) {
      this.spawnEnemy(2);
      this.enemy2SpawnTimer = 0;
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];

      if (!enemy.isActive) {
        this.enemies.splice(i, 1);
        continue;
      }

      this.updateEnemy(enemy);
      this.updateEnemyAnimation(enemy);

      if (enemy.x + enemy.width < this.camera.x - 100) {
        enemy.isActive = false;
      }

      if (enemy.health <= 0 && enemy.state !== "dead") {
        enemy.state = "dead";
        enemy.currentFrame = 0;
        this.score += enemy.points;
        this.updateUI();
      }
    }
  }

  updateEnemy(enemy) {
    if (enemy.state === "dead") return;

    const enemyHitboxX = enemy.x + enemy.hitboxOffsetX;
    const enemyHitboxY = enemy.y + enemy.hitboxOffsetY;

    const deltaX = this.player.x - enemyHitboxX;
    const deltaY = this.player.y - enemyHitboxY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    const playerBottom = this.player.y + this.player.height;
    const enemyHitboxTop = enemyHitboxY;
    const isPlayerAbove = playerBottom < enemyHitboxTop && Math.abs(deltaX) < 150;

    if (distance <= enemy.attackRange && enemy.state !== "attacking" && !isPlayerAbove) {
      enemy.state = "attacking";
      enemy.currentFrame = 0;
    } else if (distance > enemy.attackRange && enemy.state !== "walking") {
      enemy.state = "walking";
    }

    if (enemy.state === "walking") {
      enemy.x -= enemy.speed;
    }

    if (enemy.state === "attacking" && !enemy.attackCooldown && !isPlayerAbove) {
      this.playerHit();
      enemy.attackCooldown = true;
      setTimeout(() => {
        enemy.attackCooldown = false;
      }, 1000);
    }
    
    // ⬇️ AGREGAR ESTO AL FINAL DEL MÉTODO
    this.checkEnemyPitCollision(enemy);
  }

// ⬇️ AGREGAR ESTE NUEVO MÉTODO
checkEnemyPitCollision(enemy) {
  const levelConfig = this.levels[this.currentLevel];
  if (!levelConfig.hasPits) return;
  
  for (const pit of this.pits) {
    const enemyCenterX = enemy.x + enemy.width / 2;
    const enemyBottom = enemy.y + enemy.height;
    
    // Si el enemigo está sobre un precipicio
    if (enemyCenterX > pit.x && 
        enemyCenterX < pit.x + pit.width &&
        enemyBottom >= pit.y - 50) { // Margen de 50px antes de caer
      
      // Marcar enemigo como inactivo (cae y desaparece)
      enemy.isActive = false;
      
      // Opcional: Agregar animación de caída
      enemy.y += 10; // Se cae más rápido
    }
  }
}

  updateEnemyAnimation(enemy) {
    const animation = enemy.animations[enemy.state];

    if (animation.speed > 0) {
      enemy.frameCounter += animation.speed;
      if (enemy.frameCounter >= 1) {
        enemy.currentFrame++;

        if (enemy.currentFrame >= animation.frames.length) {
          if (animation.loop) {
            enemy.currentFrame = 0;
          } else {
            enemy.currentFrame = animation.frames.length - 1;

            if (enemy.state === "dead") {
              setTimeout(() => {
                enemy.isActive = false;
              }, 500);
            }
          }
        }

        enemy.frameCounter = 0;
      }
    } else {
      enemy.currentFrame = 0;
    }
  }

  drawEnemies() {
    for (const enemy of this.enemies) {
      if (!enemy.isActive) continue;

      const animation = enemy.animations[enemy.state];
      const spriteConfig =
        this.enemyConfig[
          animation.sprite.replace("enemy", "").replace("2", "").toLowerCase()
        ];
      const spriteImage = this.images[animation.sprite];

      if (!spriteImage) continue;

      const screenX = enemy.x - this.camera.x;
      const frameIndex = animation.frames[enemy.currentFrame];
      const sx = frameIndex * spriteConfig.frameWidth;

      this.ctx.save();
      this.ctx.scale(-1, 1);
      this.ctx.drawImage(
        spriteImage,
        sx,
        0,
        spriteConfig.frameWidth,
        spriteConfig.frameHeight,
        -screenX - enemy.width,
        enemy.y,
        enemy.width,
        enemy.height
      );
      this.ctx.restore();
    }
  }

  playerHit() {
    this.health -= 10;
    if (this.health <= 0) {
      this.health = 0;
      this.player.state = "dead";
      setTimeout(() => this.gameOver(), 1000);
    }
    this.updateUI();
  }

  checkPlayerAttack() {
    if (this.player.state !== "attacking") return;

    const attackFrame =
      this.player.animations.attacking.frames[this.player.currentFrame];

    if (attackFrame === 2) {
      this.playSoundEffect('swordSlash');
      this.player.soundPlayed = true;
      
      for (const enemy of this.enemies) {
        if (enemy.state === "dead") continue;

        const enemyHitboxX = enemy.x + enemy.hitboxOffsetX;
        const distance = Math.abs(this.player.x - enemyHitboxX);
        const attackRange = 200;

        if (distance <= attackRange) {
          enemy.health -= 25;
        }
      }
      
    }
  }

  playSoundEffect(soundName) {
    const sound = this.audio[soundName];  // 1. Obtiene el audio
    if (!sound) {                         // 2. Verifica que exista
      console.warn(`Sonido "${soundName}" no encontrado`);
      return;
    }
    
    sound.currentTime = 0;                // 3. Reinicia a 0 (permite ataques rápidos)
    sound.play().catch(err => {           // 4. Reproduce el sonido
      console.log('Error reproduciendo efecto:', err);
    });
  }

  // ========== MENÚ Y CONTROLES ==========

  startGame() {
    this.currentLevel = 1;
    this.score = 0;
    this.health = 100;
    this.updateUI();
    this.setState(this.STATES.PLAYING);
  }

  nextLevel() {
    this.currentLevel++;
    if (this.currentLevel > 3) {
      this.showVictory();
    } else {
      this.setState(this.STATES.PLAYING);
    }
  }

  showVictory() {
    this.hideAllScreens();
    this.showScreen("victoryScreen");
    document.getElementById("finalVictoryScore").textContent = `${Math.floor(this.score)}`;
    this.stopMainLoop();
    
    // Crear confetti
    this.createConfetti();
  }

  createConfetti() {
    const confettiContainer = document.getElementById('confetti');
    const colors = ['#FFD700', '#FFA500', '#FF6B35', '#00ff00', '#ff69b4', '#00bfff'];
    
    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = Math.random() * 100 + '%';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDelay = Math.random() * 0.5 + 's';
      confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
      confetti.style.width = Math.random() * 10 + 5 + 'px';
      confetti.style.height = confetti.style.width;
      confettiContainer.appendChild(confetti);
    }
  }

  showInstructions() {
    this.setState(this.STATES.INSTRUCTIONS);
  }

  showCredits() {
    this.setState(this.STATES.CREDITS);
  }

  showMainMenu() {
    this.setState(this.STATES.MAIN_MENU);
  }

  togglePause() {
    if (this.currentState === this.STATES.PLAYING) {
      this.setState(this.STATES.PAUSED);
    } else if (this.currentState === this.STATES.PAUSED) {
      this.resumeGame();
    }
  }

  resumeGame() {
    this.hideAllScreens();
    this.currentState = this.STATES.PLAYING;
    this.showScreen("gameScreen");
    this.startMainLoop();
    // Reanudar música
    if (this.audio.currentMusic) {
      this.audio.currentMusic.play();
    }
  }

  restartGame() {
    this.startGame();
  }

  gameOver() {
    this.setState(this.STATES.GAME_OVER);
  }

  // ========== GAMEPLAY ==========

  startGameplay() {
    this.resizeCanvas();
    this.calculateGroundPosition();
    this.positionPlayerOnGround();
    this.generatePlatforms();
    this.generatePits();
    this.generateClouds();
    this.generateStars();
    this.setupEventListeners();

    const levelConfig = this.levels[this.currentLevel];

    this.player.x = 100;
    this.player.state = "idle";
    this.player.isMoving = false;
    this.player.isJumping = false;
    this.player.jumpVelocity = 0;
    this.camera.x = 0;
    this.enemies = [];
    this.enemySpawnTimer = 0;
    this.enemy2SpawnTimer = 0;

    if (this.currentLevel === 1) {
      this.health = 100;
      this.score = 0;
    }

    this.updateUI();
  }

  updateGameplay() {
    if (this.currentState !== this.STATES.PLAYING) return;

    this.updatePlayer();
    this.updatePlayerPhysics();
    this.updatePlayerAnimation();
    this.updateEnemies();
    this.updateCamera();
    this.checkPlayerAttack();
    this.checkLevelComplete(); // ⬅️ AQUÍ ES DONDE SE VERIFICA LA META
    this.updateGoalDistance();
  }

  updateUI() {
    document.getElementById("score").textContent = `${Math.floor(this.score)}`;
    
    const healthPercent = this.health;
    const healthBar = document.getElementById("healthBar");
    const healthText = document.getElementById("healthText");
    
    healthBar.style.width = healthPercent + "%";
    healthText.textContent = Math.floor(healthPercent) + "%";
    
    if (healthPercent <= 30) {
      healthBar.classList.add("low-health");
    } else {
      healthBar.classList.remove("low-health");
    }
    
    document.getElementById("enemies").textContent = `${this.enemies.length}`;
    
    // Mostrar nivel actual
    const levelDisplay = document.getElementById("levelDisplay");
    if (levelDisplay) {
      levelDisplay.textContent = `NIVEL ${this.currentLevel}`;
    }
  }

  // ========== EVENT LISTENERS ==========

  setupEventListeners() {
    window.addEventListener("resize", () => this.resizeCanvas());

    window.addEventListener("keydown", (e) => {
      if (this.currentState === this.STATES.PLAYING) {
        this.handleKeyDown(e);
      }

      if (e.key === "Escape") {
        this.togglePause();
      }
    });

    window.addEventListener("keyup", (e) => this.handleKeyUp(e));
    this.canvas.addEventListener("click", () => this.attack());

    const pauseBtn = document.getElementById("pauseBtn");
    if (pauseBtn) {
      pauseBtn.addEventListener("click", () => this.togglePause());
    }

    window.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && this.currentState === this.STATES.PLAYING) {
        this.attack();
      }
    });
  }

  handleKeyDown(e) {
    switch (e.key) {
      case "ArrowLeft":
      case "a":
        this.player.isMoving = true;
        this.player.direction = "left";
        break;
      case "ArrowRight":
      case "d":
        this.player.isMoving = true;
        this.player.direction = "right";
        break;
      case " ":
      case "w":
      case "ArrowUp":
        e.preventDefault();
        this.jump();
        break;
    }
  }

  handleKeyUp(e) {
    if (["ArrowLeft", "ArrowRight", "a", "d"].includes(e.key)) {
      this.player.isMoving = false;
    }
  }

  // ========== GAME LOOP ==========

  gameLoop() {
    this.rafId = null;

    if (this.currentState !== this.STATES.PLAYING) return;

    this.updateGameplay();

    this.ctx.fillStyle = "#1a1a1a";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawBackground();
    this.drawStars();
    this.drawClouds();
    this.drawGround();
    this.drawPits();
    this.drawPlatforms();
    this.drawGoalMarker();
    this.drawEnemies();
    this.drawPlayer();

    this.rafId = requestAnimationFrame(this.gameLoop.bind(this));
  }

  // ========== RENDERIZADO ==========

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.calculateGroundPosition();
    this.positionPlayerOnGround();
  }

  calculateGroundPosition() {
    this.groundConfig.y = this.canvas.height - this.groundConfig.height;
  }

  positionPlayerOnGround() {
    this.player.y = this.groundConfig.y - this.player.height;
  }

  generateClouds() {
    this.clouds = [];
    for (let i = 0; i < 20; i++) {
      this.clouds.push({
        x: Math.random() * this.levelWidth,
        y: Math.random() * 200 + 50,
        scale: Math.random() * 0.5 + 0.5,
        speed: Math.random() * 0.2 + 0.1,
      });
    }
  }

  generateStars() {
    this.stars = [];
    if (this.currentLevel === 2) {
      for (let i = 0; i < 100; i++) {
        this.stars.push({
          x: Math.random() * this.levelWidth,
          y: Math.random() * (this.canvas.height - 200),
          size: Math.random() * 2 + 1,
          brightness: Math.random(),
          twinkleSpeed: Math.random() * 0.02 + 0.01
        });
      }
    }
  }

  drawBackground() {
    const levelConfig = this.levels[this.currentLevel];
    this.ctx.fillStyle = levelConfig.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    if (this.currentLevel === 2) {
      const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      gradient.addColorStop(0, '#0a0a1a');
      gradient.addColorStop(1, '#1a1a3a');
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  drawStars() {
    if (this.currentLevel !== 2) return;
    
    for (let star of this.stars) {
      const parallaxOffset = this.camera.x * 0.1;
      const screenX = star.x - parallaxOffset;
      
      star.brightness += star.twinkleSpeed;
      if (star.brightness >= 1 || star.brightness <= 0) {
        star.twinkleSpeed *= -1;
      }
      
      this.ctx.save();
      this.ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
      this.ctx.beginPath();
      this.ctx.arc(screenX % (this.levelWidth + 100), star.y, star.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }
    
    // Dibujar luna
    const moonX = 200 - this.camera.x * 0.05;
    const moonY = 100;
    const moonRadius = 60;
    
    this.ctx.save();
    this.ctx.fillStyle = '#f0e68c';
    this.ctx.shadowColor = '#f0e68c';
    this.ctx.shadowBlur = 30;
    this.ctx.beginPath();
    this.ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.fillStyle = 'rgba(200, 200, 150, 0.3)';
    this.ctx.shadowBlur = 0;
    this.ctx.beginPath();
    this.ctx.arc(moonX - 15, moonY - 10, 12, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.arc(moonX + 20, moonY + 5, 8, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.arc(moonX - 5, moonY + 20, 10, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.restore();
  }

  drawClouds() {
    if (!this.images.cloud) return;
    
    const levelConfig = this.levels[this.currentLevel];

    for (let cloud of this.clouds) {
      const parallaxOffset = this.camera.x * cloud.speed;
      const screenX = cloud.x - parallaxOffset;

      let cloudX = screenX;
      if (cloudX + this.images.cloud.width * cloud.scale < 0) {
        cloud.x += this.levelWidth + this.images.cloud.width * 2;
      }

      if (cloudX < this.canvas.width) {
        this.ctx.save();
        this.ctx.globalAlpha = levelConfig.cloudAlpha;
        
        if (this.currentLevel === 2) {
          this.ctx.filter = 'brightness(0.4) sepia(1) hue-rotate(180deg)';
        }

        this.ctx.drawImage(
          this.images.cloud,
          cloudX,
          cloud.y,
          this.images.cloud.width * cloud.scale,
          this.images.cloud.height * cloud.scale
        );
        this.ctx.restore();
      }
    }
  }

  drawGround() {
    if (!this.images.ground) return;
    const startTile = Math.floor(this.camera.x / this.images.ground.width);
    const endTile = Math.ceil(
      (this.camera.x + this.canvas.width) / this.images.ground.width
    );

    for (let i = startTile; i <= endTile; i++) {
      const screenX = i * this.images.ground.width - this.camera.x;
      
      let isPit = false;
      for (const pit of this.pits) {
        if (screenX >= pit.x - this.camera.x && 
            screenX < pit.x + pit.width - this.camera.x) {
          isPit = true;
          break;
        }
      }
      
      if (!isPit) {
        this.ctx.save();
        
        if (this.currentLevel === 2) {
          this.ctx.filter = 'brightness(0.5)';
        }

        this.ctx.drawImage(
          this.images.ground,
          screenX,
          this.groundConfig.y,
          this.images.ground.width,
          this.groundConfig.height
        );
        this.ctx.restore();
      }
    }
  }

  drawGoalMarker() {
    const levelConfig = this.levels[this.currentLevel];
    const goalX = levelConfig.goalX - this.camera.x;
    
    // Solo dibujar si está visible en pantalla
    if (goalX < -100 || goalX > this.canvas.width + 100) return;
    
    this.ctx.save();
    
    // Animación de pulso
    const pulseTime = Date.now() / 500;
    const pulseScale = 1 + Math.sin(pulseTime) * 0.1;
    
    // PORTAL DE META GRANDE
    const portalCenterX = goalX + 50;
    const portalCenterY = this.groundConfig.y - 100;
    const portalRadius = 80 * pulseScale;
    
    // Resplandor exterior
    const gradient = this.ctx.createRadialGradient(
      portalCenterX, portalCenterY, 0,
      portalCenterX, portalCenterY, portalRadius
    );
    gradient.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
    gradient.addColorStop(0.5, 'rgba(255, 165, 0, 0.5)');
    gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(portalCenterX, portalCenterY, portalRadius, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Portal interior (círculo dorado)
    this.ctx.fillStyle = '#FFD700';
    this.ctx.shadowColor = '#FFD700';
    this.ctx.shadowBlur = 30;
    this.ctx.beginPath();
    this.ctx.arc(portalCenterX, portalCenterY, 60, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Borde del portal
    this.ctx.strokeStyle = '#FFA500';
    this.ctx.lineWidth = 5;
    this.ctx.shadowBlur = 0;
    this.ctx.stroke();
    
    // Texto "META" grande
    this.ctx.fillStyle = '#000000';
    this.ctx.shadowColor = '#FFD700';
    this.ctx.shadowBlur = 10;
    this.ctx.font = 'bold 36px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('META', portalCenterX, portalCenterY);
    
    // Texto flotante arriba
    this.ctx.shadowBlur = 0;
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 20px Arial';
    const floatY = portalCenterY - 100 + Math.sin(Date.now() / 300) * 5;
    this.ctx.fillText('¡Llega aquí para completar!', portalCenterX, floatY);
    
    // Flecha indicadora si está fuera de vista
    const distanceToGoal = levelConfig.goalX - (this.camera.x + this.canvas.width);
    if (distanceToGoal > 0) {
      // Dibujar flecha en el borde derecho
      const arrowX = this.canvas.width - 80;
      const arrowY = 100;
      
      this.ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';
      this.ctx.beginPath();
      this.ctx.moveTo(arrowX, arrowY);
      this.ctx.lineTo(arrowX + 30, arrowY - 20);
      this.ctx.lineTo(arrowX + 30, arrowY + 20);
      this.ctx.closePath();
      this.ctx.fill();
      
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = 'bold 18px Arial';
      this.ctx.textAlign = 'right';
      this.ctx.fillText(`META →`, arrowX - 10, arrowY + 5);
      this.ctx.fillText(`${Math.floor(distanceToGoal)}px`, arrowX - 10, arrowY + 25);
    }
    
    this.ctx.restore();
  }
  
  // Método para mostrar distancia a la meta en UI
  updateGoalDistance() {
    const levelConfig = this.levels[this.currentLevel];
    const distanceToGoal = Math.max(0, levelConfig.goalX - this.player.x);
    
    const goalDistanceElement = document.getElementById('goalDistance');
    if (goalDistanceElement) {
      if (distanceToGoal > 0) {
        goalDistanceElement.textContent = `META: ${Math.floor(distanceToGoal)}px`;
        goalDistanceElement.style.display = 'block';
      } else {
        goalDistanceElement.style.display = 'none';
      }
    }
  }

  drawPlayer() {
    const animation = this.player.animations[this.player.state];
    const spriteConfig = this.player.spriteConfig[animation.sprite];
    const spriteImage = this.images[animation.sprite];

    if (!spriteImage) return;

    const screenX = this.player.x - this.camera.x;
    const frameIndex = animation.frames[this.player.currentFrame];
    const sx = frameIndex * spriteConfig.frameWidth;

    this.ctx.save();

    if (this.player.direction === "left") {
      this.ctx.scale(-1, 1);
      this.ctx.drawImage(
        spriteImage,
        sx,
        0,
        spriteConfig.frameWidth,
        spriteConfig.frameHeight,
        -screenX - this.player.width,
        this.player.y,
        this.player.width,
        this.player.height
      );
    } else {
      this.ctx.drawImage(
        spriteImage,
        sx,
        0,
        spriteConfig.frameWidth,
        spriteConfig.frameHeight,
        screenX,
        this.player.y,
        this.player.width,
        this.player.height
      );
    }

    this.ctx.restore();
  }

  updatePlayer() {
    if (this.player.state === "dead") return;
    if (this.player.state === "attacking") return;

    if (this.player.isMoving) {
      if (this.player.direction === "right") {
        this.player.x += this.player.speed;
      } else {
        this.player.x -= this.player.speed;
      }
    }

    this.player.x = Math.max(
      0,
      Math.min(this.player.x, this.levelWidth - this.player.width)
    );
  }

  updateCamera() {
    const targetX = this.player.x - this.canvas.width * 0.3;
    this.camera.x = Math.max(
      0,
      Math.min(targetX, this.levelWidth - this.canvas.width)
    );
  }

  updatePlayerAnimation() {
    const animation = this.player.animations[this.player.state];

    if (animation.speed > 0) {
      this.player.frameCounter += animation.speed;
      if (this.player.frameCounter >= 1) {
        this.player.currentFrame++;

        if (this.player.currentFrame >= animation.frames.length) {
          if (animation.loop) {
            this.player.currentFrame = 0;
          } else {
            this.player.currentFrame = animation.frames.length - 1;
            if (this.player.state === "attacking") {
              this.finishAttack();
            }
          }
        }

        this.player.frameCounter = 0;
      }
    } else {
      this.player.currentFrame = 0;
    }

    if (this.player.state !== "attacking" && this.player.state !== "dead") {
      if (this.player.isMoving) {
        this.player.state = "walking";
      } else {
        this.player.state = "idle";
      }
    }
  }

  attack() {
    if (
      this.player.state !== "attacking" &&
      !this.player.attackCooldown &&
      this.player.state !== "dead"
    ) {
      this.player.state = "attacking";
      this.player.currentFrame = 0;
      this.player.attackCooldown = true;
    }
  }

  finishAttack() {
    this.player.attackCooldown = false;
      this.player.soundPlayed = false; 
    this.player.state = "idle";
  }
}

// Inicializar juego
const game = new ArcadeShooter();