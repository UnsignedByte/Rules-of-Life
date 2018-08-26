/**
 * @Author: Edmund Lam <edl>
 * @Date:   16:42:00, 13-Feb-2018
 * @Filename: sim.js
 * @Last modified by:   edl
 * @Last modified time: 08:18:32, 26-Aug-2018
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

var currId = 0;
var minWorldSize = 0;
var targCell;
var clickHappened = false;
var mousePos;
var concTime;

init();

function init() {
  clickHappened = false;
  canv.width = window.innerWidth;
  canv.height = Math.round(2 / 3 * window.innerHeight);
  setWorld(3000);

  for (var i = 0; i < worldWidth / 600; i++) {
    holes.push(new Hole(
      randInt(0, worldWidth),
      randInt(0, worldHeight),
      randInt(worldWidth / 100, worldWidth / 50)));
  }
  for (var i = 0; i < worldWidth / 400; i++) {
    petris.push(new Petri(
      randInt(worldWidth / 60, worldWidth / 20),
      randInt(0, worldWidth),
      randInt(0, worldHeight)));
    spawners.push(new Spawner(
      randInt(worldWidth / 30, worldWidth / 20),
      randInt(0, worldWidth),
      randInt(0, worldHeight),
      i));
  }
  console.log(spawners);
  for (var i = 0; i < worldWidth / 6; i++) {
    cells.push(randomCell(randInt(worldWidth / 2, worldWidth) / 60));
    minWorldSize += Math.PI * Math.pow(cells[cells.length - 1].size / 2, 2);
  }
  var numFood = 1;
  for (var i = 0; i < numFood; i++) {
    randFood(randInt(0, spawners.length - 1), randInt(1, 5));
    minWorldSize += Math.PI * Math.pow(feed[feed.length - 1].size / 2, 2);
  }
  targCell = 0;
  window.requestAnimationFrame(frame);
}

//Updates each frame
function frame() {
  concTime = Date.now();
  for (var id = 0; id < 4; id++) {
    document.getElementById('defComm' + id).classList.remove("yellow");
  }
  var oldest = cells[0];
  var bigMama = cells[0];
  var biggest = cells[0];
  var worldSize = 0;
  context.clearRect(0, 0, canv.width, canv.height);
  context.globalAlpha = 0.75;
  for (var i = 0; i < feed.length; i++) {
    context.beginPath();
    context.fillStyle = feed[i].color;
    context.strokeStyle = feed[i].color;
    context.arc(feed[i].x * sizeRatio, feed[i].y * sizeRatio, feed[i].size * sizeRatio / 2, 0, 2 * Math.PI, false);
    context.stroke();
    context.fill();
    feed[i].age++;
    if (feed[i].age > 1000) {
      feed.splice(i, 1);
      i--;
    }
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

  for (var i = 0; i < feed.length; i++) {
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
    petris[i].splitCells();
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
    spawners[i].act();
  }
  context.lineWidth = 1;
  context.globalAlpha = 1;
  while (worldSize < minWorldSize) {
    randFood(randInt(0, spawners.length - 1), randInt(1, 5));
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

  if (clickHappened) {
    targCell = 0;
    for (var i = 1; i < cells.length; i++) {
      if (cells[i].dist(mousePos) < cells[targCell].dist(mousePos)) {
        targCell = i;
      }
    }
    clickHappened = false;
  }
  context.fillStyle = '#000000';
  context.font = '24px Courier';
  context.fillText('FPS: ' + Math.round(100000 / (Date.now() - concTime)) / 100, 10, canv.height - 10)
  // console.log("Framerate:", 1000 / (Date.now() - concTime), "frames per second")

  window.requestAnimationFrame(frame);
}

function displayCell(cell, id) {
  if (typeof cell !== 'undefined') {
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
function randFood(id, override) {
  if (override === 1) {
    var deg = randInt(1, 360);
    var fX = spawners[id].x + Math.pow(randInt(Math.sqrt(spawners[id].size * 1 / 2), Math.sqrt(spawners[id].size * 2.25 / 2)), 2) * Math.cos(deg);
    var fY = spawners[id].y + Math.pow(randInt(Math.sqrt(spawners[id].size * 1 / 2), Math.sqrt(spawners[id].size * 2.25 / 2)), 2) * Math.sin(deg);
    feed.push(new Food(randInt(worldWidth / 600, spawners[id].size / 5), fX, fY, randColor()));
  } else {
    feed.push(new Food(randInt(worldWidth / 600, worldWidth / 150), randInt(0, worldWidth), randInt(0, worldHeight), randColor()));
  }
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
  var usesRow = document.getElementById('uses' + id);

  while (condRow.firstChild) {
    condRow.removeChild(condRow.firstChild);
  }
  while (actRow.firstChild) {
    actRow.removeChild(actRow.firstChild);
  }
  while (usesRow.firstChild) {
    usesRow.removeChild(usesRow.firstChild);
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
    var usesNew = document.createElement('td');
    usesNew.innerHTML = "uses: "+cell.args[i].uses;
    condRow.appendChild(condNew);
    actRow.appendChild(actNew);
    usesRow.appendChild(usesNew);
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
function newCell(size, x, y, color, fraction, comms, defComm, age) {
  newComms = new Array();
  for (var i = 0; i < comms.length; i++) {
    newComms.push(newCommand(comms[i], age));
  }

  var newColor = color;

  var percentage = 10; //Chance of change in color
  if (randInt(1, 10000) <= percentage * 100) {
    var col = '0x' + color.substr(1).toUpperCase();
    newColor = '#' + (parseInt(col) + randInt(-4096, 4096)).toString(16);
  }

  percentage = 7.5; //Chance of change in fraction
  if (randInt(1, 10000) <= percentage * 100) {
    fraction += randInt(-100, 100) / 1000;
    fraction = Math.max(0, Math.min(0.75, fraction));
  }

  for (i = 0; i < randInt(0, 5); i++) {
    percentage = 0.1; //Chance of losing a command
    if (randInt(1, 10000) <= percentage * 100) {
      newComms.splice(-1, 1);
    }

    percentage = 0.1; //Chance of completely random command
    if (randInt(1, 10000) <= percentage * 100) {
      newComms.push(randCommand());
    }
  }

  return new Cell(size, x, y, newColor, fraction, newComms, newCommand(defComm));
}

//Creates possibly mutated command
function newCommand(comm, age) {

  if (comm.uses > 0) {
    var commratio = age / comm.uses / 10;
  } else {
    var commratio = age;
  }

  var percentage = 0.5; //Chance of change in subject
  var condition = comm.condition;
  if (randInt(1, 10000) <= commratio * percentage * 100) {
    condition[0] = randVal(subjects);
  }

  percentage = 2.5; //Chance of change in comparison (<,<=,>=,>)
  if (randInt(1, 10000) <= commratio * percentage * 100) {
    condition[1] = randInt(0, 3);
  }

  percentage = 10; //Chance of slight change in distance
  if (randInt(1, 10000) <= commratio * percentage * 100) {
    condition[2] += randInt(-15, 15);
    condition[2] = Math.min(worldWidth, Math.max(0, condition[2]));
  }

  percentage = 1; //Chance of completely random distance
  if (randInt(1, 10000) <= commratio * percentage * 100) {
    condition[2] += randInt(0, 200);
  }

  var action = comm.action;

  percentage = 0.5; //Chance of change in action
  if (randInt(1, 10000) <= commratio * percentage * 100) {
    action[0] = randVal(actions);
  }


  percentage = 0.5; //Chance of change in target
  if (randInt(1, 10000) <= commratio * percentage * 100) {
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

//Returns the position of the mouse
function getMousePos(evt) {
  var rect = canv.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  };
}

//Check when click for targeting
canv.addEventListener('click', function(evt) {
  mousePos = getMousePos(evt);
  mousePos.x /= sizeRatio;
  mousePos.y /= sizeRatio;
  clickHappened = true;
}, false);
