/**
 * @Author: Edmund Lam <edl>
 * @Date:   16:42:00, 13-Feb-2018
 * @Filename: sim.js
 * @Last modified by:   edl
 * @Last modified time: 12:00:54, 27-Feb-2018
 */
//the canvas
var canv = document.getElementById('world');
var context = canv.getContext("2d");
//Array of all existing elements
var petris = new Array();
var holes = new Array();
var feed = new Array();
var cells = new Array();
var spawners = new Array();

//Virtual canvas
var worldWidth;
var worldHeight;
var sizeRatio;

var subjects = ["sSpawner", "bSpawner", "cRel", "sBig", "sSmall", "cFood", "cHole", "sPetri", "bPetri"];
var actions = ["reproduce", "combine", "avoid", "goto"];

//Superclass for all elements on screen, contains a position
class Element {
  constructor(size, x, y, color) {
    this.size = size;
    this.x = x;
    this.y = y;
    this.age = 0;
    this.color = color;
  }

  //returns distance between a cell and this cell
  dist(a) {
    var posX = Math.min(Math.abs(this.x - a.x), worldWidth - Math.abs(this.x - a.x));
    var posY = Math.min(Math.abs(this.y - a.y), worldHeight - Math.abs(this.y - a.y));
    return Math.pow(posX, 2) + Math.pow(posY, 2);
  }
}

//Spawner creates food around it
class Spawner extends Element {
  constructor(size, x, y) {
    super(size, x, y, '#DC143C');
  }

  eatCells(){
    for (var i = 0; i < cells.length; i++) {
      if (this.dist(cells[i]) <= Math.pow(cells[i].size / 2 + this.size / 2, 2) && this.size > cells[i].size) {
        if (i < currId) {
          currId--;
        }
        if (i < targCell) {
          targCell--;
        }else if ( i == targCell ){
          mousePos = {
            x:cells[i].x,
            y:cells[i].y
          }
          clickHappened = true;
        }
        cells.splice(i, 1);
        i--;
      }
    }
  }
}


//Petri dish kills cells near it

class Petri extends Element {
  constructor(size, x, y) {
    super(size, x, y, '#36F72C');
  }

  //forces bigger unlucky passerby cells to break apart
  killCells() {
    for (var i = 0; i < cells.length; i++) {
      if (this.dist(cells[i]) <= Math.pow(cells[i].size / 2 + this.size / 2, 2) && this.size < cells[i].size) {
        while (this.size < cells[i].size) {
          cells[i].reproduce();
        }
      }
    }
  }
}



//Hole class that kills all cells touching it
class Hole extends Element {
  constructor(x, y, size) {
    super(size, x, y, '#000000');
    this.direction = randInt(1, 360);
  }

  //teleports smaller passerby cells
  tpCells() {
    for (var i = 0; i < cells.length; i++) {
      if (this.dist(cells[i]) <= Math.pow(this.size / 2, 2) && this.size > cells[i].size && cells[i].coolDown == 0) {
        var targHole = randVal(holes);
        cells[i].x = targHole.x;
        cells[i].y = targHole.y;
        cells[i].coolDown = 1000;
      }
    }
  }

  //Move each frame
  move() {
    this.tpCells();
    this.direction += randInt(-30, 30);
    this.x += 5 * Math.cos(this.direction / 180 * Math.PI);
    this.y += 5 * Math.sin(this.direction / 180 * Math.PI);
    this.x = ((this.x % worldWidth) + worldWidth) % worldWidth;
    this.y = ((this.y % worldHeight) + worldHeight) % worldHeight;
  }
}


//Food class
class Food extends Element {
  constructor(size, x, y, color) {
    super(size, x, y, color);
  }
}


//Cell Class, contains all attributes for cell as well as how cell should move each frame.
class Cell extends Element {
  constructor(size, x, y, color, fraction, args, defComm) {
    super(size, x, y, color);
    this.args = args;
    this.offspring = 0;
    this.combine = false;
    this.defComm = defComm;
    this.coolDown = 0;
    this.currAct = 0;
    this.fraction = fraction;
  }

  //gets the closest food and eats food that is within it's grasp
  closestFood() {
    var eatable = new Array();
    var cFood = 0;
    for (var i = 0; i < feed.length; i++) {
      if ( this.colDist(feed[i].color) > 4096 ){
        //Eats food that can be eaten and finds closest non-eatable food.
        if (this.dist(feed[i]) <= Math.pow(this.size / 2, 2)) {
          this.size = 2 * Math.sqrt(Math.pow(this.size / 2, 2) + Math.pow(feed[i].size / 2, 2));
          feed.splice(i, 1);
          i--;
        } else if (this.dist(feed[i]) < this.dist(feed[cFood])) {
          cFood = i;
        }
      }
    }
    return feed[cFood];
  }

  //gets the closest spawner
  closestSpawner() {
    var sSpawner;
    var bSpawner;
    for (var i = 0; i < spawners.length; i++) {
      if (this.size < spawners[i].size) {
        if (typeof bSpawner == 'undefined' || this.dist(spawners[i]) < this.dist(bSpawner)) {
          bSpawner = spawners[i];
        }
      } else {
        if (typeof sSpawner == 'undefined' || this.dist(spawners[i]) < this.dist(sSpawner)) {
          sSpawner = spawners[i];
        }
      }
    }
    return [sSpawner, bSpawner];
  }


  //gets the closest plate
  closestPetri() {
    var sPetri, bPetri;
    for (var i = 0; i < petris.length; i++) {
      if (this.size < petris[i].size) {
        if (typeof bPetri == 'undefined' || this.dist(petris[i]) < this.dist(bPetri)) {
          bPetri = petris[i];
        }
      } else {
        if (typeof sPetri == 'undefined' || this.dist(petris[i]) < this.dist(sPetri)) {
          sPetri = petris[i];
        }
      }
    }
    return [sPetri, bPetri];
  }

  //gets the closest hole
  closestHole() {
    var nHole = holes[0];
    for (var i = 1; i < holes.length; i++) {
      if (this.dist(holes[i]) < this.dist(nHole)) {
        nHole = holes[i];
      }
    }
    return nHole;
  }

  //gets the closest bigger cell and smaller cell
  closestCells() {
    var sBig, sSmall, cRel;
    for (var i = 0; i < cells.length; i++) {
      if (cells[i].size < this.size) {
        if (typeof cRel === 'undefined' || this.dist(cells[i]) < this.dist(cells[cRel])) {
          if (this.colDist(cells[i].color) <= 4096) {
            cRel = i;
          }
        }
        if (typeof sSmall === 'undefined' || this.dist(cells[i]) < this.dist(cells[sSmall])) {
          if (this.dist(cells[i]) <= Math.pow(this.size / 2, 2)) {
            if (this.colDist(cells[i].color) > 4096) {
              this.size = 2 * Math.sqrt(Math.pow(this.size / 2, 2) + Math.pow(cells[i].size / 2, 2));
              cells.splice(i, 1);
              if (i < currId) {
                currId--;
              }
              if (i < targCell) {
                targCell--;
              }else if ( i == targCell ){
                targCell = currId;
              }
              i--;
            } else if (this.combine) {
              this.age = Math.max(cells[i].age, this.age);
              this.offspring += cells[i].offspring;
              this.size = 2 * Math.sqrt(Math.pow(this.size / 2, 2) + Math.pow(cells[i].size / 2, 2));
              for ( var j = 0; j < randVal([this.args.length, cells[i].args.length]); j++ ){
                if ( this.args.length <= j ){
                  this.args.push(cells[i].args[j]);
                }else if ( cells[i].args.length > j ){
                  this.args[j] = randVal([this.args[j], cells[i].args[j]]);
                }
              }
              cells.splice(i, 1);
              if (i < currId) {
                currId--;
              }
              if (i < targCell) {
                targCell--;
              }else if ( i == targCell ){
                targCell = currId;
              }
              i--;
            }
          } else {
            if (this.colDist(cells[i].color) > 4096) {
              sSmall = i;
            }
          }
        }
      } else if (cells[i].size > this.size) {
        if (typeof sBig === 'undefined' || this.dist(cells[i]) < this.dist(cells[sBig])) {
          if (this.colDist(cells[i].color) > 4096) {
            sBig = i;
          } else {
            cRel = i;
          }
        }
        if (typeof cRel === 'undefined' || this.dist(cells[i]) < this.dist(cells[cRel])) {
          if (this.colDist(cells[i].color) <= 4096) {
            cRel = i;
          }
        }
      }
    }
    return [cells[sSmall], cells[sBig], cells[cRel]];
  }

  //returns absolute distance between color values
  colDist(a) {
    return Math.abs(parseInt('0x' + a.substr(1).toUpperCase()) - parseInt('0x' + this.color.substr(1).toUpperCase()));
  }


  //returns distance between a cell and this cell as well as the point to aim for
  compDist(a) {
    var points = [
      [a.x, a.y],
      [a.x + worldWidth, a.y],
      [a.x - worldWidth, a.y],
      [a.x, a.y + worldHeight],
      [a.x, a.y - worldHeight]
    ];
    var minId = 0;
    for (var i = 0; i < points.length; i++) {
      if (Math.pow(this.x - points[i][0], 2) + Math.pow(this.y - points[i][1], 2) < Math.pow(this.x - points[minId][0], 2) + Math.pow(this.y - points[minId][1], 2)) {
        minId = i;
      }
    }
    var reto = Math.sqrt(Math.pow(this.x - points[minId][0], 2) + Math.pow(this.y - points[minId][1], 2));
    return [reto, points[minId][0], points[minId][1]];
  }

  //Checks whether condition is true
  isCond(comm, all) {
    if (typeof all[comm.condition[0]] === 'undefined') {
      return false;
    }
    switch (comm.condition[1]) {
      case 0:
        if (this.dist(all[comm.condition[0]]) < Math.pow(comm.condition[2] + all[comm.condition[0]].size / 2 + this.size / 2, 2)) {
          return true;
        } else {
          return false;
        }
      case 1:
        if (this.dist(all[comm.condition[0]]) <= Math.pow(comm.condition[2] + all[comm.condition[0]].size / 2 + this.size / 2, 2)) {
          return true;
        } else {
          return false;
        }
      case 2:
        if (this.dist(all[comm.condition[0]]) >= Math.pow(comm.condition[2] + all[comm.condition[0]].size / 2 + this.size / 2, 2)) {
          return true;
        } else {
          return false;
        }
      case 3:
        if (this.dist(all[comm.condition[0]]) > Math.pow(comm.condition[2] + all[comm.condition[0]].size / 2 + this.size / 2, 2)) {
          return true;
        } else {
          return false;
        }
    }
  }

  //Creates a new cell with possibility of mutation
  reproduce() {
    this.offspring++;
    cells.push(newCell(this.size * Math.sqrt(this.fraction), this.x, this.y, this.color, this.fraction, this.args, this.defComm));
    this.size *= Math.sqrt(1 - this.fraction);
  }

  //Cell moves according to its given rules.
  move() {
    if (this.size > 200) {
      this.reproduce();
    }
    var closest = this.closestCells();
    var pets = this.closestPetri();
    var spawns = this.closestSpawner();
    var all = {};

    all["sSpawner"] = spawns[0];
    all["bSpawner"] = spawns[1];
    all["sPetri"] = pets[0];
    all["bPetri"] = pets[1];
    all["cHole"] = this.closestHole();
    all["sSmall"] = closest[0];
    all["sBig"] = closest[1];
    all["cRel"] = closest[2];
    all["cFood"] = this.closestFood();
    var anyPos = true;
    this.combine = false;
    for (var i = 0; i < this.args.length; i++) {
      var comm = this.args[i];
      if (this.isCond(comm, all)) {
        var targ = all[comm.action[1]];
        if (typeof targ !== 'undefined') {
          var targDist = this.compDist(targ);
          this.currAct = i;
          if (comm.action[0] == "goto") {
            if (targDist[0] > 0) {
              anyPos = false;
              this.x -= 5 * (this.x - targDist[1]) / targDist[0];
              this.y -= 5 * (this.y - targDist[2]) / targDist[0];
              break;
            }
          } else if (comm.action[0] == "avoid") {
            if (targDist[0] > 0) {
              anyPos = false;
              this.x += 5 * (this.x - targDist[1]) / targDist[0];
              this.y += 5 * (this.y - targDist[2]) / targDist[0];
              break;
            }
          } else if (comm.action[0] == "combine") {
            this.combine = true;
            break;
          } else if (comm.action[0] == "reproduce") {
            if (this.size > 100) {
              this.reproduce();
              break;
            }
          }
        }
      }
    }
    if (anyPos) {
      this.currAct = -1;
      var targ = all[this.defComm.action[1]];
      while (typeof targ == 'undefined') {
        this.defComm.action[1] = randVal(subjects);
        targ = all[this.defComm.action[1]];
      }
      var targDist = this.compDist(targ);
      if (this.defComm.action[0] == "goto") {
        if (targDist[0] > 0) {
          this.x -= 5 * (this.x - targDist[1]) / targDist[0];
          this.y -= 5 * (this.y - targDist[2]) / targDist[0];
        } else {
          this.defComm.action[1] = randVal(subjects);
        }
      } else if (this.defComm.action[0] == "avoid") {
        if (targDist[0] > 0) {
          this.x += 5 * (this.x - targDist[1]) / targDist[0];
          this.y += 5 * (this.y - targDist[2]) / targDist[0];
        } else {
          this.defComm.action[1] = randVal(subjects);
        }
      } else {
        this.defComm.action[0] = randVal(['goto', 'avoid']);
      }
    }
    if (this.age % 10 == 0){
      var percentageLoss = 0.5;
      var amountLoss = percentageLoss/100 * Math.pow(this.size, 2);
      this.size = Math.sqrt(Math.pow(this.size, 2)-percentageLoss);
      var fSize = Math.sqrt(amountLoss);
      if (fSize > 5){
        var rDeg = randInt(1, 360);
        var rDist = Math.pow(randInt(0, Math.sqrt(this.size)*1000)/2000, 2);
        feed.push(new Food ( fSize, this.x+rDist*Math.cos(rDeg), this.y+rDist*Math.sin(rDeg), this.color ));
      }
    }

    this.x = ((this.x % worldWidth) + worldWidth) % worldWidth;
    this.y = ((this.y % worldHeight) + worldHeight) % worldHeight;
    this.age++;
    if (this.coolDown > 0) {
      this.coolDown--;
    }
  }
}

//Class containing a rule the cell must follow
class Command {
  constructor(condition, action) {
    this.condition = condition;
    this.action = action;
  }
}




//END OF CLASS DEFENITIONS




//START OF PROGRAM




var currId = 0;
var minWorldSize = 0;
var targCell;
var clickHappened = false;
var mousePos;

init();

function init() {
  clickHappened = false;
  canv.width = window.innerWidth;
  canv.height = 0.75 * window.innerHeight;
  setWorld(3000);

  for (var i = 0; i < worldWidth / 600; i++) {
    holes.push(new Hole(
      randInt(0, worldWidth),
      randInt(0, worldHeight),
      randInt(worldWidth / 100, worldWidth / 50)));
  }
  for (var i = 0; i < worldWidth / 200; i++) {
    petris.push(new Petri(
      randInt(worldWidth / 60, worldWidth / 20),
      randInt(0, worldWidth),
      randInt(0, worldHeight)));
    spawners.push(new Spawner(
      randInt(worldWidth / 60, worldWidth / 20),
      randInt(0, worldWidth),
      randInt(0, worldHeight)));
  }
  for (var i = 0; i < worldWidth / 5; i++) {
    cells.push(randomCell(randInt(worldWidth / 2, worldWidth) / 100));
    minWorldSize += Math.PI * Math.pow(cells[cells.length - 1].size / 2, 2);
  }
  var numFood = worldWidth / 8;
  for (var i = 0; i < numFood; i++) {
    randFood(randInt(0, spawners.length-1));
    minWorldSize += Math.PI * Math.pow(feed[feed.length - 1].size / 2, 2);
  }
  targCell = 0;
  window.requestAnimationFrame(frame);
}

//Updates each frame
function frame() {
  for (var id = 0; id < 4; id++) {
    document.getElementById('defComm' + id).classList.remove("yellow");
  }
  var oldest = cells[0];
  var bigMama = cells[0];
  var biggest = cells[0];
  var worldSize = 0;
  context.clearRect(0, 0, canv.width, canv.height);
  for (var i = 0; i < feed.length; i++) {
    context.beginPath();
    context.fillStyle = feed[i].color;
    context.strokeStyle = feed[i].color;
    context.arc(feed[i].x * sizeRatio, feed[i].y * sizeRatio, feed[i].size * sizeRatio / 2, 0, 2 * Math.PI, false);
    context.stroke();
    context.fill();
  }
  context.globalAlpha = 0.5;
  for (currId = 0; currId < cells.length; currId++) {
    cells[currId].move();
    if (typeof cells[currId] !== 'undefined') {
      if (oldest.age < cells[currId].age) {
        oldest = cells[currId];
      }
      if (bigMama.offspring < cells[currId].offspring) {
        bigMama = cells[currId];
      }
      if (biggest.size < cells[currId].size) {
        biggest = cells[currId];
      }
      context.fillStyle = cells[currId].color;
      context.strokeStyle = cells[currId].color;
      var points = getPoints(cells[currId]);
      for (var j = 0; j < points.length; j++) {
        context.beginPath();
        context.arc(points[j][0] * sizeRatio, points[j][1] * sizeRatio, cells[currId].size * sizeRatio / 2, 0, 2 * Math.PI, false);
        context.stroke();
        context.fill();
      }
      worldSize += Math.PI * Math.pow(cells[currId].size / 2, 2);
    }
  }

  for (var i = 0; i < feed.length; i++){
    worldSize += Math.PI * Math.pow(feed[i].size / 2, 2);
  }

  context.lineWidth = 5;
  var points = getPoints(oldest);

  for (var i = 0; i < points.length; i++) {
    context.beginPath();
    context.arc(points[i][0] * sizeRatio, points[i][1] * sizeRatio, oldest.size * sizeRatio / 2 + 2.5, 0, 2 * Math.PI, false);
    context.strokeStyle = "#FFD700";
    context.stroke();
  }

  points = getPoints(bigMama);

  for (var i = 0; i < points.length; i++) {
    context.beginPath();
    context.arc(points[i][0] * sizeRatio, points[i][1] * sizeRatio, Math.max(bigMama.size * sizeRatio / 2 - 2.5, 0), 0, 2 * Math.PI, false);
    context.strokeStyle = "#4286f4";
    context.stroke();
  }

  points = getPoints(biggest);

  for (var i = 0; i < points.length; i++) {
    context.beginPath();
    context.arc(points[i][0] * sizeRatio, points[i][1] * sizeRatio, Math.max(biggest.size * sizeRatio / 2, 0), 0, 2 * Math.PI, false);
    context.strokeStyle = "#129115";
    context.stroke();
  }

  points = getPoints(cells[targCell]);

  for (var i = 0; i < points.length; i++) {
    context.beginPath();
    context.arc(points[i][0] * sizeRatio, points[i][1] * sizeRatio, Math.max(cells[targCell].size * sizeRatio / 2 + 5, 0), 0, 2 * Math.PI, false);
    context.strokeStyle = "#DC143C";
    context.stroke();
  }
  context.lineWidth = 1;

  context.globalAlpha = 0.75;
  for (var i = 0; i < holes.length; i++) {
    context.beginPath();
    context.fillStyle = holes[i].color;
    context.strokeStyle = holes[i].color;
    context.arc(holes[i].x * sizeRatio, holes[i].y * sizeRatio, holes[i].size * sizeRatio / 2, 0, 2 * Math.PI, false);
    context.stroke();
    context.fill();
    holes[i].move();
  }
  context.lineWidth = 5;
  for (var i = 0; i < petris.length; i++) {
    var points = getPoints(petris[i]);
    context.fillStyle = petris[i].color;
    context.strokeStyle = petris[i].color;
    for (var j = 0; j < points.length; j++) {
      context.beginPath();
      context.arc(points[j][0] * sizeRatio, points[j][1] * sizeRatio, petris[i].size * sizeRatio / 2, 0, 2 * Math.PI, false);
      context.globalAlpha = 0.5;
      context.stroke();
      context.globalAlpha = 0.25;
      context.fill();
    }
    petris[i].killCells();
  }
  for (var i = 0; i < spawners.length; i++) {
    var points = getPoints(spawners[i]);
    context.fillStyle = spawners[i].color;
    context.strokeStyle = spawners[i].color;
    for (var j = 0; j < points.length; j++) {
      context.beginPath();
      context.arc(points[j][0] * sizeRatio, points[j][1] * sizeRatio, spawners[i].size * sizeRatio / 2, 0, 2 * Math.PI, false);
      context.globalAlpha = 0.5;
      context.stroke();
      context.globalAlpha = 0.25;
      context.fill();
    }
    spawners[i].eatCells();
  }
  context.lineWidth = 1;
  context.globalAlpha = 1;
  while (worldSize < minWorldSize) {
    randFood(randInt(0, spawners.length-1));
    worldSize += Math.PI * Math.pow(feed[feed.length - 1].size / 2, 2);

    var percentage = 1; //Chance of random cell appearing
    if (randInt(1, 10000) <= percentage * 100) {
      cells.push(randomCell(randInt(1000, 2000) / 100));
      worldSize += Math.PI * Math.pow(cells[cells.length - 1].size / 2, 2);
    }
  }


  displayCell(oldest, 0);
  displayCell(bigMama, 1);
  displayCell(biggest, 2);
  displayCell(cells[targCell], 3);

  if (clickHappened){
    targCell = 0;
    for ( var i = 1; i < cells.length; i++ ){
      if ( cells[i].dist(mousePos) < cells[targCell].dist(mousePos) ) {
        targCell = i;
      }
    }
    clickHappened = false;
  }

  window.requestAnimationFrame(frame);
}

function displayCell(cell, id) {
  document.getElementById('age' + id).innerHTML = "Age: " + cell.age;
  document.getElementById('size' + id).innerHTML = "Size: " + Math.round(cell.size);
  document.getElementById('kid' + id).innerHTML = "Offspring: " + cell.offspring;
  document.getElementById('color' + id).innerHTML = "Color: " + cell.color;
  if (cell.defComm.action[0] == 'combine') {
    document.getElementById('defComm' + id).innerHTML = 'combine with nearby relatives';
  } else if (cell.defComm.action[0] == 'reproduce') {
    document.getElementById('defComm' + id).innerHTML = 'reproduce';
  } else {
    document.getElementById('defComm' + id).innerHTML = "Default Action: " + cell.defComm.action[0] + " the nearest " + mapComm(cell.defComm.action[1], "subj");
  }
  if (cell.currAct == -1) {
    document.getElementById('defComm' + id).setAttribute("class", "yellow");
  }

  updateConds(cell, id);
}


function setWorld(wid) {
  worldWidth = wid;
  worldHeight = canv.height / canv.width * worldWidth;
  sizeRatio = canv.width / worldWidth;
}

//return list of points used for rendering
function getPoints(obj) {
  return [
    [obj.x, obj.y],
    [obj.x + worldWidth, obj.y],
    [obj.x - worldWidth, obj.y],
    [obj.x, obj.y + worldHeight],
    [obj.x, obj.y - worldHeight]
  ];
}

//Creates a random food around a spawner
function randFood(id) {
  var deg = randInt(1, 360);
  var fX = spawners[id].x+randInt(spawners[id].size*1.25/2, spawners[id].size*1.75/2)*Math.cos(deg);
  var fY = spawners[id].y+randInt(spawners[id].size*1.25/2, spawners[id].size*1.75/2)*Math.sin(deg);
  feed.push(new Food(randInt(1, 10), fX, fY, randColor()));
}

//Creates a random cell with random attributes
function randomCell(size) {
  return new Cell(
    size, //size
    randInt(0, worldWidth), //x
    randInt(0, worldHeight), //y
    randColor(), //color
    randInt(100, 500) / 1000, //fraction
    randCommands(randInt(1, 9)), //args
    randCommand()
  );
}


function updateConds(cell, id) {
  var condRow = document.getElementById('cond' + id);
  var actRow = document.getElementById('action' + id);

  while (condRow.firstChild) {
    condRow.removeChild(condRow.firstChild);
  }
  while (actRow.firstChild) {
    actRow.removeChild(actRow.firstChild);
  }

  for (var i = 0; i < cell.args.length; i++) {
    var condNew = document.createElement('td');
    condNew.innerHTML = "if distance to nearest <br>" + mapComm(cell.args[i].condition[0], "subj") + " " + mapComm(cell.args[i].condition[1], "conds") + " " + cell.args[i].condition[2] + " px";
    var actNew = document.createElement('td');
    if (cell.args[i].action[0] == 'combine') {
      actNew.innerHTML = 'combine with nearby relatives';
    } else if (cell.args[i].action[0] == 'reproduce') {
      actNew.innerHTML = 'reproduce';
    } else {
      actNew.innerHTML = cell.args[i].action[0] + " the nearest " + mapComm(cell.args[i].action[1], "subj");
    }
    if (cell.currAct == i) {
      condNew.setAttribute("class", "yellow");
      actNew.setAttribute("class", "yellow");
    }
    condRow.appendChild(condNew);
    actRow.appendChild(actNew);
  }
}

function mapComm(str, type) {
  var dicts = {
    "subj": {
      "sSmall": "small cell",
      "sBig": "big cell",
      "cHole": "wormhole",
      "cFood": "food",
      "sPetri": "small hiding spot",
      "bPetri": "big hiding spot",
      "cRel": "relative",
      "sSpawner": "small spawner",
      "bSpawner": "big spawner"
    },
    "conds": {
      0: "<",
      1: "<=",
      2: ">=",
      3: ">"
    }
  };
  return dicts[type][str];
}


//Creates an array of num random commands
function randCommands(num) {
  comms = new Array();
  for (var i = 0; i < num; i++) {
    comms.push(randCommand());
  }
  return comms;
}

//Creates commands with chance of mutation
function newCell(size, x, y, color, fraction, comms, defComm) {
  newComms = new Array();
  for (var i = 0; i < comms.length; i++) {
    newComms.push(newCommand(comms[i]));
  }

  var newColor = color;

  var percentage = 25; //Chance of change in color
  if (randInt(1, 10000) <= percentage * 100) {
    var col = '0x' + color.substr(1).toUpperCase();
    newColor = '#' + (parseInt(col) + randInt(-4096, 4096)).toString(16);
  }

  percentage = 20; //Chance of change in fraction
  if (randInt(1, 10000) <= percentage * 100) {
    fraction+=randInt(-100, 100)/1000;
    fraction = Math.max(0, Math.min(0.75, fraction));
  }


  percentage = 1; //Chance of completely random color
  if (randInt(1, 10000) <= percentage * 100) {
    newColor = randColor();
  }

  for (i = 0; i < randInt(0, 5); i++) {
    percentage = 0.5; //Chance of losing a command
    if (randInt(1, 10000) <= percentage * 100) {
      newComms.splice(-1, 1);
    }

    percentage = 0.5; //Chance of completely random command
    if (randInt(1, 10000) <= percentage * 100) {
      newComms.push(randCommand());
    }
  }

  return new Cell(size, x, y, newColor, fraction, newComms, newCommand(defComm));
}

//Creates possibly mutated command
function newCommand(comm) {

  var percentage = 1; //Chance of change in subject
  var condition = comm.condition;
  if (randInt(1, 10000) <= percentage * 100) {
    condition[0] = randVal(subjects);
  }

  percentage = 10; //Chance of change in comparison (<,<=,>=,>)
  if (randInt(1, 10000) <= percentage * 100) {
    condition[1] = randInt(0, 3);
  }

  percentage = 25; //Chance of slight change in distance
  if (randInt(1, 10000) <= percentage * 100) {
    condition[2] += randInt(-15, 15);
    condition[2] = Math.min(worldWidth, Math.max(0, condition[2]));
  }

  percentage = 1; //Chance of completely random distance
  if (randInt(1, 10000) <= percentage * 100) {
    condition[2] += randInt(0, 200);
  }

  var action = comm.action;

  percentage = 2; //Chance of change in action
  if (randInt(1, 10000) <= percentage * 100) {
    action[0] = randVal(actions);
  }


  percentage = 5; //Chance of change in target
  if (randInt(1, 10000) <= percentage * 100) {
    action[1] = randVal(subjects);
  }

  return new Command(condition, action);
}

//Creates a random command
function randCommand() {

  var condition = [randVal(subjects), randInt(0, 3), randInt(0, 100)];
  var action = [randVal(actions), randVal(subjects)];

  return new Command(condition, action);
}

//Returns a random hex color
function randColor() {
  return '#' + (Math.random() * 0xFFFFFF << 0).toString(16)
}

//Returns a random int between min and max, inclusive.
function randInt(min, max) {
  min = Math.round(min);
  max = Math.round(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

//Returns a random value in an array
function randVal(a) {
  return a[randInt(0, a.length - 1)];
}

function getMousePos(evt) {
  var rect = canv.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  };
}

canv.addEventListener('click', function(evt) {
  mousePos = getMousePos(evt);
  mousePos.x /= sizeRatio;
  mousePos.y /= sizeRatio;
  clickHappened = true;
}, false);
