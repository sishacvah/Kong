var levelNumber = 1;
var playerHP = 3;

var GameState = {

	init: function() {

		//Создание переменной cursors и выполнение функции создания управления курсорами 
		this.cursors = this.game.input.keyboard.createCursorKeys();


		//Константы скорости бега и высоты прыжка игрока
		this.RUNNING_SPEED = 180;
		this.JUMPING_SPEED = 400;
	},

	create: function() {
		//Тайловый фон, в данный момент просто черные квадраты
        this.background = this.add.tileSprite(0, 0, this.game.world.width, this.game.world.height, 'backTile');
        
        //Добавление спрайта пола и включение физики для него, неподвижный.
		this.ground = this.add.sprite(0, 638, 'ground');
		this.game.physics.arcade.enable(this.ground);
		this.ground.body.allowGravity = false;
		this.ground.body.immovable = true;

		//parse the level JSON file (передача данных json файла)
		this.levelData = JSON.parse(this.game.cache.getText('level'+levelNumber));
        
        //звуковые эффекты
        this.fireBurn = this.add.audio('fireBurn');

        //создание спрайта платформ и объеденение их в группы, включение физики
		this.platforms = this.add.group();
		this.platforms.enableBody = true;

		this.levelData.platformData.forEach(function(element){
			this.platforms.create(element.x, element.y, 'platform');
		}, this);

		this.platforms.setAll('body.immovable', true);
		this.platforms.setAll('body.allowGravity', false);

		//создание огней, группы огней, анимации и физики
		this.fires = this.add.group();
		this.fires.enableBody = true;

		var fire;
		this.levelData.fireData.forEach(function(element){
			fire = this.fires.create(element.x, element.y, 'fire');
			fire.animations.add('fire', [0, 1], 4, true);
			fire.play('fire');
		}, this);

		this.fires.setAll('body.allowGravity', false);

		//выполнение функции создания кнопок на экране для тачпадов
		this.createOnScreenControls();

		//выполнение функции показа текущего уровня
		this.showLevelNumber();


		// создание бочек, групп, физики и таймера спавна
		this.barrels = this.add.group();
		this.barrels.enableBody = true;


		this.createBarrel();
		this.barrelCreator = this.game.time.events.loop(
			Phaser.Timer.SECOND * this.levelData.barrelFrequency, 
			this.createBarrel, this);
        
        //переменные и таймер, отвечающие за временную неуязвимость
        this.wasHit = false;
        this.canBeHit();
        this.canBeHitTimer = this.game.time.events.loop(Phaser.Timer.SECOND * 2, this.canBeHit, this);

		//создание Конга, и его физики
		this.kong = this.add.sprite(this.levelData.kong.x,
			this.levelData.kong.y, 'kong');
		this.game.physics.arcade.enable(this.kong);
		this.kong.body.allowGravity = false;

		//Создание спрайта игрока, его физики, анимации, уровня ХП
		this.player = this.add.sprite(this.levelData.playerStart.x,
		 this.levelData.playerStart.y, 'player', 3);
		this.game.physics.arcade.enable(this.player);
		this.player.anchor.setTo(0.5);

		this.player.animations.add('walking', [0, 1, 2, 1], 6, true);
        this.player.animations.add('immunity', [3, 5, 3, 5, 3, 5, 3, 5, 3, 5], 10, false);
		
		this.player.customParams = {};
		
		this.player.body.collideWorldBounds = true;
        
        this.player.health = playerHP;

        //Привязка камеры к игроку
		this.game.camera.follow(this.player);
        
        //Вывод текущего здоровья на экран
        this.showHealth();

        //принцесса
        //this.princes = this.add.sprite( 300, 300, 'princes');


	},

	update: function() {
        //Костыль, чтобы игрок не проваливался в пол.
        if(this.player.position.y >= this.game.world.height - 1.2 * this.player.height){
            this.player.position.x = this.levelData.playerStart.x;
            this.player.position.y = this.levelData.playerStart.y;
        }
        
        //Проверки коллижена между разными группами, функция landed - атавизм, может пригодится позже
		this.game.physics.arcade.collide(this.player, this.ground, this.landed);
		this.game.physics.arcade.collide(this.player, this.platforms, this.landed);

		this.game.physics.arcade.collide(this.barrels, this.ground, this.landed);
		this.game.physics.arcade.collide(this.barrels, this.platforms, this.landed);

		//Проверки оверлапа между группами
		this.game.physics.arcade.overlap(this.player, this.fires, this.killPlayer, null, this);
		this.game.physics.arcade.overlap(this.player, this.kong, this.win);

		this.game.physics.arcade.overlap(this.player, this.barrels, this.killPlayer, null, this);
		
		//Остановка игрока, если кнопки не нажаты
		this.player.body.velocity.x = 0;


		//Управление
		if(this.cursors.left.isDown ||
			this.player.customParams.isMovingLeft){
			this.player.body.velocity.x = -this.RUNNING_SPEED;
			this.player.scale.setTo(1, 1);
			this.player.play('walking');
		} else
		if(this.cursors.right.isDown ||
			this.player.customParams.isMovingRight){
			this.player.body.velocity.x = this.RUNNING_SPEED;
			this.player.scale.setTo(-1, 1);
			this.player.play('walking');
		} else {
			this.player.animations.stop();
			this.player.frame = 3;
		}

		if((this.cursors.up.isDown || this.player.customParams.mustJump) && this.player.body.touching.down){
			this.player.body.velocity.y = -this.JUMPING_SPEED;
			this.player.customParams.mustJump = false;
		}
        
        //анимация вращения бочек и их удаление в левом нижнем углу карты
		this.barrels.forEach(function(element){
            
            if(element.body.velocity.x > 0){
                element.play('rotatingRight');
            } else {
                element.play('rotatingLeft');
            }
			if(element.x < 10 && element.y > 600) {
				element.kill();
			}
		}, this);
	},

	//Атавизм
	landed: function(player, ground) {
		//console.log('LANDED');
	},

	//Создание управления для тачпада
	createOnScreenControls: function() {
		this.leftButton = this.add.button(20, 
			535, 'arrowButton');
		this.rightButton = this.add.button(110, 
			535, 'arrowButton');
		this.actionButton = this.add.button(280, 
			535, 'actionButton');

		//Прозрачность кнопок
		this.leftButton.alpha = 0.6;
		this.rightButton.alpha = 0.6;
		this.actionButton.alpha = 0.6;
		//Привязка к камере
		this.leftButton.fixedToCamera = true;
		this.rightButton.fixedToCamera = true;
		this.actionButton.fixedToCamera = true;

		//action
		this.actionButton.events.onInputDown.add(function(){
			this.player.customParams.mustJump = true;
		}, this);
		this.actionButton.events.onInputUp.add(function(){
			this.player.customParams.mustJump = false;
		}, this);
		this.actionButton.events.onInputOver.add(function(){
			this.player.customParams.mustJump = true;
		}, this);
		this.actionButton.events.onInputOut.add(function(){
			this.player.customParams.mustJump = false;
		}, this);
		//left
		this.leftButton.events.onInputDown.add(function(){
			this.player.customParams.isMovingLeft = true;
		}, this);
		this.leftButton.events.onInputUp.add(function(){
			this.player.customParams.isMovingLeft = false;
		}, this);
		this.leftButton.events.onInputOver.add(function(){
			this.player.customParams.isMovingLeft = true;
		}, this);
		this.leftButton.events.onInputOut.add(function(){
			this.player.customParams.isMovingLeft = false;
		}, this);
		//right
		this.rightButton.events.onInputDown.add(function(){
			this.player.customParams.isMovingRight = true;
		}, this);
		this.rightButton.events.onInputUp.add(function(){
			this.player.customParams.isMovingRight = false;
		}, this);
		this.rightButton.events.onInputOver.add(function(){
			this.player.customParams.isMovingRight = true;
		}, this);
		this.rightButton.events.onInputOut.add(function(){
			this.player.customParams.isMovingRight = false;
		}, this);
	},

	//Функция наноси игроку урон или "убивает", если хп = 0
	killPlayer: function(player, fire) {
        
        //Проверка на временную неуязвимость
        if(this.wasHit == false){
        	//звук огня, нудо исправить
            this.fireBurn.play();
             player.health -= 1;
            var hp = player.health;
            playerHP = player.health;
            //Если хп нет, то рестарт, если есть, то обновление счетчика
            if(playerHP <= 0){
                game.state.start('GameState');
                playerHP = 3;
            } else {
                this.hpText.text =' x ' + playerHP;
            }
            //Флаг для временной неуязвимости после урона
            this.wasHit = true;
        }
       
	},

	//Функция перхода на следующий уровень
	win: function(player, kong){
		levelNumber += 1;
		if (levelNumber >= 4){
			levelNumber = 1;
		}
		game.state.start('GameState');
	},

	//Функция показа текущего уровня
	showLevelNumber: function() {
		//стиль текста
		var style = {font: '15px Arial', fill: 'white'};
		//создание объекта
		this.levelText = this.add.text(15, 40, 'Level ' + levelNumber, style);
		//привязка к камере
		this.levelText.fixedToCamera = true;
	},
    //Функция показа здоровья
    showHealth: function() {
    	//переменная со значением здоровья игрока
        var hp = this.player.health;
        //создание спрайта здоровья (глобалный скоуп, надо переделать)
        this.health = this.add.sprite(315, 40, 'hearth');
        //стиль текста
        var style = {font: '15px Arial', fill: 'white'};
        //создание объекта
        this.hpText = this.add.text(330, 40, ' x ' + hp, style);
        //привязка к камере текста и спрайта
        this.hpText.fixedToCamera = true;
        this.health.fixedToCamera = true;
        
    },

    //Функция спавна бочек
	createBarrel: function() {
		//Берем первый использованный объект из barrels в переменную barrel
		var barrel = this.barrels.getFirstExists(false);
		//Если взять нечего (первый прогон, например), создаем новый объект, назначаем анимации
		if(!barrel){
			barrel = this.barrels.create(0, 0, 'barrelspritesheet');
            barrel.animations.add('rotatingRight', [1, 2, 3, 4, 5, 6, 7, 8, 9, 0], 10, true);
            barrel.animations.add('rotatingLeft', [9, 8, 7, 6, 5, 4, 3, 2, 1, 0], 10, true);
		}
        
        //задаем отскок и невозможность выйти за пределы мира
		barrel.body.collideWorldBounds = true;
		barrel.body.bounce.set(1, 0.4);

		//переставляем новый или уже использованный спрайт в точку спавна
		barrel.reset(this.levelData.kong.x, this.levelData.kong.y);
		//задаем скорость из параметров уровня
		barrel.body.velocity.x = this.levelData.barrelSpeed;
	},
    
    //Функция для флага неуязвимости, завязана на таймер
    canBeHit: function() {
        this.wasHit = false;
        
    }
};