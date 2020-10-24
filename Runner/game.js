let game;

// Variables globales deljuego
let gameOptions = {
    velocidadInicio: 250,
    rangoSeparacion: [0, 300],
    plataformaRangoTamaño: [50, 250],
    gravedadJugador: 900,
    brinco: 400,
    posicionInicialJugador: 200,
    brincos: 10
}

window.onload = function () {

    // Configuraciones nativas
    let gameConfig = {
        type: Phaser.AUTO,
        width: 1380,
        height: 750,
        scene: Juego,
        
        //Configuracion de la fisica del juego
        physics: {
            default: "arcade"
        }
    }
    game = new Phaser.Game(gameConfig);
    window.focus();
    resize();
    window.addEventListener("resize", resize, false);
}
var score = 0;
var scoreText;
// Juego
class Juego extends Phaser.Scene {
    constructor() {
        super("Juego");
    }
    preload() {
        this.load.image('sky', 'sky.png');
        this.load.image("platform", "res.png");
        this.load.spritesheet("player", "dude.png",{ frameWidth: 32, frameHeight: 48 });
    }
    create() {
        
        this.add.image(400, 300, 'sky').setScale(3);
    
        // Se crea el grupo con todas las plataformas activas.
        this.platformGroup = this.add.group({

            // Una vez que la plataforma se haya eliminado se añade a POOL
            removeCallback: function (platform) {
                platform.scene.platformPool.add(platform)
            }
        });

        // POOL
        this.platformPool = this.add.group({

            // Ya que la plataforma se elimino del POOL se añade a las plataformas activas
            removeCallback: function (platform) {
                platform.scene.platformGroup.add(platform)
            }
        });

        // Numero de saltos que ha hecho el jugador
        this.playerJumps = 0;

        // Agregando una plataforma al juego , los argumentos son la anchura de la plataforma y su posicion en x
        this.addPlatform(game.config.width, game.config.width / 2);

        // Se agrega al jugador;
        this.player = this.physics.add.sprite(gameOptions.posicionInicialJugador, game.config.height / 2, "player");
        this.player.setGravityY(gameOptions.gravedadJugador);
        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('player', { start: 5, end: 8 }),
            frameRate: 10,
            repeat: -1
        });

        // Se agregan las colisiones para el jugador y la plataforma
        this.physics.add.collider(this.player, this.platformGroup);

        // Input (Mouse)
        this.input.on("pointerdown", this.brinco, this);
        // Se crea el marcador
        scoreText = this.add.text(16, 16, 'Marcador: 0', { fontSize: '32px', fill: '#000' });
    }

    //La plataforma se agrega desde el grupo o se crea sobre la marcha
    addPlatform(platformWidth, posX) {
        let platform;
        if (this.platformPool.getLength()) {
            platform = this.platformPool.getFirst();
            platform.x = posX;
            platform.active = true;
            platform.visible = true;
            this.platformPool.remove(platform);
            score += 10;
            scoreText.setText('Score: ' + score);
        }
        else {
            platform = this.physics.add.sprite(posX, game.config.height * 0.8, "platform");
            platform.setImmovable(true);

            platform.setVelocityX(gameOptions.velocidadInicio * -1);
            this.platformGroup.add(platform);
            
        }
        platform.displayWidth = platformWidth;
        this.nextPlatformDistance = Phaser.Math.Between(gameOptions.rangoSeparacion[0], gameOptions.rangoSeparacion[1]);
        
    }

    // El jugador salta cuando está en el suelo, o una vez en el aire, siempre y cuando queden saltos y el primer salto haya sido en el suelo
    brinco() {
        if (this.player.body.touching.down || (this.playerJumps > 0 && this.playerJumps < gameOptions.brincos)) {
            if (this.player.body.touching.down) {
                this.playerJumps = 0;
            }
            this.player.setVelocityY(gameOptions.brinco * -1);
            this.playerJumps++;
        }
    }
    update() {
        this.player.anims.play('right', true);
        // El jugador perdio
        if (this.player.y > game.config.height) {
            this.scene.start("PlayGame");
            score = 0;
        }
       
        this.player.x = gameOptions.posicionInicialJugador;

        // reciclando plataformas
        let minDistance = game.config.width;
        this.platformGroup.getChildren().forEach(function (platform) {
            let platformDistance = game.config.width - platform.x - platform.displayWidth / 2;
            minDistance = Math.min(minDistance, platformDistance);
            if (platform.x < - platform.displayWidth / 2) {
                this.platformGroup.killAndHide(platform);
                this.platformGroup.remove(platform);
            }
        }, this);

        // aagregando plataformas
        if (minDistance > this.nextPlatformDistance) {
            var nextPlatformWidth = Phaser.Math.Between(gameOptions.plataformaRangoTamaño[0], gameOptions.plataformaRangoTamaño[1]);
            this.addPlatform(nextPlatformWidth, game.config.width + nextPlatformWidth / 2);
        }
    }
};
function resize() {
    let canvas = document.querySelector("canvas");
    let windowWidth = window.innerWidth;
    let windowHeight = window.innerHeight;
    let windowRatio = windowWidth / windowHeight;
    let gameRatio = game.config.width / game.config.height;
    if (windowRatio < gameRatio) {
        canvas.style.width = windowWidth + "px";
        canvas.style.height = (windowWidth / gameRatio) + "px";
    }
    else {
        canvas.style.width = (windowHeight * gameRatio) + "px";
        canvas.style.height = windowHeight + "px";
    }
}
