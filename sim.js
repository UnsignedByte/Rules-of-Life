/**
 * @Author: Edmund Lam <edl>
 * @Date:   16:42:00, 13-Feb-2018
 * @Filename: sim.js
 * @Last modified by:   edl
 * @Last modified time: 19:44:55, 24-Feb-2018
 */

//the canvas
var canv = document.getElementById('world');
var context = canv.getContext("2d");
console.log("mrnabas");
//Array of all existing cells
var feed = new Array();
var cells = new Array();


//Superclass for all elements on screen, contains a position
class Element {
  constructor(x, y, color){
    this.x=x;
    this.y=y;
    this.color = color;
  }
}


class Food extends Element {
  constructor(x, y, color){
    super(x, y, color);
    this.size = size;
  }
}


//Cell Class, contains all attributes for cell as well as how cell should move each frame.
class Cell extends Element {
  /**
   * Variable Descriptions
   * id is the id of the cell in cells
   * health is how healthy this cell is.
   * metabolism is how fast the cell loses health;
   * lifespan is the length of this cell's life.
   * reproSize is minimum size for mitosis
   * speed is multiplier for the speed of the cell; Real speed determined by size
   * size is the size of the Cell
   */
  constructor(size, x, y, color, args){
    super(x, y, color);
    this.health = 1000;
    this.size = size;
    this.args = args;
  }

  //gets the closest food and eats food that is within it's grasp
  closestFood(){
    var eatable = new Array();
    var cFood;
    for ( var i = 0; i < feed.length; i++ ){
      //Eats food that can be eaten and finds closest non-eatable food.
      if ( this.dist(feed[i])<=this.size ){
        this.health+=feed[i].size;
        eatable.push(i);
      }else if ( this.dist( feed[i] < this.dist( cFood ))) {
        cFood = i;
      }
    }

    //Removes eaten food
    for ( var i = 0; i < eatable.length; i++ ){
      if ( eatable[i]>-1 ){
        feed.splice(eatable[i], 1);
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
          sSmall = i;
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

  //Cell moves according to its given rules.
  move(){
    var closest = this.closestCells();
    var all = {};
    all["sSmall"] = closest[0];
    all["sBig"] = closest[1];
    all["cFood"] = this.closestFood();
    for( var i = 0; i < this.args.length; i++ ) {
      var comm = this.args[i];
      if( this.isCond( comm, all ) ){
        var acts = comm.actions;
        for ( var j = 0; j < acts.length; j++ ){
          var targ = all[acts[j][1]];
          if ( typeof targ !== 'undefined' ){
            if ( acts[j][0] == "goto" ){
              this.x-=(this.x-targ.x)/this.dist(targ);
              this.y-=(this.y-targ.y)/this.dist(targ);
            }else if ( acts[j][0] == "avoid" ) {
              this.x+=(this.x-targ.x)/this.dist(targ);
              this.y+=(this.y-targ.y)/this.dist(targ);
            }
          }
        }
      }
    }
  }
}

//Class containing a rule the cell must follow
class Command {
  constructor ( condition, actions ){
    this.condition = condition;
    this.actions = actions;
  }
}







init();

function init() {
  canv.width  = window.innerWidth;
  canv.height = window.innerHeight;
  for (var i = 0; i < 1000; i++){
    cells.push(randomCell());
  }
  window.requestAnimationFrame(frame);
}

//Updates each frame
function frame() {
  for (var i = 0; i<cells.length; i++){
    context.beginPath();
    context.arc(cells[i].x, cells[i].y, cells[i].size/2, 0, 2 * Math.PI, false);
    context.fillStyle = cells[i].color;
    context.strokeStyle = cells[i].color;
    context.stroke();
    context.fill();
    cells[i].move();
  }
  for (var i = 0; i<feed.length; i++){
    context.beginPath();
    context.arc(feed[i].x, feed[i].y, 0.5, 0, 2 * Math.PI, false);
    context.fillStyle = '#003300';
    context.strokeStyle = '#003300';
    context.stroke();
    context.fill();
  }
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
    randColor(),            //color of trail
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

//Creates a random command
function randCommand(){
  var actions = ["avoid", "goto"];
  var subjects = ["sBig", "sSmall", "cFood"];

  var condition = [randVal(subjects),randInt(0,3),randInt(0, 100)];
  var action = new Array(randInt(1,5));
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
