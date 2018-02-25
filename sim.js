/**
 * @Author: Edmund Lam <edl>
 * @Date:   16:42:00, 13-Feb-2018
 * @Filename: sim.js
 * @Last modified by:   edl
 * @Last modified time: 07:57:13, 25-Feb-2018
 */

//the canvas
var canv = document.getElementById('world');
var context = canv.getContext("2d");
//Array of all existing cells
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
  }

  //gets the closest food and eats food that is within it's grasp
  closestFood(){
    var eatable = new Array();
    var cFood = 0;
    for ( var i = 0; i < feed.length; i++ ){
      //Eats food that can be eaten and finds closest non-eatable food.
      if ( this.dist(feed[i])<=this.size ){
        this.size+=0.1;
        feed.splice(i, 1);
        i--;
        feed.push(new Food(
          randInt(0,canv.width),
          randInt(0,canv.height),
          randColor()
        ));
      }else if ( this.dist( feed[i] < this.dist( cFood ))) {
        cFood = i;
      }
    }
    return feed[cFood];
  }

  //gets the closest bigger cell and smaller cell
  closestCells(){
    var sBig, sSmall;
    //console.log(cells);
    for ( var i = 0; i < cells.length; i++ ){
      if ( this.dist(cells[i]) == 0 ){
        continue;
      }else if ( cells[i].size < this.size ) {
        if( typeof sSmall === 'undefined' || this.dist(cells[i])<this.dist(cells[sSmall])){
          if ( this.dist(cells[i]) <= this.size/2 ) {
            this.size = 2*Math.sqrt(Math.pow(this.size/2, 2)+Math.pow(cells[i].size/2, 2));
            cells.splice(i, 1);
            if ( i < currId ) {
              currId--;
            }
            i--;
          }else {
            sSmall = i;
          }
        }
      }else if ( cells[i].size > this.size ) {
        if( typeof sBig === 'undefined' || this.dist(cells[i])<this.dist(cells[sBig])){
          sBig = i;
        }
      }
    }
    return [cells[sSmall], cells[sBig]];
  }

  //Used to calculate movement speed
  speed(){
    return (1/this.size)*this.speed;
  }

  //returns distance between a cell and this cell
  dist(a){
    return Math.sqrt(Math.pow(this.x-a.x, 2)+Math.pow(this.y-a.y, 2));
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
    cells.push(newCell(this.size, this.color, this.args));
  }

  //Cell moves according to its given rules.
  move(){
    if ( this.size > 20 ){
      this.size = Math.sqrt(Math.pow(this.size, 2)/2);
      this.reproduce();
    }
    var closest = this.closestCells();
    var all = {};
    all["sSmall"] = closest[0];
    all["sBig"] = closest[1];
    all["cFood"] = this.closestFood();
    var anyPos = true;
    var changeX = this.x;
    var changeY = this.y;
    for( var i = 0; i < this.args.length; i++ ) {
      var comm = this.args[i];
      if( this.isCond( comm, all ) ){
        anyPos = false;
        var acts = comm.actions;
        for ( var j = 0; j < acts.length; j++ ){
          var targ = all[acts[j][1]];
          if ( typeof targ !== 'undefined' ){
            if ( acts[j][0] == "goto" ){
              changeX-=(this.x-targ.x)/this.dist(targ);
              changeY-=(this.y-targ.y)/this.dist(targ);
            }else if ( acts[j][0] == "avoid" ) {
              changeX+=(this.x-targ.x)/this.dist(targ);
              changeY+=(this.y-targ.y)/this.dist(targ);
            }
          }
        }
      }
    }
    if ( anyPos ){
      var deg = randInt(1,360);
      this.x+=Math.sin(deg/180 * Math.PI);
      this.y+=Math.cos(deg/180 * Math.PI);
    }else{
      this.x-=5*(this.x-changeX)/Math.sqrt(Math.pow(this.x-changeX, 2)+Math.pow(this.y-changeY, 2));
      this.y-=5*(this.y-changeY)/Math.sqrt(Math.pow(this.x-changeX, 2)+Math.pow(this.y-changeY, 2));
    }
    this.size-=0.025;
    if ( isNaN(this.x) || isNaN(this.y) ){
      this.reproduce();
      cells.splice(currId, 1);
      currId--;
    }
    if ( this.size <= 0 || isNaN(this.x) || isNaN(this.y) ){
      cells.splice(currId, 1);
      currId--;
    }
    this.age++;
  }
}

//Class containing a rule the cell must follow
class Command {
  constructor ( condition, actions ){
    this.condition = condition;
    this.actions = actions;
  }
}





//END OF CLASS DEFENITIONS












//START OF PROGRAM




var currId = 0;

init();

function init() {
  canv.width  = window.innerWidth;
  canv.height = window.innerHeight;
  for (var i = 0; i < 100; i++){
    cells.push(randomCell());
  }
  for (var i = 0; i < 2000; i++){
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
  changeOldest = false;
  for (var i = 0; i<feed.length; i++){
    context.beginPath();
    context.arc(feed[i].x, feed[i].y, 0.5, 0, 2 * Math.PI, false);
    context.fillStyle = '#003300';
    context.strokeStyle = '#003300';
    context.stroke();
    context.fill();
    feed[i].ageInc(i);
  }
  var oldest = cells[0];
  for ( currId = 0; currId<cells.length; currId++ ){
    if ( oldest.age+1 == cells[currId].age ){
      oldest = cells[currId];
    }else if ( oldest.age < cells[currId].age ){
      oldest = cells[currId];
      changeOldest = true;
    }
    cells[currId].move();
    context.beginPath();
    context.arc(cells[currId].x, cells[currId].y, cells[currId].size/2, 0, 2 * Math.PI, false);
    context.fillStyle = cells[currId].color;
    context.strokeStyle = cells[currId].color;
    context.stroke();
    context.fill();
  }
  if (true){
    //console.log(oldest);
  }
  //context.clearRect(0, 0, canv.width, canv.height);
  context.fillStyle = '#8E8E8D';
  context.globalAlpha = 0.025;
  context.fillRect(0,0,canv.width,canv.height);
  context.globalAlpha = 1.0;
  window.requestAnimationFrame(frame);
}

//Creates a random cell with random attributes
function randomCell(){
  return new Cell(
    randInt(1000,1500)/100, //size
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
function newCell(size, color, comms){
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

  return new Cell (size, randInt(0, canv.width), randInt(0, canv.height), color, newComms);
}

//Creates possibly mutated command
function newCommand(comm){
  var action = ["avoid", "goto"];
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

  var actions = comm.actions;
  for ( var i = 0; i < actions.length; i++ ){

    percentage = 2; //Chance of change in action
    if ( randInt( 1, 10000 ) <= percentage*100 ){
      actions[i][0] = randVal(action);
    }


    percentage = 1; //Chance of change in target
    if ( randInt( 1, 10000 ) <= percentage*100 ){
      actions[i][1] = randVal(subjects);
    }

    percentage = 0.5; //Chance of change in target
    for ( var j = 0; j < 5; j++ ){
      if ( randInt( 1, 10000 ) <= percentage*100 ){
        actions.splice(-1,1);
      }
        if ( randInt( 1, 10000 ) <= percentage*100 || actions.length == 0 ){
          actions.push([randVal(action), randVal(subjects)]);
        }
    }

  }

  return new Command(condition, actions);
}

//Creates a random command
function randCommand(){
  var actions = ["avoid", "goto"];
  var subjects = ["sBig", "sSmall", "cFood"];

  var condition = [randVal(subjects),randInt(0,3),randInt(0, 100)];
  var action = new Array(randInt(1,3));
  for( var i = 0; i < action.length; i++){
    action[i] = [randVal(actions),randVal(subjects)];
  }

  return new Command(condition, action);
}

//Returns a random hex color
function randColor() {
  return '#'+(Math.random()*0xFFFFFF<<0).toString(16)
}

//Returns a random int between min and max, inclusive.
function randInt(min, max) {
  return Math.floor(Math.random() * (max-min)+1)+min;
}

//Returns a random value in an array
function randVal(a){
  return a[randInt(0, a.length-1)];
}
