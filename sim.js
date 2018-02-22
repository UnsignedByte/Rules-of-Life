/**
 * @Author: Edmund Lam <edl>
 * @Date:   16:42:00, 13-Feb-2018
 * @Filename: sim.js
 * @Last modified by:   edl
 * @Last modified time: 16:56:07, 21-Feb-2018
 */

//the canvas
var canv = document.getElementById('world');
var context = canv.getContext("2d");
//Array of all existing cells


//Superclass for all elements on screen, contains a position
class Element {
  constructor(x, y){
    this.x=x;
    this.y=y;
  }
}


class Food extends Element {
  constructor(x, y){
    super(x, y, size);
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
  constructor(metabolism, reproSize, speed, size, sight, x, y, args){
    super(x, y);
    this.id = cells.length;
    this.health = 1000;
    this.metabolism = metabolism;
    this.reproSize = reproSize;
    this.speed = speed;
    this.size = 10;
    this.args = args;
  }

  //Cell moves according to its given rules.
  move(){
    var closest = this.closestCells();
    var sSmall = closest[0];
    var sBig = closest[1];
    var cFood = this.closestFood();
  }

  //gets the closest food and eats food that is within it's grasp
  closestFood(){
    var eatable = new Array();
    var cFood;
    for ( var i = 0; i < feed.length; i++ ){
      //Eats food that can be eaten and finds closest non-eatable food.
      if ( dist(feed[i])<=this.size ){
        this.health+=feed[i].size;
        eatable.push(i);
      }else if ( dist( feed[i] < dist( cFood ))) {
        cFood = i;
      }
    }

    //Removes eaten food
    for ( var i = 0; i < eatable.length; i++ ){
      if ( eatable[i]>-1 ){
        feed.splice(eatable[i], 1);
      }
    }
    return cFood;
  }

  //gets the closest bigger cell and smaller cell
  closestCells(){
    var sBig, sSmall;
    for ( var i = 0; i < cells.length; i++ ){
      if ( this.id = cells[i].id ){
        continue;
      }else if ( cells[i].size < this.size && dist(cells[i])<dist(cells[sSmall]) ) {
        sSmall = i;
      }else if ( cells[i].size > this.size && dist(cells[i])<dist(cells[sBig]) ) {
        sBig = i;
      }
    }
    return [sSmall, sBig];
  }

  //Used to calculate movement speed
  getSpeed(){
    return (1/this.size)*this.speed;
  }

  //Used to sort cellList by distance from this Cell
  compare(a, b){
    return this.dist(a)-this.dist(b);
  }
  //returns distance between a cell and this cell
  dist(a){
    return Math.sqrt(Math.pow(this.x-a.x, 2)+Math.pow(this.y-a.y, 2));
  }
}

//Class containing a rule the cell must follow
class Command {
  constructor ( condition, actions ){
    this.condition = condition;
    this.actions = actions;
  }
}








var feed = new Array();
var cells = new Array();
init();

function init() {
  canv.width  = window.innerWidth;
  canv.height = window.innerHeight;
  for (var i = 0; i < 100; i++){
    cells.push(randomCell());
  }
  window.requestAnimationFrame(frame);
}

//Updates each frame
function frame() {
  for (var i = 0; i<cells.length; i++){
    context.beginPath();
    context.arc(cells[i].x, cells[i].y, cells[i].size/2, 0, 2 * Math.PI, false);
    context.fillStyle = '#003300';
    context.strokeStyle = '#003300';
    context.stroke();
    context.fill();
    cells[i].id = i;
    cells[i].move();
  }
  for (var i = 0; i<feed.length; i++){
    context.beginPath();
    context.arc(cells[i].x, cells[i].y, cells[i].size/2, 0, 2 * Math.PI, false);
    context.fillStyle = '#003300';
    context.strokeStyle = '#003300';
    context.stroke();
    context.fill();
    cells[i].move();
  }
  window.requestAnimationFrame(frame);
}

//Creates a random cell with random attributes
function randomCell(){
  return new Cell(
    randInt(1,10)/10,       //metabolism
    randInt(50,500),        //reproSize
    randInt(1,10),          //speed
    randInt(10,15),         //size
    randInt(0,25),          //sight
    randInt(0,canv.width),  //x
    randInt(0,canv.height), //y
    randCommands(10)        //args
  );
}

//Returns a random int between min and max, inclusive.
function randInt(min, max) {
  return Math.floor(Math.random() * (max-min)+1)+min;
}
