/**
 * @Author: Edmund Lam <edl>
 * @Date:   16:42:00, 13-Feb-2018
 * @Filename: sim.js
 * @Last modified by:   edl
 * @Last modified time: 17:13:22, 13-Feb-2018
 */

//Array of all existing cells
var cells = new Array();

function init() {
  cells.push(new Cell())
}

//Updates each frame
function frame() {

}



//Cell Class, contains all attributes for cell as well as how cell should move each frame.
class Cell {
  /**
   * Variable Descriptions
   * health is how healthy this cell is.
   * lifespan is the length of this cell's life.
   * reproAge is minimum age for reproduction
   * speed is maximum speed of Cell
   * size is the size of the Cell
   * sight is how far a Cell can see
   * (x,y) is the location of the Cell
   */
  var health = 100; //100 is perfectly healthy
  var lifespan, reproAge, speed, size, sight;
  var x,y;
  constructor(lifespan, reproAge, speed, size, sight, x, y){
    this.lifespan = lifespan;
    this.reproAge = reproAge;
    this.speed = speed;
    this.size = size;
    this.sight = sight;
    this.x = x;
    this.y = y;
  }

  //Cell moves toward nearest small cells and away from larger ones.
  function move(){
    for (var i = 0; i < cells.len; i++){
      cells.sort(compare(a,b));
    }
  }

  //Used to sort cellList by distance from this Cell
  function compare(a, b){
    return dist(a)-dist(b);
  }
  //returns distance between a cell and this cell
  function dist(a){
    return Math.sqrt(Math.pow(this.x-a.x, 2)+Math.pow(this.y-a.y, 2));
  }
}
