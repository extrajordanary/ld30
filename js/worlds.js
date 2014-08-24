// Example params
// attrs = {
//   start: [0,0],
//   goal: [50,50],
//   gravityCoefficient: 0
// }
// thingers = [
//   {
//     type: "platform",
//     x: 10,
//     y: 15,
//     length: 20,
//     img: 'img/platform1.png'
//   },
//   {
//     type: "movingPlatform",
//     x: 10,
//     y: 15,
//     length: 20,
//     img: 'img/platform1.png',
//     direction: 'left',
//     speed: 2,
//     leftBound: 6,
//     rightBound: 10
//   }
// ]

var World = function(attrs, thingers) {
  this.attrs = attrs;
  this.start = attrs.start;
  this.goal = attrs.goal;
  var movingObjects = [];

  // Creates a new object based on the
  // thinger's object type (capitalizing
  // the first letter to get the class name)
  // and adds the object to the movingObject
  // array if the type includes the word
  // "moving"
  var _makeObject = function(thinger) {
    function capitalize(str) {
      return str[0].toUpperCase() + str.slice(1);
    }

    var type = capitalize(thinger.type);
    obj = new window[type](thinger);
    if(type.indexOf("Moving") > -1) {
      movingObjects.push(obj);
    }
    return obj;
  };

  this.objects = _.map(thingers, function (thinger) {
    return _makeObject(thinger);
  });

  // Moves all the moving objects
  this.moveObjects = function() {
    movingObjects.forEach(function (obj) {
      obj.move();
    });
  };
};

World.prototype.tick = function() {
  this.moveObjects();
};

// Combines this world with a different world
World.prototype.combine = function(otherWorld) {
  if(otherWorld !== this) {
    return new CombinedWorld(this, otherWorld);
  }
};

// Gets its attributes from two different worlds
// Averages the number attributes of both worlds
// and adds together the different objects in
// from both worlds
var CombinedWorld = function(baseWorld, newWorld) {
  this.attrs = {};
  for(var attr in baseWorld.attrs) {
    if(!isNaN(baseWorld.attrs[attr])) { // Averages the numbers
      this.attrs[attr] = avg(baseWorld.attrs[attr], newWorld.attrs[attr]);
    }
  }

  this.objects = this.objects.concat(otherWorld.objects);
  this.baseWorld = baseWorld;
  this.newWorld = newWorld;

  function avg(obj1, obj2) {
    return (obj1 + obj2) / 2;
  }
};

CombinedWorld.prototype.tick = function() {
  this.baseWorld.tick();
  this.newWorld.tick();
};

// Combines the base world with another world
// unless the 'otherWorld' is the one of the
// worlds this class combines (in which case,
// it returns the baseWorld).
CombinedWorld.prototype.combine = function(otherWorld) {
  if(otherWorld === this.newWorld || otherWorld === this.baseWorld) {
    return this.baseWorld;
  } else {
    return new CombinedWorld(this.baseWorld, otherWorld);
  }
};
