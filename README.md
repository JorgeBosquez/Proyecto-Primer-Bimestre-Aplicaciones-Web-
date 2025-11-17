# 🎮 ARCADE SHOOTER

Un emocionante juego de plataformas y combate desarrollado con **HTML5 Canvas, CSS3 y JavaScript vanilla**. Completa 3 niveles cada vez más desafiantes, evita precipicios, derrota enemigos y llega a la meta.

---

## 📋 Tabla de Contenidos

- [Características](#características)
- [Cómo Ejecutar](#cómo-ejecutar)
- [Controles](#controles)
- [Estructura del Juego](#estructura-del-juego)
- [Niveles](#niveles)
- [Mecánicas de Juego](#mecánicas-de-juego)
- [Estructura de Archivos](#estructura-de-archivos)
- [Desarrolladores](#desarrolladores)

---

## ✨ Características

### 🎯 Jugabilidad Dinámmica
- **3 niveles progresivos** con dificultad incremental
- **Física realista** con gravedad y saltos
- **Sistema de plataformas** variadas
- **Enemigos inteligentes** con comportamiento AI
- **Sistema de combate** con cooldown de ataque

### 🎨 Visual Atractivo
- **Animaciones fluidas** de personajes y enemigos
- **Efectos visuales** dinámicos (resplandor, partículas)
- **Interfaz moderna** con transiciones suaves
- **Temas temáticos** por nivel (día, noche, infierno)
- **Confetti y efectos de victoria**

### 🎵 Audio y Feedback
- **UI responsiva** con animaciones
- **Indicadores visuales** de salud
- **Sistema de puntuación** en tiempo real
- **Pantallas de transición** elegantes

---

## 🚀 Cómo Ejecutar

### Opción 1: Navegador Local (Recomendado)
1. Descarga o clona el repositorio
2. Abre `index.html` directamente en tu navegador
3. ¡El juego cargará automáticamente!

### Opción 2: Servidor Local
Si experimentas problemas de CORS con las imágenes:

```bash
# Con Python 3
python -m http.server 8000

# Con Node.js (http-server)
npx http-server

# Con Live Server en VS Code
# Instala la extensión "Live Server" y haz clic derecho > "Open with Live Server"
```

Luego abre: `http://localhost:8000` (o el puerto que indique tu servidor)

### Requisitos Mínimos
- Navegador moderno (Chrome, Firefox, Safari, Edge)
- JavaScript habilitado
- Resolución mínima: 1024x768px (responsive)

---

## 🎮 Controles

### Movimiento y Salto
| Acción | Controles |
|--------|-----------|
| Moverse Izquierda | `← Arrow Left` o `A` |
| Moverse Derecha | `→ Arrow Right` o `D` |
| Saltar | `SPACE`, `W` o `↑ Arrow Up` |

### Combate y Pausa
| Acción | Controles |
|--------|-----------|
| Atacar | `CLICK` (ratón) o `ENTER` |
| Pausar/Reanudar | `ESC` o botón `⏸` en pantalla |

### Navegación Menús
| Acción | Controles |
|--------|-----------|
| Seleccionar Botón | `CLICK` (ratón) |
| Navegar Menús | Botones en pantalla |

---

## 🎮 Estructura del Juego

### Sistema de Estados
```
LOADING → MAIN_MENU → PLAYING → LEVEL_COMPLETE → NEXT_LEVEL
   ↓          ↓           ↓           ↓              ↓
LOADING   INSTRUCTIONS  PAUSED    VICTORY      GAME_OVER
          CREDITS       GAME_OVER
```

### Componentes Principales

#### 1. **Jugador (Player)**
- Posición: (x, y) en el mapa
- Física: Gravedad, salto, velocidad
- Estados: `idle`, `walking`, `attacking`, `dead`
- Vida: 0-100%
- Ataque: Rango 200px, daño 25 por golpe

#### 2. **Enemigos**
- **Tipo 1 (Enemigo Normal)**: Velocidad base, salud normal
- **Tipo 2 (Enemigo Rápido)**: Más rápido, menos salud
- Comportamiento: Patrulla → Ataque cuando está cerca
- Rango de ataque: 150-180px
- Caen en precipicios

#### 3. **Plataformas**
- Bases sólidas para caminar
- Colisiones precisas (pixel-perfect)
- Cada plataforma puede tener un corazón ❤️ (vida extra)

#### 4. **Precipicios (Pits)**
- Áreas sin piso
- Muerte instantánea si caes
- Disponibles en niveles 2 y 3

---

## 🎯 Niveles

### Nivel 1: Día Soleado ☀️
- **Dificultad**: Fácil
- **Enemigos**: Velocidad x1
- **Características**: Sin precipicios
- **Objetivo**: Llegar a x: 4800
- **Plataformas**: 6

**Consejo**: Perfecto para aprender los controles y mecánicas básicas.

### Nivel 2: Noche Peligrosa 🌙
- **Dificultad**: Media
- **Enemigos**: Velocidad x1.4
- **Características**: 3 precipicios grandes
- **Objetivo**: Llegar a x: 4500
- **Plataformas**: 8 (distribuidas entre precipicios)

**Consejo**: Necesitas saltar con precisión entre plataformas. Los precipicios son tu peor enemigo.

### Nivel 3: Infierno Ardiente 🔥
- **Dificultad**: Muy Difícil
- **Enemigos**: Velocidad x1.8, más numerosos
- **Características**: 3 precipicios enormes, enemigos fuertes
- **Objetivo**: Llegar a x: 4000
- **Plataformas**: 7 (muy distanciadas)

**Consejo**: Combina movimiento preciso con combate. Derrota enemigos para ganar puntos.

---

## ⚙️ Mecánicas de Juego

### Sistema de Salud
```
Vida Inicial: 100%
Por ataque enemigo: -10%
Coleccionar corazón: +100% (restaura totalmente)
Muerte: 0%
```

### Sistema de Puntuación
```
Enemigo Tipo 1: +150 puntos
Enemigo Tipo 2: +250 puntos
Multiplicador por nivel: Dinámico
Puntuación es acumulativa entre niveles
```

### Física del Jugador
```
Gravedad: 0.6 unidades/frame
Velocidad Máxima de Caída: 15 unidades/frame
Velocidad de Movimiento: 10 unidades/frame
Potencia de Salto: -15 unidades/frame (velocidad inicial)
```

### Comportamiento de Enemigos
```
PATRULLA: Camina buscando al jugador
          Si distancia > rango_ataque:
            → Continúa patrullando
            
ATAQUE: Si distancia ≤ rango_ataque:
        → Se detiene y ataca
        → Cooldown de 1 segundo entre ataques
        → Daño: 10% vida del jugador
        
MUERTE: Si salud ≤ 0:
        → Animación de muerte
        → Suma puntos
```

---

## 📁 Estructura de Archivos

```
Proyecto-Primer-Bimestre-Aplicaciones-Web/
│
├── 📄 index.html                 # Estructura HTML principal
├── 🎨 style.css                  # Estilos y animaciones CSS3
├── 🎮 game.js                    # Lógica principal del juego
├── 📖 README.md                  # Este archivo
│
└── 📁 assets/                    # Recursos del juego
    └── 📁 images/
        ├── 🖼️ piso.jpg            # Textura de plataforma/piso
        ├── ☁️ nube.png            # Nubes (decoración)
        ├── ❤️ vida.png            # Sprite de corazón (vida)
        │
        ├── 📁 player/
        │   ├── Walk.png           # 7 frames de caminar
        │   ├── Attack_1.png       # 5 frames de ataque
        │   └── Dead.png           # 4 frames de muerte
        │
        ├── 📁 enemy/
        │   ├── Walk.png           # Animación enemigo normal
        │   ├── Attack.png         # Ataque enemigo normal
        │   └── Dead.png           # Muerte enemigo normal
        │
        └── 📁 enemy2/
            ├── Walk.png           # Animación enemigo rápido
            ├── Attack.png         # Ataque enemigo rápido
            └── Dead.png           # Muerte enemigo rápido
```

---

## 🔧 Estructura de Código (game.js)

### Clases y Objetos Principales

#### `ArcadeShooter`
Clase principal que controla todo el juego.

**Propiedades:**
- `this.canvas`: Canvas del HTML5
- `this.currentLevel`: Nivel actual (1-3)
- `this.score`: Puntuación total
- `this.health`: Salud del jugador (0-100)
- `this.player`: Objeto del jugador con física
- `this.enemies`: Array de enemigos activos
- `this.platforms`: Array de plataformas
- `this.pits`: Array de precipicios

**Métodos Principales:**
```javascript
// Ciclo de vida
loadAssets()              // Carga todas las imágenes
startGame()               // Inicia el juego
gameLoop()                // Bucle principal (60 FPS)
updateGameplay()          // Actualiza física y colisiones
renderGame()              // Dibuja en canvas

// Gestión de estados
setState(newState)        // Cambia estado del juego
showScreen(screenId)      // Muestra pantalla HTML
hideAllScreens()          // Oculta todas las pantallas

// Movimiento y física
updatePlayer()            // Actualiza posición del jugador
updatePlayerPhysics()     // Aplica gravedad y colisiones
jump()                    // Hace saltar al jugador
updateCamera()            // Sigue al jugador con cámara

// Combate
attack()                  // Ataca (cooldown de 0.6s)
checkPlayerAttack()       // Verifica daño a enemigos
playerHit()               // Jugador recibe daño

// Enemigos
spawnEnemy(type)          // Crea nuevo enemigo
updateEnemies()           // Actualiza todos los enemigos
updateEnemy(enemy)        // Física individual del enemigo
checkEnemyPitCollision()  // Enemigo cae en precipicio

// Niveles
generatePlatforms()       // Genera plataformas del nivel
generatePits()            // Genera precipicios del nivel
checkLevelComplete()      // Verifica si llegó a la meta
nextLevel()               // Avanza al siguiente nivel
showVictory()             // Muestra pantalla de victoria

// Renderizado
drawPlayer()              // Dibuja al jugador
drawEnemies()             // Dibuja enemigos
drawPlatforms()           // Dibuja plataformas
drawPits()                // Dibuja precipicios
drawGoalMarker()          // Dibuja el portal de meta
drawBackground()          // Dibuja fondo del nivel
drawClouds()              // Dibuja nubes
drawStars()               // Dibuja estrellas (nivel 2)
```

### Objeto del Jugador
```javascript
this.player = {
    x, y,                 // Posición
    width, height,        // Dimensiones
    speed,                // Velocidad de movimiento
    direction,            // "left" o "right"
    state,                // "idle", "walking", "attacking", "dead"
    
    // Física
    isJumping,            // ¿En el aire?
    jumpVelocity,         // Velocidad vertical
    jumpPower,            // Potencia del salto
    gravity,              // Aceleración de caída
    maxFallSpeed,         // Velocidad máxima de caída
    onPlatform,           // ¿Sobre una plataforma?
    
    // Combate
    attackCooldown,       // Tiempo entre ataques
    
    // Animación
    currentFrame,         // Frame actual de animación
    frameCounter,         // Contador para cambiar frame
    animations: {
        idle: {...},
        walking: {...},
        attacking: {...},
        dead: {...}
    }
}
```

### Objeto del Enemigo
```javascript
enemy = {
    x, y,                 // Posición
    width, height,        // Dimensiones
    speed,                // Velocidad de movimiento
    health,               // Salud actual
    state,                // "walking" o "attacking"
    direction,            // "left" o "right"
    attackRange,          // Distancia para atacar
    points,               // Puntos por derrotar
    type,                 // 1 o 2 (tipo de enemigo)
    
    // Hitbox preciso
    hitboxOffsetX,        // Offset del hitbox X
    hitboxOffsetY,        // Offset del hitbox Y
    hitboxWidth,          // Ancho del hitbox
    hitboxHeight,         // Alto del hitbox
    
    // Animación similar al jugador
}
```

---

## 🎬 Flujo de Ejecución

```
1. PAGE LOAD
   ↓
2. LOADING SCREEN
   ├─ Cargar todas las imágenes (async)
   ├─ Mostrar barra de progreso
   └─ Cuando completa → MAIN_MENU
   
3. MAIN_MENU
   ├─ Mostrar preview del personaje (animado)
   ├─ Opciones: JUGAR, INSTRUCCIONES, CRÉDITOS
   └─ Si JUGAR → PLAYING (Nivel 1)
   
4. PLAYING (Game Loop)
   ├─ Entrada: Procesar teclado
   ├─ Actualizar: Física, colisiones, enemigos
   ├─ Renderizar: Dibujar todo en canvas
   ├─ Verificar: ¿Nivel completado? ¿Juego Over?
   └─ Repetir 60 FPS
   
5. PAUSED
   ├─ Detener animaciones
   ├─ Mostrar menú pausa
   └─ ESC para reanudar
   
6. LEVEL_COMPLETE
   ├─ Mostrar pantalla de nivel completado
   ├─ Badge animado, puntuación
   ├─ Botón: SIGUIENTE NIVEL
   └─ Si es nivel 3 → VICTORY
   
7. VICTORY (Fin del juego)
   ├─ Mostrar pantalla épica
   ├─ Corona animada, confetti cayendo
   ├─ Lista de logros (3 niveles)
   ├─ Puntuación final
   └─ Botón: VOLVER AL MENÚ
   
8. GAME_OVER
   ├─ Salud ≤ 0 o caído en precipicio
   ├─ Mostrar puntuación actual
   ├─ Opciones: REINICIAR, MENÚ PRINCIPAL
   └─ REINICIAR → PLAYING (Nivel 1)
```

---

## 🎨 Sistema de Animaciones

Todas las animaciones usan **sprite sheets** con múltiples frames:

### Ejemplo: Animación de Caminar
```javascript
walking: {
    sprite: "playerWalk",              // Nombre de la imagen
    frames: [0, 1, 2, 3, 4, 5, 6],    // Índices de frames
    speed: 0.1,                        // Velocidad (frames por update)
    loop: true                         // ¿Se repite?
}
```

**Cada frame ocupa 128x128 píxeles en el sprite sheet:**
```
Frame 0: píxeles 0-127
Frame 1: píxeles 128-255
Frame 2: píxeles 256-383
...etc
```

---

## 🐛 Resolución de Problemas

### Las imágenes no cargan
- Verifica que la carpeta `assets/images/` existe
- Usa un servidor local (ver sección "Cómo Ejecutar")
- Revisa la consola del navegador (F12) para errores

### El juego va lento
- Reduce la cantidad de enemigos (modificar `enemySpawnInterval`)
- Cierra otras pestañas
- Prueba en otro navegador

### Los controles no responden
- Asegúrate que el canvas tiene focus (click en la ventana)
- Verifica que JavaScript está habilitado
- Recarga la página

### El personaje desaparece
- Es normal en los bordes del mapa
- El personaje tiene límites en x: [0, levelWidth]
- La cámara sigue al jugador automáticamente

---

## 📊 Estadísticas del Juego

| Métrica | Valor |
|---------|-------|
| FPS Objetivo | 60 |
| Ancho del Mapa | 5000px |
| Alto del Mapa | 800px |
| Tamaño del Piso | 100px |
| Enemigos Máximo | ~30 (spawn dinámico) |
| Duración Promedio | 5-15 min (según habilidad) |
| Resolución Recomendada | 1920x1080 |

---

## 👥 Desarrolladores

**Equipo de Desarrollo:**
- 👨‍💻 **Jorge Bósquez**
- 👨‍💻 **Alexander Reyes**

**Herramientas Utilizadas:**
- HTML5 Canvas
- CSS3 (Animaciones, Gradientes)
- JavaScript Vanilla (ES6+)
- Git para versionado

---

## 📝 Notas de Desarrollo

### Características Implementadas
- ✅ Física completa (gravedad, saltos, colisiones)
- ✅ Sistema de combate con cooldown
- ✅ 3 niveles progresivos
- ✅ Enemigos inteligentes con AI
- ✅ Sistema de animaciones sprite-based
- ✅ UI responsiva y animada
- ✅ Pantalla de pausa
- ✅ Sistema de puntuación
- ✅ Efectos visuales avanzados
- ✅ Pantalla de victoria épica

### Posibles Mejoras Futuras
- 🔮 Más niveles
- 🔮 Sistema de música
- 🔮 Efectos de sonido
- 🔮 Poder-ups especiales
- 🔮 Tabla de puntuaciones
- 🔮 Modos de dificultad
- 🔮 Personajes seleccionables
- 🔮 Tutorial interactivo
- 🔮 Guardado de progreso
- 🔮 Multijugador local

---

## 📄 Licencia

Este proyecto es de código abierto para propósitos educativos.

---

## 🎮 ¡Gracias por jugar!

Si encontraste un bug o tienes sugerencias, no dudes en contactar a los desarrolladores.

**¡Que disfrutes jugando ARCADE SHOOTER! 🚀**