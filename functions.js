/**
 * @Author: Edmund Lam <edl>
 * @Date:   08:33:54, 26-Aug-2018
 * @Filename: functions.js
 * @Last modified by:   edl
 * @Last modified time: 08:38:10, 26-Aug-2018
 */


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
