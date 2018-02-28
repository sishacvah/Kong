var PreloadState = {

	preload: function() {

		//Загрузка физики
		this.game.physics.startSystem(Phaser.Physics.ARCADE);
		this.game.physics.arcade.gravity.y = 500;

		//Иконка на загрузке
		this.dude = this.add.sprite(this.game.world.centerX,
		this.game.world.centerY, 'kong');
		this.dude.anchor.setTo(0.5);

		//Загрузочный бар
		this.bar = this.add.sprite(this.game.world.centerX,
		this.game.world.centerY - 40, 'bar');
		this.bar.anchor.setTo(0.5);

		//Даем спрайту "загрузочность"
		this.load.setPreloadSprite(this.bar);

		//Грузим все ассеты
		this.load.image('ground', 'assets/images/ground.png');
		this.load.image('platform', 'assets/images/platform.png');
		this.load.image('arrowButton', 'assets/images/arrowButton.png');
		this.load.image('actionButton', 'assets/images/actionButton.png');
		this.load.image('barrel', 'assets/images/barrel.png');
        this.load.image('backTile', 'assets/images/backTile.png');
        this.load.image('hearth', 'assets/images/hearth.png');
        this.load.image('princes', 'assets/images/princes.png');
        
		this.load.spritesheet('player', 'assets/images/player_spritesheet.png', 28, 30, 5, 1, 1);
		this.load.spritesheet('fire', 'assets/images/fire_spritesheet.png', 20, 21, 2, 1, 1);
        this.load.spritesheet('barrelspritesheet', 'assets/images/barrelSprite.png', 15, 15, 10, 0, 0);
        
		this.load.text('level1', 'assets/data/level1.json');
		this.load.text('level2', 'assets/data/level2.json');
		this.load.text('level3', 'assets/data/level3.json');
        
        this.load.audio('fireBurn', 'assets/audio/flamestrike.wav');
	},

	//Запускаем GameState
	create: function() {
		this.state.start('GameState');
	}
};