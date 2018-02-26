/**
 * @Author: Edmund Lam <edl>
 * @Date:   16:42:00, 13-Feb-2018
 * @Filename: sim.js
 * @Last modified by:   edl
 * @Last modified time: 10:31:15, 26-Feb-2018
 */
//the canvas
var canv = document.getElementById('world');
var context = canv.getContext("2d");
//Array of all existing elements
var petris = new Array();
var holes = new Array();
var feed = new Array();
var cells = new Array();

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
    var posX = Math.min(Math.abs(this.x - a.x), canv.width - Math.abs(this.x - a.x));
    var posY = Math.min(Math.abs(this.y - a.y), canv.height - Math.abs(this.y - a.y));
    return Math.sqrt(Math.pow(posX, 2) + Math.pow(posY, 2));
  }
}


//Petri dish kills cells near it

class Petri extends Element {
  constructor(size, x, y) {
    super(size, x, y, '#DC143C');
  }

  //kills smaller unlucky passerby cells and feed
  killCells() {
    for (var i = 0; i < cells.length; i++) {
      if (this.dist(cells[i]) <= this.size / 2 && this.size > cells[i].size) {
        cells.splice(i, 1);
        i--;
      }
    }
    for (var i = 0; i < feed.length; i++) {
      if (this.dist(feed[i]) <= this.size / 2 ) {
        feed.splice(i, 1);
        i--;
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
      if (this.dist(cells[i]) <= this.size / 2 && this.size > cells[i].size && cells[i].coolDown == 0) {
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
    this.age++;
    if (this.age >= randInt(50000, 100000)) {
      this.x = randInt(0, canv.width);
      this.y = randInt(0, canv.height);
      this.size = randInt(25, 50);
      this.direction = randInt(1, 360);
      this.age = 0;
    }
  }
}


//Food class
class Food extends Element {
  constructor(size, x, y, color) {
    super(size, x, y, color);
  }

  ageInc(i) {
    this.age++;
    if (this.age > 1000) {
      feed[i] = new Food(
        randInt(1, 10),
        randInt(0, canv.width),
        randInt(0, canv.height),
        randColor());
    }
  }
}


//Cell Class, contains all attributes for cell as well as how cell should move each frame.
class Cell extends Element {
  /**
   * Variable Descriptions
   * size is the size of the Cell
   * (x,y) is the position of the Cell
   * color is the cell trail color
   */
  constructor(size, x, y, color, args, defComm) {
    super(size, x, y, color);
    this.args = args;
    this.offspring = 0;
    this.combine = false;
    this.defComm = defComm;
    this.coolDown = 0;
  }

  //gets the closest food and eats food that is within it's grasp
  closestFood() {
    var eatable = new Array();
    var cFood = 0;
    for (var i = 0; i < feed.length; i++) {
      //Eats food that can be eaten and finds closest non-eatable food.
      if (this.dist(feed[i]) <= this.size / 2) {
        this.size = 2 * Math.sqrt(Math.pow(this.size / 2, 2) + Math.pow(feed[i].size / 2, 2));
        feed.splice(i, 1);
        i--;
      } else if (this.dist(feed[i]) < this.dist(feed[cFood])) {
        cFood = i;
      }
    }
    return feed[cFood];
  }

  //gets the closest plate
  closestPetri() {
    var cPetri = petris[0];
    for (var i = 1; i < petris.length; i++) {
      if (this.dist(petris[i]) < this.dist(cPetri)) {
        cPetri = petris[i];
      }
    }
    return cPetri
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
    var sBig, sSmall;
    for (var i = 0; i < cells.length; i++) {
      if (cells[i].size < this.size) {
        if (typeof sSmall === 'undefined' || this.dist(cells[i]) < this.dist(cells[sSmall])) {
          if (this.dist(cells[i]) <= this.size / 2) {
            if (this.colDist(cells[i].color) > 4096) {
              this.size = 2 * Math.sqrt(Math.pow(this.size / 2, 2) + Math.pow(cells[i].size / 2, 2));
              cells.splice(i, 1);
              if (i < currId) {
                currId--;
              }
              i--;
            } else if (this.combine && randInt(0, 500) == 0) {
              this.age = Math.max(cells[i].age, this.age);
              this.offspring += cells[i].offspring;
              this.size = 2 * Math.sqrt(Math.pow(this.size / 2, 2) + Math.pow(cells[i].size / 2, 2));
              cells.splice(i, 1);
              if (i < currId) {
                currId--;
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
          }
        }
      }
    }
    return [cells[sSmall], cells[sBig]];
  }

  //returns absolute distance between color values
  colDist(a) {
    return Math.abs(parseInt('0x' + a.substr(1).toUpperCase()) - parseInt('0x' + this.color.substr(1).toUpperCase()));
  }


  //returns distance between a cell and this cell as well as the point to aim for
  compDist(a) {
    var points = [
      [a.x, a.y],
      [a.x + canv.width, a.y],
      [a.x - canv.width, a.y],
      [a.x, a.y + canv.height],
      [a.x, a.y - canv.height]
    ];
    var minId = 0;
    for (var i = 0; i < points.length; i++) {
      if (Math.pow(this.x - points[i][0], 2) + Math.pow(this.y - points[i][1], 2) < Math.pow(this.x - points[minId][0], 2) + Math.pow(this.y - points[minId][1], 2)) {
        minId = i;
      }
    }
    var reto = Math.sqrt(Math.pow(this.x - points[minId][0], 2) + Math.pow(this.y - points[minId][1], 2));
    if (isNaN(reto)) {
      console.log(this.x, points[minId][0], this.y, points[minId][1])
    }
    return [reto, points[minId][0], points[minId][1]];
  }

  //Checks whether condition is true
  isCond(comm, all) {
    if (typeof all[comm.condition[0]] === 'undefined') {
      return false;
    }
    switch (comm.condition[1]) {
      case 0:
        if (this.dist(all[comm.condition[0]]) < comm.condition[2]) {
          return true;
        } else {
          return false;
        }
      case 1:
        if (this.dist(all[comm.condition[0]]) <= comm.condition[2]) {
          return true;
        } else {
          return false;
        }
      case 2:
        if (this.dist(all[comm.condition[0]]) >= comm.condition[2]) {
          return true;
        } else {
          return false;
        }
      case 3:
        if (this.dist(all[comm.condition[0]]) > comm.condition[2]) {
          return true;
        } else {
          return false;
        }
    }
  }

  //Creates a new cell with possibility of mutation
  reproduce() {
    var fraction = randInt(100, 500) / 1000; //Amount used to form child
    cells.push(newCell(this.size * Math.sqrt(fraction), this.x, this.y, this.color, this.args, this.defComm));
    this.size *= Math.sqrt(1 - fraction);
  }

  //Cell moves according to its given rules.
  move() {
    if (randInt(Math.min(this.size, 500), 500) >= 490 && this.size > 50) {
      this.reproduce();
      this.offspring++;
    }
    var closest = this.closestCells();
    var all = {};
    all["cPetri"] = this.closestPetri();
    all["cHole"] = this.closestHole();
    all["sSmall"] = closest[0];
    all["sBig"] = closest[1];
    all["cFood"] = this.closestFood();
    var anyPos = true;
    this.combine = false;
    for (var i = 0; i < this.args.length; i++) {
      var comm = this.args[i];
      if (this.isCond(comm, all)) {
        var targ = all[comm.action[1]];
        if (typeof targ !== 'undefined') {
          var targDist = this.compDist(targ);
          if (comm.action[0] == "goto") {
            if (targDist[0] > 0) {
              anyPos = false;
              this.x -= 5 * (this.x - targDist[1]) / targDist[0];
              this.y -= 5 * (this.y - targDist[2]) / targDist[0];
            }
          } else if (comm.action[0] == "avoid") {
            if (targDist[0] > 0) {
              anyPos = false;
              this.x += 5 * (this.x - targDist[1]) / targDist[0];
              this.y += 5 * (this.y - targDist[2]) / targDist[0];
            }
          } else if (comm.action[0] == "combine") {
            this.combine = true;
          }
          if (isNaN(this.x) || isNaN(this.y)) {
            console.log(this, targ, targDist[0]);
          }
        }
        break;
      }
    }
    if (anyPos) {
      var targ = all[this.defComm.action[1]];
      while (typeof targ == 'undefined') {
        this.defComm.action[1] = randVal(['cHole', 'sSmall', 'sBig', 'cFood']);
        targ = all[this.defComm.action[1]];
      }
      var targDist = this.compDist(targ);
      if (this.defComm.action[0] == "goto") {
        if (targDist[0] > 0) {
          this.x -= 5 * (this.x - targDist[1]) / targDist[0];
          this.y -= 5 * (this.y - targDist[2]) / targDist[0];
        }
      } else if (this.defComm.action[0] == "avoid") {
        if (targDist[0] > 0) {
          this.x += 5 * (this.x - targDist[1]) / targDist[0];
          this.y += 5 * (this.y - targDist[2]) / targDist[0];
        }
      } else if (this.defComm.action[0] == "combine") {
        this.combine = true;
        this.defComm.action[0] = randVal(['goto', 'avoid']);
      }
      if (isNaN(this.x) || isNaN(this.y)) {
        console.log(this, targ, targDist[0]);
      }
    }
    var millionthLost = 0.5;
    this.size -= 2 * Math.sqrt(Math.pow(this.size / 2, 2) * (millionthLost / 1000000));
    this.x = ((this.x % canv.width) + canv.width) % canv.width;
    this.y = ((this.y % canv.height) + canv.height) % canv.height;
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

init();

function init() {
  canv.width = window.innerWidth;
  canv.height = 0.75 * window.innerHeight;
  for (var i = 0; i < 5; i++) {
    holes.push(new Hole(
      randInt(0, canv.width),
      randInt(0, canv.height),
      randInt(10, 50)));
  }
  for (var i = 0; i < 5; i++) {
    petris.push(new Petri(
      randInt(100, 150),
      randInt(0, canv.width),
      randInt(0, canv.height)));
  }
  for (var i = 0; i < 1000; i++) {
    cells.push(randomCell(randInt(1000, 2000) / 100));
    minWorldSize += Math.PI * Math.pow(cells[cells.length - 1].size / 2, 2);
  }
  var numFood = 1000;
  for (var i = 0; i < numFood; i++) {
    feed.push(new Food(
      randInt(1, 10),
      randInt(0, canv.width),
      randInt(0, canv.height),
      randColor()
    ));
    minWorldSize += Math.PI * Math.pow(feed[feed.length - 1].size / 2, 2);
  }
  window.requestAnimationFrame(frame);
}

//Updates each frame
function frame() {
  var oldest = cells[0];
  var bigMama = cells[0];
  var worldSize = 0;
  context.clearRect(0, 0, canv.width, canv.height);
  for (var i = 0; i < feed.length; i++) {
    context.beginPath();
    context.fillStyle = feed[i].color;
    context.strokeStyle = feed[i].color;
    context.arc(feed[i].x, feed[i].y, feed[i].size / 2, 0, 2 * Math.PI, false);
    context.stroke();
    context.fill();
    feed[i].ageInc(i);
    worldSize += Math.PI * Math.pow(feed[i].size / 2, 2);
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
      context.fillStyle = cells[currId].color;
      context.strokeStyle = cells[currId].color;
      var points = [
        [cells[currId].x, cells[currId].y],
        [cells[currId].x + canv.width, cells[currId].y],
        [cells[currId].x - canv.width, cells[currId].y],
        [cells[currId].x, cells[currId].y + canv.height],
        [cells[currId].x, cells[currId].y - canv.height]
      ]
      for (var j = 0; j < points.length; j++) {
        context.beginPath();
        context.arc(points[j][0], points[j][1], cells[currId].size / 2, 0, 2 * Math.PI, false);
        context.stroke();
        context.fill();
      }
      worldSize += Math.PI * Math.pow(cells[currId].size / 2, 2);
    }
  }
  context.globalAlpha = 0.75;
  for (var i = 0; i < holes.length; i++) {
    context.beginPath();
    context.fillStyle = holes[i].color;
    context.strokeStyle = holes[i].color;
    context.arc(holes[i].x, holes[i].y, holes[i].size / 2, 0, 2 * Math.PI, false);
    context.stroke();
    context.fill();
    holes[i].move();
  }
  for (var i = 0; i < petris.length; i++) {
    context.beginPath();
    context.fillStyle = petris[i].color;
    context.lineWidth = 5;
    context.strokeStyle = petris[i].color;
    context.arc(petris[i].x, petris[i].y, petris[i].size / 2, 0, 2 * Math.PI, false);
    context.globalAlpha = 0.5;
    context.stroke();
    context.globalAlpha = 0.25;
    context.fill();
    context.lineWidth = 1;
    petris[i].killCells();
  }
  context.globalAlpha = 1;
  while (worldSize < minWorldSize) {
    feed.push(new Food(
      randInt(1, 10),
      randInt(0, canv.width),
      randInt(0, canv.height),
      randColor()
    ));
    worldSize += Math.PI * Math.pow(feed[feed.length - 1].size / 2, 2);

    var percentage = 1; //Chance of random cell appearing
    if (randInt(1, 10000) <= percentage * 100) {
      cells.push( randomCell( randInt( 25, 50 ) ) );
      worldSize += Math.PI * Math.pow(cells[cells.length - 1].size / 2, 2);
    }
  }

  context.beginPath();
  context.arc(oldest.x, oldest.y, oldest.size / 2 + 2.5, 0, 2 * Math.PI, false);
  context.strokeStyle = "#FFD700";
  context.lineWidth = 5;
  context.stroke();

  context.beginPath();
  context.arc(bigMama.x, bigMama.y, Math.max(bigMama.size / 2 - 2.5, 0), 0, 2 * Math.PI, false);
  context.strokeStyle = "#4286f4";
  context.stroke();
  context.lineWidth = 1;

  displayCell(oldest, 0);
  displayCell(bigMama, 1);

  window.requestAnimationFrame(frame);
}

function displayCell(cell, id) {
  document.getElementById('age' + id).innerHTML = "Age: " + cell.age;
  document.getElementById('size' + id).innerHTML = "Size: " + Math.round(cell.size);
  document.getElementById('position' + id).innerHTML = "Position: (" + Math.round(cell.x) + "," + Math.round(cell.y) + ")";

  updateConds(cell, id);
}

//Creates a random cell with random attributes
function randomCell(size) {
  return new Cell(
    size, //size
    randInt(0, canv.width), //x
    randInt(0, canv.height), //y
    randColor(), //color
    randCommands(10), //args
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
    condRow.appendChild(condNew);
    var actNew = document.createElement('td');
    if (cell.args[i].action[0] == 'combine') {
      actNew.innerHTML = 'combine with nearby relatives';
    } else {
      actNew.innerHTML = cell.args[i].action[0] + " the nearest " + mapComm(cell.args[i].action[1], "subj");
    }
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
      "cPetri": "anti-biotic plate"
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
function newCell(size, x, y, color, comms, defComm) {
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

  var percentage = 1; //Chance of completely random color
  if (randInt(1, 10000) <= percentage * 100) {
    newColor = randColor();
  }

  for (i = 0; i < randInt(0, 5); i++) {
    percentage = 0.5; //Chance of losing a command
    if (randInt(1, 10000) <= percentage * 100) {
      newComms.splice(-1, 1);
    }

    var percentage = 0.5; //Chance of completely random command
    if (randInt(1, 10000) <= percentage * 100) {
      newComms.push(randCommand());
    }
  }

  return new Cell(size, x, y, newColor, newComms, newCommand(defComm));
}

//Creates possibly mutated command
function newCommand(comm) {
  var actions = ["combine", "avoid", "goto"];
  var subjects = ["sBig", "sSmall", "cFood", "cHole", "cPetri"];

  var percentage = 1; //Chance of change in subject
  var condition = comm.condition;
  if (randInt(1, 10000) <= percentage * 100) {
    condition[0] = randVal(subjects);
  }

  percentage = 1; //Chance of change in comparison (<,<=,>=,>)
  if (randInt(1, 10000) <= percentage * 100) {
    condition[1] = randInt(0, 3);
  }

  percentage = 20; //Chance of slight change in distance
  if (randInt(1, 10000) <= percentage * 100) {
    condition[2] += randInt(-15, 15);
    condition[2] = Math.min(canv.width, Math.max(0, condition[2]));
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


  percentage = 1; //Chance of change in target
  if (randInt(1, 10000) <= percentage * 100) {
    action[1] = randVal(subjects);
  }


  return new Command(condition, action);
}

//Creates a random command
function randCommand() {
  var actions = ["combine", "avoid", "goto"];
  var subjects = ["sBig", "sSmall", "cFood", "cHole", "cPetri"];

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
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

//Returns a random value in an array
function randVal(a) {
  return a[randInt(0, a.length - 1)];
}
