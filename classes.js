/**
 * @Author: Edmund Lam <edl>
 * @Date:   07:50:28, 26-Aug-2018
 * @Filename: classes.js
 * @Last modified by:   edl
 * @Last modified time: 08:34:51, 26-Aug-2018
 */

//Superclass for all elements on screen
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
 constructor(size, x, y, id) {
   super(size, x, y, '#DC143C');
   this.id = id;
   this.defaultSize = size;
 }

 act() {
   for (var i = 0; i < cells.length; i++) {
     if (this.dist(cells[i]) <= Math.pow(this.size / 2, 2) && this.size > cells[i].size) {
       this.size = 2 * Math.sqrt(Math.pow(this.size / 2, 2) + Math.pow(cells[i].size / 2, 2));
       if (i < currId) {
         currId--;
       }
       if (i < targCell) {
         targCell--;
       } else if (i == targCell) {
         mousePos = {
           x: cells[i].x,
           y: cells[i].y
         }
         clickHappened = true;
       }
       cells.splice(i, 1);
       i--;
     }
   }
   for (var i = 0; i < feed.length; i++) {
     if (this.dist(feed[i]) <= Math.pow(this.size / 2, 2)) {
       this.size = 2 * Math.sqrt(Math.pow(this.size / 2, 2) + Math.pow(feed[i].size / 2, 2));
       feed.splice(i, 1);
       i--;
     }
   }
   if (this.size > this.defaultSize) {
     randFood(this.id, 1);
     this.size = 2 * Math.sqrt(Math.pow(this.size / 2, 2) - Math.pow(feed[feed.length - 1].size / 2, 2))
   }
 }
}


//Petri dish kills cells near it

class Petri extends Element {
 constructor(size, x, y) {
   super(size, x, y, '#36F72C');
 }

 //forces bigger unlucky passerby cells to break apart
 splitCells() {
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
   var cFood = 0;
   for (var i = 0; i < feed.length; i++) {
     if (this.colDist(feed[i].color) > 4096 && this.dist(feed[i]) < this.dist(feed[cFood])) {
       cFood = i;
     }
   }
   return feed[cFood];
 }

 //eats Food
 eatFood() {
   for (var i = 0; i < feed.length; i++) {
     if (this.colDist(feed[i].color) > 4096 && this.dist(feed[i]) <= Math.pow(this.size / 2, 2)) {
       this.size = 2 * Math.sqrt(Math.pow(this.size / 2, 2) + Math.pow(feed[i].size / 2, 2));
       feed.splice(i, 1);
       i--;
     }
   }
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

 eatCells() {
   for (var i = 0; i < cells.length; i++) {
     if (this.size > cells[i].size && this.dist(cells[i]) <= Math.pow(this.size / 2, 2)) {
       if (this.colDist(cells[i].color) > 4096) {
         this.size = 2 * Math.sqrt(Math.pow(this.size / 2, 2) + Math.pow(cells[i].size / 2, 2));
         cells.splice(i, 1);
         if (i < currId) {
           currId--;
         }
         if (i < targCell) {
           targCell--;
         } else if (i == targCell) {
           targCell = currId;
         }
         i--;
       } else {
         this.age = Math.max(cells[i].age, this.age);
         this.offspring += cells[i].offspring;
         this.size = 2 * Math.sqrt(Math.pow(this.size / 2, 2) + Math.pow(cells[i].size / 2, 2));
         for (var j = 0; j < randVal([this.args.length, cells[i].args.length]); j++) {
           if (this.args.length <= j) {
             this.args.push(cells[i].args[j]);
           } else if (cells[i].args.length > j) {
             if (this.args[j].uses < cells[i].args[j]) {
               this.args[j] = cells[i].args[j];
             }
           }
         }
         cells.splice(i, 1);
         if (i < currId) {
           currId--;
         }
         if (i < targCell) {
           targCell--;
         } else if (i == targCell) {
           targCell = currId;
         }
         i--;
       }
     }
   }
 }

 //gets the closest bigger cell and smaller cell and relative
 closestCells() {
   var sBig, sSmall, cRel;
   for (var i = 0; i < cells.length; i++) {
     if (cells[i].size < this.size) {
       if (this.colDist(cells[i].color) <= 4096) {
         if (typeof cRel === 'undefined' || this.dist(cells[i]) < this.dist(cells[cRel])) {
           cRel = i;
         }
       } else if (typeof sSmall === 'undefined' || this.dist(cells[i]) < this.dist(cells[sSmall])) {
         if (this.colDist(cells[i].color) > 4096) {
           sSmall = i;
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
 isCond(comm) {
   if (typeof this.all[comm.condition[0]] === 'undefined') {
     return false;
   }
   switch (comm.condition[1]) {
     case 0:
       if (this.dist(this.all[comm.condition[0]]) < Math.pow(comm.condition[2] + this.all[comm.condition[0]].size / 2 + this.size / 2, 2)) {
         return true;
       } else {
         return false;
       }
     case 1:
       if (this.dist(this.all[comm.condition[0]]) <= Math.pow(comm.condition[2] + this.all[comm.condition[0]].size / 2 + this.size / 2, 2)) {
         return true;
       } else {
         return false;
       }
     case 2:
       if (this.dist(this.all[comm.condition[0]]) >= Math.pow(comm.condition[2] + this.all[comm.condition[0]].size / 2 + this.size / 2, 2)) {
         return true;
       } else {
         return false;
       }
     case 3:
       if (this.dist(this.all[comm.condition[0]]) > Math.pow(comm.condition[2] + this.all[comm.condition[0]].size / 2 + this.size / 2, 2)) {
         return true;
       } else {
         return false;
       }
   }
 }

 //Creates a new cell with possibility of mutation
 reproduce() {
   this.offspring++;
   cells.push(newCell(this.size * Math.sqrt(this.fraction), this.x, this.y, this.color, this.fraction, this.args, this.defComm, this.age));
   this.size *= Math.sqrt(1 - this.fraction);
 }

 addtoAll(subj) {
   if (!(subj in this.all)) {
     switch (subj) {
       case "sSpawner":
       case "bSpawner":
         var spawns = this.closestSpawner();
         this.all["sSpawner"] = spawns[0];
         this.all["bSpawner"] = spawns[1];
         break;
       case "sSmall":
       case "sBig":
       case "cRel":
         var closest = this.closestCells();
         this.all["sSmall"] = closest[0];
         this.all["sBig"] = closest[1];
         this.all["cRel"] = closest[2];
         break;
       case "sPetri":
       case "bPetri":
         var pets = this.closestPetri();
         this.all["sPetri"] = pets[0];
         this.all["bPetri"] = pets[1];
         break;
       case "cHole":
         this.all["cHole"] = this.closestHole();
         break;
       case "cFood":
         this.all["cFood"] = this.closestFood();
         break;
       default:
         break;
     }
   }
 }

 //Cell moves according to its given rules.
 move() {
   if (this.size > 200) {
     this.reproduce();
   }
   this.all = {};
   this.eatFood();
   this.eatCells();

   var anyPos = true;
   this.combine = false;
   for (var i = 0; i < this.args.length; i++) {
     var comm = this.args[i];
     this.addtoAll(comm.condition[0]);
     if (this.isCond(comm)) {
       this.args[i].uses++;
       if (comm.action[0] == "combine") {
         this.combine = true;
         break;
       } else if (comm.action[0] == "reproduce") {
         if (this.size > 100) {
           this.reproduce();
           break;
         }
       } else {
         this.addtoAll(comm.action[1]);
         var targ = this.all[comm.action[1]];
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
           }
         }
       }
     }
   }
   if (anyPos) {
     this.currAct = -1;
     this.addtoAll(this.all[this.defComm.action[1]]);
     var targ = this.all[this.defComm.action[1]];
     while (typeof targ == 'undefined') {
       this.defComm.action[1] = randVal(subjects);
       targ = this.all[this.defComm.action[1]];
       this.defComm.uses = 0;
     }
     var targDist = this.compDist(targ);
     if (this.defComm.action[0] == "goto") {
       if (targDist[0] > 0) {
         this.x -= 5 * (this.x - targDist[1]) / targDist[0];
         this.y -= 5 * (this.y - targDist[2]) / targDist[0];
       } else {
         this.defComm.uses = 0;
         this.defComm.action[1] = randVal(subjects);
       }
     } else if (this.defComm.action[0] == "avoid") {
       if (targDist[0] > 0) {
         this.x += 5 * (this.x - targDist[1]) / targDist[0];
         this.y += 5 * (this.y - targDist[2]) / targDist[0];
       } else {
         this.defComm.uses = 0;
         this.defComm.action[1] = randVal(subjects);
       }
     } else {
       this.defComm.uses = 0;
       this.defComm.action[0] = randVal(['goto', 'avoid']);
     }
     this.defComm.uses++;
   }
   if (fSize > 10 && this.age % 5 == 0) {
     var percentageLoss = 2;
   } else {
     var percentageLoss = 0.5;
   }
   var amountLoss = percentageLoss / 100 * Math.pow(this.size, 2);
   this.size = Math.sqrt(Math.pow(this.size, 2) - amountLoss);
   var fSize = Math.sqrt(amountLoss);
   if (fSize > 10 && this.age % 5 == 0) {
     var rDeg = randInt(1, 360);
     var rDist = Math.pow(randInt(0, Math.sqrt(this.size) * 1000) / 2000, 2);
     feed.push(new Food(fSize, this.x + rDist * Math.cos(rDeg), this.y + rDist * Math.sin(rDeg), this.color));
   }

   if (this.size <= worldWidth / 600) {
     if (currId < targCell) {
       targCell--;
     } else if (currId == targCell) {
       mousePos = {
         x: cells[i].x,
         y: cells[i].y
       }
       clickHappened = true;
     }
     cells.splice(currId, 1);
     currId--;
     currId--;
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
   this.uses = 0;
   this.condition = condition;
   this.action = action;
 }
}
