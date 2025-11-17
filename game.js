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
      INSTRUCTIONS: "instructions",
      CREDITS: "credits",
    };

    this.currentState = this.STATES.LOADING;
    this.gameState = "playing";

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
      speed: 5,
      isMoving: false,
      direction: "right",
      state: "idle",
      attackCooldown: false,
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
    this.groundConfig = { height: 100, y: 0 };

    this.loadAssets();
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
        break;
      case this.STATES.PLAYING:
        this.showScreen("gameScreen");
        this.startGameplay();
        // Asegurar que el loop principal esté activo
        this.startMainLoop();
        break;
      case this.STATES.PAUSED:
        this.showScreen("pauseScreen");
        // Detener el loop de animación cuando esté en pausa
        this.stopMainLoop();
        break;
      case this.STATES.GAME_OVER:
        this.showScreen("gameOverScreen");
        document.getElementById(
          "finalScore"
        ).textContent = `PUNTUACIÓN: ${this.score}`;
        break;
      case this.STATES.INSTRUCTIONS:
        this.showScreen("instructionsScreen");
        break;
      case this.STATES.CREDITS:
        this.showScreen("creditsScreen");
        break;
    }
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
      { name: "platform", src: "assets/images/plataforma.png" },
    ];

    let loadedCount = 0;
    const totalAssets = assets.length;

    assets.forEach((asset) => {
      const img = new Image();
      img.onload = () => {
        loadedCount++;
        this.images[asset.name] = img;

        const progress = (loadedCount / totalAssets) * 100;
        document.querySelector(
          ".loader-text"
        ).textContent = `Cargando... ${Math.round(progress)}%`;

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

  // ========== SISTEMA DE PLATAFORMAS ==========

  generatePlatforms() {
    this.platforms = [];
    this.hearts = [];

    const fixedPlatforms = [
      { x: 500, y: 400, width: 200, height: 20 },
      { x: 1000, y: 250, width: 150, height: 20 },
      { x: 1500, y: 400, width: 180, height: 20 },
      { x: 2200, y: 320, width: 220, height: 20 },
      { x: 3000, y: 280, width: 170, height: 20 },
      { x: 3800, y: 350, width: 190, height: 20 },
    ];

    fixedPlatforms.forEach((platform) => {
      this.platforms.push(platform);

      this.hearts.push({
        x: platform.x + platform.width / 2 - 25,
        y: platform.y - 50,
        width: 50,
        height: 50,
        collected: false,
      });
    });
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
    // Dibujar plataformas CON PATRÓN REPETIDO
    for (const platform of this.platforms) {
        const screenX = platform.x - this.camera.x;
        
        if (this.images.ground) {
            // Calcular cuántas veces cabe la imagen
            const imageWidth = this.images.ground.width;
            const imageHeight = this.images.ground.height;
            const numTilesX = Math.ceil(platform.width / imageWidth);
            
            // Dibujar cada "tile" (repetición)
            for (let i = 0; i < numTilesX; i++) {
                const tileX = screenX + (i * imageWidth);
                
                // Calcular si es el último tile (puede ser parcial)
                const remainingWidth = platform.width - (i * imageWidth);
                const drawWidth = Math.min(imageWidth, remainingWidth);
                
                // Dibujar tile completo o parcial
                this.ctx.drawImage(
                    this.images.ground,
                    0, 0,                           // Posición de recorte en la imagen
                    drawWidth, imageHeight,          // Tamaño de recorte
                    tileX, platform.y,              // Posición en canvas
                    drawWidth, platform.height      // Tamaño en canvas
                );
            }
        } else {
            // Fallback
            this.ctx.fillStyle = '#8B4513';
            this.ctx.fillRect(screenX, platform.y, platform.width, platform.height);
        }
        
        // Sombra
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(screenX, platform.y + platform.height, platform.width, 5);
    }
    
    // Corazones
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

  // ========== FÍSICA DEL JUGADOR ==========

  updatePlayerPhysics() {
    // Aplicar gravedad constante
    this.player.jumpVelocity += this.player.gravity;

    // Limitar velocidad de caída
    if (this.player.jumpVelocity > this.player.maxFallSpeed) {
      this.player.jumpVelocity = this.player.maxFallSpeed;
    }

    // Actualizar posición vertical
    this.player.y += this.player.jumpVelocity;

    // Verificar colisión con plataformas
    this.checkPlatformCollision();

    // Verificar colisión con corazones
    this.checkHeartCollision();

    // Verificar colisión con el suelo principal
    const groundLevel = this.groundConfig.y - this.player.height;
    if (this.player.y >= groundLevel) {
      this.player.y = groundLevel;
      this.player.isJumping = false;
      this.player.onPlatform = false;
      this.player.jumpVelocity = 0;
    }
  }

  jump() {
    // Solo saltar si está en el suelo o en una plataforma
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
    const enemyTypes = {
      1: {
        walk: "enemyWalk",
        attack: "enemyAttack",
        dead: "enemyDead",
        speed: 2,
        health: 100,
        attackRange: 150,
        points: 150,
      },
      2: {
        walk: "enemy2Walk",
        attack: "enemy2Attack",
        dead: "enemy2Dead",
        speed: 3,
        health: 80,
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

      hitboxOffsetX: 80, // Margen izquierdo de la hitbox
      hitboxOffsetY: 60, // Margen superior de la hitbox
      hitboxWidth: 96, // Ancho real de colisión (más pequeño)
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
    this.enemySpawnTimer += 16;
    this.enemy2SpawnTimer += 16;

    if (this.enemySpawnTimer >= this.enemySpawnInterval) {
      this.spawnEnemy(1);
      this.enemySpawnTimer = 0;
      this.enemySpawnInterval = Math.max(1000, this.enemySpawnInterval - 30);
    }

    if (this.enemy2SpawnTimer >= this.enemy2SpawnInterval) {
      this.spawnEnemy(2);
      this.enemy2SpawnTimer = 0;
      this.enemy2SpawnInterval = Math.max(3000, this.enemy2SpawnInterval - 50);
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

    // ⬇️ CALCULAR DISTANCIA EN 2D (X e Y)
    const deltaX = this.player.x - enemyHitboxX;
    const deltaY = this.player.y - enemyHitboxY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Verificar si el jugador está ENCIMA del enemigo
    const playerBottom = this.player.y + this.player.height;
    const enemyHitboxTop = enemyHitboxY;
    const isPlayerAbove =
      playerBottom < enemyHitboxTop && Math.abs(deltaX) < 150;
    // ⬆️ FIN CAMBIO

    if (
      distance <= enemy.attackRange &&
      enemy.state !== "attacking" &&
      !isPlayerAbove
    ) {
      enemy.state = "attacking";
      enemy.currentFrame = 0;
    } else if (distance > enemy.attackRange && enemy.state !== "walking") {
      enemy.state = "walking";
    }

    if (enemy.state === "walking") {
      enemy.x -= enemy.speed;
    }

    if (
      enemy.state === "attacking" &&
      !enemy.attackCooldown &&
      !isPlayerAbove
    ) {
      this.playerHit();
      enemy.attackCooldown = true;
      setTimeout(() => {
        enemy.attackCooldown = false;
      }, 1000);
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

      // ⬇️ DEBUG: Dibujar HITBOX REAL
    //   this.ctx.strokeStyle = "red";
    //   this.ctx.lineWidth = 2;
    //   this.ctx.strokeRect(
    //     screenX + enemy.hitboxOffsetX,
    //     enemy.y + enemy.hitboxOffsetY,
    //     enemy.hitboxWidth,
    //     enemy.hitboxHeight
    //   );
      // ⬆️ FIN DEBUG
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
      for (const enemy of this.enemies) {
        if (enemy.state === "dead") continue;

        // Usar HITBOX del enemigo
        const enemyHitboxX = enemy.x + enemy.hitboxOffsetX;
        const distance = Math.abs(this.player.x - enemyHitboxX);
        const attackRange = 200;

        if (distance <= attackRange) {
          enemy.health -= 25;
        }
      }
    }
  }

  // ========== MENÚ Y CONTROLES ==========

  startGame() {
    this.score = 0;
    this.health = 100;
    this.updateUI();
    this.setState(this.STATES.PLAYING);
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
      // Reanudar sin reiniciar todo (no llamar a startGameplay)
      this.resumeGame();
    }
  }

  // Reanuda el juego desde pausa sin reiniciar variables ni volver al inicio
  resumeGame() {
    // Ocultar pantallas y mostrar el gameScreen
    this.hideAllScreens();
    this.currentState = this.STATES.PLAYING;
    this.showScreen("gameScreen");
    // Reanudar loop principal
    this.startMainLoop();
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
    this.generateClouds();
    this.setupEventListeners();

    // Reiniciar todo
    this.player.x = 100;
    this.player.state = "idle";
    this.player.isMoving = false;
    this.player.isJumping = false;
    this.player.jumpVelocity = 0;
    this.camera.x = 0;
    this.enemies = [];
    this.enemySpawnTimer = 0;
    this.enemySpawnInterval = 2000;
    this.enemy2SpawnTimer = 0;
    this.enemy2SpawnInterval = 5000;
    this.health = 100;
    this.score = 0;
    this.updateUI();

  }

  updateGameplay() {
    if (this.currentState !== this.STATES.PLAYING) return;

    this.updatePlayer();
    this.updatePlayerPhysics(); // ACTIVADO
    this.updatePlayerAnimation();
    this.updateEnemies();
    this.updateCamera();
    this.checkPlayerAttack();
  }

  updateUI() {
    document.getElementById("score").textContent = `${Math.floor(this.score)}`;
    
    // Actualizar barra de vida
    const healthPercent = this.health;
    const healthBar = document.getElementById("healthBar");
    const healthText = document.getElementById("healthText");
    
    healthBar.style.width = healthPercent + "%";
    healthText.textContent = Math.floor(healthPercent) + "%";
    
    // Cambiar color si la salud es baja
    if (healthPercent <= 30) {
      healthBar.classList.add("low-health");
    } else {
      healthBar.classList.remove("low-health");
    }
    
    document.getElementById("enemies").textContent = `${this.enemies.length}`;
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

    // Agregar onclick al botón de pausa
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
        e.preventDefault(); // Evitar scroll con espacio
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
    // Ejecutado por RAF; gestionar rafId para poder cancelarlo al pausar
    this.rafId = null;

    if (this.currentState !== this.STATES.PLAYING) return;

    this.updateGameplay();

    this.ctx.fillStyle = "#1a1a1a";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawBackground();
    this.drawClouds();
    this.drawGround();
    this.drawPlatforms();
    this.drawEnemies();
    this.drawPlayer();

    // Programar el siguiente frame y guardar el id
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

  drawBackground() {
    this.ctx.fillStyle = "#6262F8";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawClouds() {
    if (!this.images.cloud) return;
    for (let cloud of this.clouds) {
      const parallaxOffset = this.camera.x * cloud.speed;
      const screenX = cloud.x - parallaxOffset;

      let cloudX = screenX;
      if (cloudX + this.images.cloud.width * cloud.scale < 0) {
        cloud.x += this.levelWidth + this.images.cloud.width * 2;
      }

      if (cloudX < this.canvas.width) {
        this.ctx.save();
        this.ctx.globalAlpha = 0.8;
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
      this.ctx.drawImage(
        this.images.ground,
        screenX,
        this.groundConfig.y,
        this.images.ground.width,
        this.groundConfig.height
      );
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

    // Actualizar estado de animación
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
    this.player.state = "idle";
  }
}

// Inicializar juego
const game = new ArcadeShooter();
