var BootState = {
	
	init: function () {
		//Устанавливаем разрешение экрана
		this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
		this.scale.pageAlignHorizontally = true;
		this.scale.pageAlignVertically = true;

		//задаем границы мира
		this.game.world.setBounds(0, 0, 360, 700);
	},

	preload: function () {
		//Грузим ассеты для PreloadState
		this.load.image('kong', 'assets/images/gorilla3.png');
		this.load.image('bar', 'assets/images/bar.png');
	},

	create: function () {
		//ставим черный цвет экрана
		this.game.stage.backgroundColor = 'black';
		//Запускаем PreloadState
		this.state.start('PreloadState');
	},
};