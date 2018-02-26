/**
 * @Author: Edmund Lam <edl>
 * @Date:   16:42:00, 13-Feb-2018
 * @Filename: sim.js
 * @Last modified by:   edl
 * @Last modified time: 21:03:33, 25-Feb-2018
 */

//the canvas
var canv = document.getElementById('world');
var context = canv.getContext("2d");
//Array of all existing elements
var holes = new Array();
var feed = new Array();
var cells = new Array();

//Superclass for all elements on screen, contains a position
class Element {
  constructor(x, y, color){
    this.x=x;
    this.y=y;
    this.age = 0;
    this.color = color;
  }
}


//Hole class that kills all cells touching it
class Hole extends Element {
  constructor(x, y, size){
    super(x, y, '#000000');
    this.size = size;
    this.direction = randInt(1, 360);
  }

  //kills unlucky passerby cells
  killCells(){
    for ( var i = 0; i < cells.length; i++ ){
      if ( this.dist(cells[i])<=this.size/2 && this.size>cells[i].size ){
        this.age--;
        cells.splice(i, 1);
        i--;
      }
    }
  }

  //returns distance between a cell and this hole
  dist(a){
    var posX = Math.min(Math.abs(this.x-a.x), canv.width-Math.abs(this.x-a.x));
    var posY = Math.min(Math.abs(this.y-a.y), canv.height-Math.abs(this.y-a.y));
    this.age++;
    if ( this.age >= randInt(50000, 100000) ){
      this.x = randInt(0, canv.width);
      this.y = randInt(0, canv.height);
      this.size = randInt(25, 50);
      this.direction = randInt(1, 360);
      this.age = 0;
    }
    return Math.sqrt(Math.pow(posX,2)+Math.pow(posY,2));
  }

  //Move each frame
  move(){
    this.killCells();
    this.direction+=randInt(-30, 30);
    this.x+=5*Math.cos(this.direction/180*Math.PI);
    this.y+=5*Math.sin(this.direction/180*Math.PI);
  }
}


//Food class
class Food extends Element {
  constructor(x, y, color){
    super(x, y, color);
  }

  ageInc(i){
    this.age++;
    if ( this.age>1000 ){
      feed[i] = new Food(
        randInt(0,canv.width),
        randInt(0,canv.height),
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
  constructor(size, x, y, color, args){
    super(x, y, color);
    this.size = size;
    this.args = args;
    this.offspring = 0;
    this.combine = false;
  }

  //gets the closest food and eats food that is within it's grasp
  closestFood(){
    var eatable = new Array();
    var cFood = 0;
    for ( var i = 0; i < feed.length; i++ ){
      //Eats food that can be eaten and finds closest non-eatable food.
      if ( this.dist(feed[i])<=this.size/2 ){
        this.size=2*Math.sqrt(Math.pow(this.size/2, 2)+Math.PI/4);
        feed.splice(i, 1);
        i--;
      }else if ( this.dist( feed[i] ) < this.dist( feed[cFood] ) ) {
        cFood = i;
      }
    }
    return feed[cFood];
  }

  //gets the closest hole
  closestHole(){
    var nHole = holes[0];
    for ( var i = 1; i < holes.length; i++ ){
      if ( this.dist(holes[i]) < this.dist(nHole) ){
        nHole = holes[i];
      }
    }
    return nHole;
  }

  //gets the closest bigger cell and smaller cell
  closestCells(){
    var sBig, sSmall;
    for ( var i = 0; i < cells.length; i++ ){
      if ( this.dist(cells[i]) == 0 ){
        continue;
      }else if ( cells[i].size < this.size ) {
        if( typeof sSmall === 'undefined' || this.dist(cells[i])<this.dist(cells[sSmall])){
          if ( this.dist(cells[i]) <= this.size/2 ) {
            if ( this.colDist(cells[i].color) > 4096 ){
              this.size = 2*Math.sqrt(Math.pow(this.size/2, 2)+Math.pow(cells[i].size/2, 2));
              cells.splice(i, 1);
              if ( i < currId ) {
                currId--;
              }
              i--;
            }else if ( this.combine && this.age % 500 == 0 ){
              this.age = Math.max(cells[i].age, this.age);
              this.offspring += cells[i].offspring;
              this.size = 2*Math.sqrt(Math.pow(this.size/2, 2)+Math.pow(cells[i].size/2, 2));
              cells.splice(i, 1);
              if ( i < currId ) {
                currId--;
              }
              i--;
            }
          }else {
            if ( this.colDist(cells[i].color) > 4096 ){
              sSmall = i;
            }
          }
        }
      }else if ( cells[i].size > this.size ) {
        if( typeof sBig === 'undefined' || this.dist(cells[i])<this.dist(cells[sBig])){
          if ( this.colDist(cells[i].color) > 4096 ){
            sBig = i;
          }
        }
      }
    }
    return [cells[sSmall], cells[sBig]];
  }

  //returns absolute distance between color values
  colDist(a){
    return Math.abs(parseInt('0x'+a.substr(1).toUpperCase())-parseInt('0x'+this.color.substr(1).toUpperCase()));
  }

  //returns distance between a cell and this cell
  dist(a){
    var posX = Math.min(Math.abs(this.x-a.x), canv.width-Math.abs(this.x-a.x));
    var posY = Math.min(Math.abs(this.y-a.y), canv.height-Math.abs(this.y-a.y));
    return Math.sqrt(Math.pow(posX,2)+Math.pow(posY,2));
 }

  //returns distance between a cell and this cell as well as the point to aim for
  compDist(a){
    var points = [[a.x, a.y], [a.x+canv.width, a.y], [a.x-canv.width, a.y], [a.x, a.y+canv.height], [a.x, a.y-canv.height]];
    var minId = 0;
    for ( var i = 0; i < points.length; i++ ){
      if ( Math.sqrt(Math.pow(this.x-points[i][0],2)+Math.pow(this.y-points[i][1],2)) < Math.sqrt(Math.pow(this.x-points[minId][0],2)+Math.pow(this.y-points[minId][1],2)) ){
        minId = i;
      }
    }
    return [Math.sqrt(Math.pow(this.x-points[minId][0],2)+Math.pow(this.y-points[minId][1],2)), points[minId][0], points[minId][1]];
  }

  //Checks whether condition is true
  isCond(comm, all){
    if ( typeof all[comm.condition[0]] === 'undefined' ){
      return false;
    }
    switch (comm.condition[1]){
      case 0:
        if (this.dist(all[comm.condition[0]]) < comm.condition[2]){
          return true;
        }else{
          return false;
        }
      case 1:
        if (this.dist(all[comm.condition[0]]) <= comm.condition[2]){
          return true;
        }else{
          return false;
        }
      case 2:
        if (this.dist(all[comm.condition[0]]) >= comm.condition[2]){
          return true;
        }else{
          return false;
        }
      case 3:
        if (this.dist(all[comm.condition[0]]) > comm.condition[2]){
          return true;
        }else{
          return false;
        }
    }
  }

  //Creates a new cell with possibility of mutation
  reproduce(){
    var fraction = randInt(100, 500)/1000; //Amount used to form child
    cells.push(newCell(this.size*Math.sqrt(fraction), this.x, this.y, this.color, this.args));
    this.size*=Math.sqrt(1-fraction);
  }

  //Cell moves according to its given rules.
  move(){
    if ( randInt(Math.min(this.size, 500), 500) >=490  && this.size>50 ){
      this.reproduce();
      this.offspring++;
    }
    var closest = this.closestCells();
    var all = {};
    all["cHole"] = this.closestHole();
    all["sSmall"] = closest[0];
    all["sBig"] = closest[1];
    all["cFood"] = this.closestFood();
    var anyPos = true;
    this.combine = false;
    for( var i = 0; i < this.args.length; i++ ) {
      var comm = this.args[i];
      if( this.isCond( comm, all ) ){
        var targ = all[comm.action[1]];
        if ( typeof targ !== 'undefined' ){
          var targDist = this.compDist(targ);
          if ( comm.action[0] == "goto" ){
            anyPos = false;
            this.x-=5*(this.x-targDist[1])/targDist[0];
            this.y-=5*(this.y-targDist[2])/targDist[0];
          }else if ( comm.action[0] == "avoid" ) {
            anyPos = false;
            this.x+=5*(this.x-targDist[1])/targDist[0];
            this.y+=5*(this.y-targDist[2])/targDist[0];
          }else if ( comm.action[0] == "combine" ) {
            this.combine = true;
          }
        }
        break;
      }
    }
    if ( anyPos ){
      var deg = randInt(1,360);
      this.x+=5*Math.sin(deg/180 * Math.PI);
      this.y+=5*Math.cos(deg/180 * Math.PI);
    }
    var millionthLost = 0.5;
    this.size-=2*Math.sqrt(Math.pow(this.size/2, 2)*(millionthLost/1000000));
    this.x = ((this.x%canv.width)+canv.width)%canv.width;
    this.y = ((this.y%canv.height)+canv.height)%canv.height;
    this.age++;
  }
}

//Class containing a rule the cell must follow
class Command {
  constructor ( condition, action ){
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
  canv.width  = window.innerWidth;
  canv.height = 0.75*window.innerHeight;
  for ( var i = 0; i < 5; i++ ){
    holes.push(new Hole(
      randInt(0, canv.width),
      randInt(0, canv.height),
      randInt(10, 50)));
  }
  for (var i = 0; i < 200; i++){
    cells.push(randomCell(randInt(1000,2000)/100));
    minWorldSize+=Math.PI*Math.pow(cells[cells.length-1].size/2, 2);
  }
  var numFood = 3000;
  minWorldSize+=Math.PI/4*numFood;
  for (var i = 0; i < numFood; i++){
    feed.push(new Food(
      randInt(0,canv.width),
      randInt(0,canv.height),
      randColor()
    ));
  }
  window.requestAnimationFrame(frame);
}

//Updates each frame
function frame() {
  var oldest = cells[0];
  var bigMama = cells[0];
  var worldSize = 0;
  context.clearRect(0, 0, canv.width, canv.height);
  for (var i = 0; i<feed.length; i++){
    context.beginPath();
    context.fillStyle = feed[i].color;
    context.strokeStyle = feed[i].color;
    context.arc(feed[i].x, feed[i].y, 0.5, 0, 2 * Math.PI, false);
    context.stroke();
    context.fill();
    feed[i].ageInc(i);
    worldSize+= Math.PI/4;
  }
  for ( currId = 0; currId<cells.length; currId++ ){
    cells[currId].move();
    if ( typeof cells[currId] !== 'undefined' ){
      if ( oldest.age < cells[currId].age ){
        oldest = cells[currId];
      }
      if ( bigMama.offspring < cells[currId].offspring ){
        bigMama = cells[currId];
      }
      context.fillStyle = cells[currId].color;
      context.strokeStyle = cells[currId].color;
      var points = [
        [cells[currId].x, cells[currId].y],
        [cells[currId].x+canv.width, cells[currId].y],
        [cells[currId].x-canv.width, cells[currId].y],
        [cells[currId].x, cells[currId].y+canv.height],
        [cells[currId].x, cells[currId].y-canv.height]]
      for ( var j = 0; j < points.length; j++ ){
        context.beginPath();
        context.arc(points[j][0], points[j][1], cells[currId].size/2, 0, 2 * Math.PI, false);
        context.stroke();
        context.fill();
      }
      worldSize+=Math.PI*Math.pow(cells[currId].size/2,2);
    }
  }
  for ( var i = 0; i < holes.length; i++ ){
    context.beginPath();
    context.fillStyle = holes[i].color;
    context.strokeStyle = holes[i].color;
    context.arc(holes[i].x, holes[i].y, holes[i].size/2, 0, 2 * Math.PI, false);
    context.stroke();
    context.fill();
    holes[i].move();
  }
  while ( worldSize < minWorldSize ){
    feed.push(new Food(
      randInt(0,canv.width),
      randInt(0,canv.height),
      randColor()
    ));
    worldSize+=Math.PI/4;

    var percentage = 1;
    if ( randInt( 1, 10000 ) <= percentage*100 || feed.length>2500 ){
      cells.push(randomCell(Math.max(10,Math.sqrt(((worldSize - feed.length*Math.PI/4)/cells.length)/Math.PI)+randInt(-10,10))));
      worldSize+=Math.PI*Math.pow(cells[cells.length-1].size/2,2);
    }
  }


  context.beginPath();
  context.arc(oldest.x, oldest.y, oldest.size/2+2.5, 0, 2 * Math.PI, false);
  context.strokeStyle = "#FFD700";
  context.lineWidth = 5;
  context.stroke();

  context.beginPath();
  context.arc(bigMama.x, bigMama.y, Math.max(bigMama.size/2-2.5,0), 0, 2 * Math.PI, false);
  context.strokeStyle = "#DC143C";
  context.stroke();
  context.lineWidth = 1;

  console.log(oldest,bigMama);

  window.requestAnimationFrame(frame);
}

//Creates a random cell with random attributes
function randomCell(size){
  return new Cell(
    size,                   //size
    randInt(0,canv.width),  //x
    randInt(0,canv.height), //y
    randColor(),            //color
    randCommands(10)        //args
  );
}

//Creates an array of num random commands
function randCommands(num){
  comms = new Array();
  for ( var i = 0; i < num; i++){
    comms.push(randCommand());
  }
  return comms;
}

//Creates commands with chance of mutation
function newCell(size, x, y, color, comms){
  newComms = new Array();
  for ( var i = 0; i < comms.length; i++ ){
    newComms.push(newCommand(comms[i]));
  }

  var percentage = 10; //Chance of change in color
  if ( randInt( 1, 10000 ) <= percentage*100 ){
    var col = '0x'+color.substr(1).toUpperCase();
    color = '#'+(parseInt(col)+randInt(-4096,4096)).toString(16)
  }


  for ( i = 0; i < randInt(0,5); i++ ){
    percentage = 0.5; //Chance of losing a command
    if ( randInt( 1, 10000 ) <= percentage*100 ){
      newComms.splice(-1,1);
    }

    var percentage = 0.5; //Chance of completely random command
    if ( randInt( 1, 10000 ) <= percentage*100 ){
      newComms.push(randCommand());
    }
  }

  return new Cell (size, x, y, color, newComms);
}

//Creates possibly mutated command
function newCommand(comm){
  var actions = ["avoid", "goto"];
  var subjects = ["sBig", "sSmall", "cFood"];

  var percentage = 1; //Chance of change in subject
  var condition = comm.condition;
  if ( randInt( 1, 10000 ) <= percentage*100 ){
    condition[0] = randVal(subjects);
  }

  percentage = 1; //Chance of change in comparison (<,<=,>=,>)
  if ( randInt( 1, 10000 ) <= percentage*100 ){
    condition[1] = randInt(0,3);
  }

  percentage = 20; //Chance of slight change in distance
  if ( randInt( 1, 10000 ) <= percentage*100 ){
    condition[2] += randInt(-15,15);
    condition[2] = Math.min(canv.width, Math.max(0, condition[2]));
  }

  percentage = 1; //Chance of completely random distance
  if ( randInt( 1, 10000 ) <= percentage*100 ){
    condition[2] += randInt(0, 200);
  }

  var action = comm.action;

  percentage = 2; //Chance of change in action
  if ( randInt( 1, 10000 ) <= percentage*100 ){
    action[0] = randVal(actions);
  }


  percentage = 1; //Chance of change in target
  if ( randInt( 1, 10000 ) <= percentage*100 ){
    action[1] = randVal(subjects);
  }


  return new Command(condition, action);
}

//Creates a random command
function randCommand(){
  var actions = ["combine", "avoid", "goto"];
  var subjects = ["sBig", "sSmall", "cFood", "cHole"];

  var condition = [randVal(subjects),randInt(0,3),randInt(0, 100)];
  var  action = [randVal(actions),randVal(subjects)];

  return new Command(condition, action);
}

//Returns a random hex color
function randColor() {
  return '#'+(Math.random()*0xFFFFFF<<0).toString(16)
}

//Returns a random int between min and max, inclusive.
function randInt(min, max) {
  return Math.floor(Math.random() * (max-min+1))+min;
}

//Returns a random value in an array
function randVal(a){
  return a[randInt(0, a.length-1)];
}
