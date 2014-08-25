var width    = 1000;
var height   = 600;

// Manages everything in the game: the player, platforms,
// enemies... etc. Contains the Physics.js world (called physics).
function Game(levels) {
  var that = this;

  var beehavior = null;

  var addObjects = changeObjects("add");
  var removeObjects = changeObjects("remove");

  var currentLevel = 3;

  var base  = levels[currentLevel];

  var currentBg = '';

  var levelHotkeys = {
    49:  0,  // 1
    50:  1,  // 2
    51:  2,  // 3
    52:  3,  // 4
    113: 4   // Q
  }; 

  var settings = {
    timestep   : 1000 / 160,
    maxIPF     : 16,
    integrator : "verlet"
  };

  var physics = Physics(settings);
  var gravity = null;

  this.physics = physics;
  this.player = null;

  this.setBase = function (newBase) {
    if (newBase.attrs.bg && newBase.attrs.bg != currentBg) {
      currentBg = newBase.attrs.bg;
      $('canvas').css('background', 'url(' + newBase.attrs.bg + ')');
    }

    if (this.player) {
      physics.remove(this.player);
    }

    if (beehavior) {
      physics.remove(beehavior);
    }

    // TODO: Make the player not be a circle!
    this.player = Physics.body('circle', {
      x        : newBase.start.x,
      y        : newBase.start.y,
      vx       : 0,
      vy       : 0,
      radius   : 22,
      cof      : 1,
      grounded : false,
      view     : image("assets/magicStar.png")
    });
   
    physics.add(this.player);

    if (control) {
      physics.remove(control);
    }
    control = Physics.behavior('control').applyTo([this.player]);
    physics.add(control);

    if (die) {
      physics.remove(die);
    }
    die = Physics.behavior('die-offscreen').applyTo([this.player]);
    physics.add(die);

    if (gravity) {
      physics.remove(gravity);
    }
    gravity = Physics.behavior('constant-acceleration', {
      acc: { x : 0, y: newBase.attrs.gravityAccel }
    });
    physics.add(gravity);

    removeObjects(base);
    base = newBase;
    addObjects(base);

    bees(that.player);
    beehavior = Physics.behavior("bees").applyTo(_.filter(base.objects, function (object) {
      return !!object.bee;
    }));
    physics.add(beehavior);
  };

  this.setOther = function (newOther) {
    function otherable(object) {
      return !object.baseOnly;
    }

    removeObjects(other);
    other = newOther;
    addObjects(other, otherable);

    setTimeout(function () { removeObjects(other) }, 50);
    setTimeout(function () { addObjects(other, otherable) }, 100);
    setTimeout(function () { removeObjects(other) }, 150);
    setTimeout(function () { addObjects(other, otherable) }, 200);

    // override base gravity

    if (gravity) {
      physics.remove(gravity);
    }

    gravity = Physics.behavior('constant-acceleration', {
      acc: { x : 0, y: (newOther ? newOther : base).attrs.gravityAccel }
    });
    physics.add(gravity);
  }

  // The loop which checks which objects are "grounded", ie on top of
  // some other object.
  physics.on('collisions:detected', collisions(that));

  physics.on('collisions:detected', function (data) {
    data.collisions = _.filter(data.collisions, function (c) {
      return !c.bodyA.passable && !c.bodyB.passable;
    });

    physics.emit("collisions:filtered", data);
  });

  physics.add(Physics.behavior('body-impulse-response', { check : "collisions:filtered" }));
  physics.add(Physics.behavior('body-collision-detection'));
  physics.add(Physics.behavior('sweep-prune'));

  physics.on("die", function () {
    that.setOther(null);
    that.setBase(base);
  });

  physics.on("next-level", function () {
    currentLevel++;
    
    that.setOther(null);
    that.setBase(levels[currentLevel]);
  });

  createControl(this);
  var control = null;
  var die = null;

  physics.add(renderer());

  var other = null;

  this.setBase(base);

  function changeObjects(action) {
    return function(world, pred) {
      pred = pred || function () { return true };
      
      if (world) {
        physics[action](_.filter(world.objects, pred));
      }
    }
  }

  $(document).keypress(function (e) {
    var level = levelHotkeys[e.keyCode || e.which];

    if (typeof level == "number" && level < currentLevel) {
      if (other == levels[level]) {
        that.setOther(null);
      } else {
        that.setOther(levels[level]);
      }
    }
  });
}

// A world is a single level which can contain objects as well as a
// starting location and goal.
function world(attrs, objects) {
  var defaults = {
    gravityAccel: 0.0008
  };

  return {
    attrs   : _.extend(defaults, attrs),
    start   : attrs.start,
    objects : objects
  };
}

function image(url, length) {
  var img = new Image();
  img.src = url;

  if (length) {
    img.width = length;
  }

  return img;
}
