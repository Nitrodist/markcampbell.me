(function() {
  var Asteroid, Missile, Ship,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  window.Component = (function() {

    function Component(options) {
      var defaults;
      if (options == null) options = {};
      defaults = {
        sprite: this.constructor.sprite,
        x: 0,
        y: 0,
        dx: 0,
        dy: 0,
        bounce: true,
        bounceRate: -1,
        maxSpeed: 10,
        orientation: -Math.PI / 2.0
      };
      $.extend(true, this, defaults, options);
      Component.all.push(this);
    }

    Component.prototype.speed = function() {
      return Math.sqrt(Math.pow(this.dx, 2) + Math.pow(this.dy, 2));
    };

    Component.prototype.respondToInput = function(input) {
      if (input.left) this.dx += -0.4;
      if (input.down) this.dy += -0.4;
      if (input.up) this.dy += 0.4;
      if (input.right) return this.dx += 0.4;
    };

    Component.prototype.getHeight = function() {
      return this.height || this.sprite.height;
    };

    Component.prototype.getWidth = function() {
      return this.width || this.sprite.width;
    };

    Component.prototype.tick = function() {
      var height, width;
      height = this.getHeight();
      width = this.getWidth();
      this.x += this.dx;
      this.y += this.dy;
      if (this.x > 900 - width) {
        if (this.bounce) this.dx = this.dx * this.bounceRate;
        this.x = 900 - width;
      }
      if (this.x < 0) {
        if (this.bounce) this.dx = this.dx * this.bounceRate;
        this.x = 0;
      }
      if (this.y > 500 - height) {
        if (this.bounce) this.dy = this.dy * this.bounceRate;
        this.y = 500 - height;
      }
      if (this.y < 0) {
        if (this.bounce) this.dy = this.dy * this.bounceRate;
        return this.y = 0;
      }
    };

    Component.prototype.draw = function(ctx) {
      this.ctx = ctx;
      this.sprite.place(this.x, this.y).rotate(this.orientation + Math.PI / 2).resize(this.getHeight(), this.getWidth()).draw(this.ctx);
      return this;
    };

    Component.prototype.rotate = function(orientation) {
      this.orientation = orientation;
      return this;
    };

    Component.prototype.move = function(x, y) {
      this.x = x;
      this.y = y;
      return this;
    };

    Component.prototype.resize = function(height, width) {
      this.height = height;
      this.width = width;
    };

    Component.prototype.stop = function() {
      return this.dx = this.dy = 0;
    };

    return Component;

  })();

  Component.all = [];

  window.RadialComponent = (function(_super) {

    __extends(RadialComponent, _super);

    function RadialComponent(options) {
      this.options = options != null ? options : {};
      RadialComponent.__super__.constructor.call(this, this.options);
      this.thrustForce = this.options.thrustForce || 0.4;
      this.turnRate = this.options.turnRate || Math.PI / 20;
    }

    RadialComponent.prototype.thrust = function(force) {
      if (this.speed() > this.maxSpeed) {
        this.dx += this.maxSpeed * Math.cos(this.orientation);
        this.dy += this.maxSpeed * Math.sin(this.orientation);
      } else {
        this.dx += force * Math.cos(this.orientation);
        this.dy += force * Math.sin(this.orientation);
      }
      return this;
    };

    RadialComponent.prototype.respondToInput = function(input) {
      if (input.up) this.thrust(this.thrustForce);
      if (input.down) this.thrust(-this.thrustForce);
      if (input.left) this.orientation += -this.turnRate;
      if (input.right) return this.orientation += this.turnRate;
    };

    return RadialComponent;

  })(Component);

  $(function() {
    var canvas, space;
    space = new Sprite('space', 'assets/space.jpg', {
      height: 500,
      width: 900
    });
    window.Ship = Ship;
    window.Missile = Missile;
    window.Asteroid = Asteroid;
    Player.current = new Player("stefan");
    canvas = $('#game')[0];
    window.graphics = new Graphics(canvas, {
      x: 0,
      y: 0
    });
    Component.all.mark = new Ship();
    window.graphics.ordered = [
      Sprite.find.space, Component.all.mark, new Asteroid({
        x: 300,
        y: 100
      }), new Asteroid({
        x: 100,
        y: 300
      }), new Asteroid({
        x: 3,
        y: 100
      }), new Asteroid({
        x: 800,
        y: 100
      })
    ];
    $('#robot').click(function() {
      return graphics.ordered.push(new Asteroid({
        x: 10,
        y: 420,
        dx: 10,
        dy: -10
      }));
    });
    return Resources.ready(function() {
      Runtime.run();
      graphics.run();
      return Input.run();
    });
  });

  window.Graphics = (function() {

    function Graphics(canvas) {
      this.canvas = canvas;
      this.ctx = this.canvas.getContext('2d');
      this.ordered = [];
    }

    Graphics.prototype.clear = function() {
      return this.ctx.clearRect(0, 0, 900, 500);
    };

    Graphics.prototype.draw = function() {
      var comp, _i, _len, _ref;
      this.clear();
      _ref = this.ordered.filter(function(i) {
        return i;
      });
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        comp = _ref[_i];
        comp.draw(this.ctx);
      }
      return this;
    };

    Graphics.prototype.run = function() {
      var requestAnimationFrame;
      graphics.draw();
      requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
      if (requestAnimationFrame) {
        return requestAnimationFrame(arguments.callee);
      } else {
        return setTimeout(arguments.callee, 40);
      }
    };

    return Graphics;

  })();

  window.Input = {
    state: {
      reset: function() {
        return Input.state = {
          reset: arguments.callee
        };
      }
    },
    humanize: {
      32: 'space',
      37: 'left',
      38: 'up',
      39: 'right',
      40: 'down',
      82: 'r'
    },
    run: function() {
      $(document).keyup(function(e) {
        var code;
        e.preventDefault();
        code = Input.humanize[e.keyCode];
        return Input.state[code] = false;
      });
      return $(document).keydown(function(e) {
        var code;
        e.preventDefault();
        code = Input.humanize[e.keyCode];
        return Input.state[code] = true;
      });
    }
  };

  window.Player = (function() {

    function Player(name) {
      this.name = name;
    }

    Player.prototype.reset = function() {
      return this.h = this.j = this.k = this.l = null;
    };

    return Player;

  })();

  window.Resources = {
    sprites: function() {
      return Sprite.all;
    },
    ready: function(callback) {
      var count, expected, key, sprite, sprites, _results,
        _this = this;
      sprites = Sprite.all;
      count = 0;
      expected = Object.keys(sprites).length;
      $('html').bind('sprite.loaded', function() {
        count += 1;
        if (count === expected) return callback();
      });
      _results = [];
      for (key in sprites) {
        sprite = sprites[key];
        _results.push(sprite.preload());
      }
      return _results;
    }
  };

  window.Runtime = {
    run: function() {
      var component, _i, _len, _ref;
      Component.all.mark.respondToInput(Input.state);
      _ref = Component.all;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        component = _ref[_i];
        component.tick();
      }
      return setTimeout(arguments.callee, 40);
    }
  };

  window.Sprite = (function() {

    function Sprite(name, src, options) {
      this.name = name;
      this.src = src;
      this.options = options != null ? options : {};
      this.image = $(new Image());
      this.loaded = false;
      this.x = this.options.x || 0;
      this.y = this.options.y || 0;
      Sprite.find[this.name] = this;
      Sprite.all.push(this);
    }

    Sprite.prototype.preload = function() {
      var _this = this;
      return this.image.load(function() {
        var image;
        image = _this.image[0];
        _this.height = _this.options.height || image.height;
        _this.width = _this.options.width || image.width;
        $('html').trigger('sprite.loaded', _this.name);
        return _this.loaded = true;
      }).attr('src', this.src);
    };

    Sprite.prototype.place = function(x, y) {
      this.x = x != null ? x : 0;
      this.y = y != null ? y : 0;
      return this;
    };

    Sprite.prototype.rotate = function(r) {
      this.r = r;
      return this;
    };

    Sprite.prototype.resize = function(height, width) {
      if (height == null) height = this.height;
      if (width == null) width = this.width;
      this.height = height;
      this.width = width;
      return this;
    };

    Sprite.prototype.draw = function(ctx) {
      var pivotX, pivotY;
      if (this.r) {
        pivotX = this.x + (this.width / 2);
        pivotY = this.y + (this.height / 2);
        ctx.save();
        ctx.translate(pivotX, pivotY);
        ctx.rotate(this.r);
        ctx.drawImage(this.image[0], -(this.width / 2), -(this.height / 2), this.width, this.height);
        ctx.translate(-pivotX, -pivotY);
        ctx.restore();
      } else {
        ctx.drawImage(this.image[0], this.x, this.y, this.width, this.height);
      }
      return this;
    };

    return Sprite;

  })();

  Sprite.all = [];

  Sprite.find = {};

  Asteroid = (function(_super) {

    __extends(Asteroid, _super);

    function Asteroid(options) {
      var defaults;
      if (options == null) options = {};
      defaults = {
        dx: Math.random() * 10 - 5,
        dy: Math.random() * 10 - 5,
        bounce: true
      };
      Asteroid.__super__.constructor.call(this, $.extend(true, defaults, options));
    }

    return Asteroid;

  })(Component);

  Asteroid.sprite = new Sprite('asteroid', 'assets/asteroid.png', {
    height: 42.8,
    width: 37
  });

  Missile = (function(_super) {

    __extends(Missile, _super);

    function Missile(options) {
      var defaults;
      if (options == null) options = {};
      defaults = {
        dx: 3,
        dy: 2,
        x: 500,
        bounce: true
      };
      Missile.__super__.constructor.call(this, $.extend(true, defaults, options));
    }

    return Missile;

  })(RadialComponent);

  Missile.sprite = new Sprite('missile', 'assets/missile.png', {
    height: 10,
    width: 10
  });

  Ship = (function(_super) {

    __extends(Ship, _super);

    function Ship(options) {
      var defaults;
      if (options == null) options = {};
      defaults = {
        x: 300,
        y: 300,
        radial: true
      };
      Ship.__super__.constructor.call(this, $.extend(true, defaults, options));
    }

    Ship.prototype.respondToInput = function(input) {
      var centerX, centerY, cosTheta, missile, radius, sinTheta, theta, x, y;
      if (input.space) {
        missile = new Missile();
        centerX = this.x + this.sprite.width / 2 - missile.sprite.width / 2;
        centerY = this.y + this.sprite.height / 2 - missile.sprite.height / 2;
        radius = this.sprite.height / 2;
        theta = -this.orientation + Math.PI / 2;
        sinTheta = Math.sin(theta);
        cosTheta = Math.cos(theta);
        x = sinTheta * radius + centerX;
        y = cosTheta * radius + centerY;
        missile.move(x, y);
        missile.dx = sinTheta * 5;
        missile.dy = cosTheta * 5;
        graphics.ordered.push(missile);
      }
      return Ship.__super__.respondToInput.call(this, input);
    };

    return Ship;

  })(RadialComponent);

  Ship.sprite = new Sprite('Ship', 'assets/ship.png', {
    height: 50,
    width: 50
  });

}).call(this);
