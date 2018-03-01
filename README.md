
# Cell Evolution

Programmed cells follow rules and evolve

![Cell Evolution](/Screenshots/0.png)

## How it works

### Element
The superclass of all elements on screen, named `class Element`
#### Attributes
* `this.age` is the age of the element, or the number of frames it has been onscreen.
* `this.x` and `this.y` designate the position of an element on screen, where `(0,0)` is the top left of the canvas.
* `this.size` is the diameter of the object, in pixels.
* `this.color` is the color value of the object in`hex`, stored as a `String`.
#### Methods
None

----------

### Commands
A class containing a single command used by a `Cell` instance
#### Attributes
* `this.condition` specifies an array with 3 values, in the form `distanceTo(subject) (comparison) (value)`.
* `this.action` is the action to be taken when `this.condition` is `true`.

----------


### Cells
The main element of the simulation; this is what evolves.

#### Attributes
* `class Cell` is a subclass of 	`Element`, and inherits its attributes.
* `this.args` is a list of the `Command` instances that this cell follows.
* `this.defComm` is the default `Command` to follow if none of the conditions in `this.args` are fulfilled.
* `this.fraction` is the percentage of mass baby takes when reproducing.
#### Methods
* Method `move()` calls all the necessary methods each frame.
* Methods beginning with `closest` are used to find the subjects for a `Command` instance.
* Methods `eatCells()` and `eatFood()` are used to consume nearby smaller cells and food
* Method `reproduce()` is used when the cell wants to reproduce, creating a new cell with a possibility of mutation in commands.
* `dist()` and `compDist()` are used to find the distance between two cells. `compDist` also returns the target position.

----------

### Food
Eaten by the cell. This spawns randomly, but is also created around instances of `Spawner` and underneath large `Cell` objects.

#### Attributes
`class Food` is a subclass of 	`Element`, and inherits its attributes.
#### Methods
None

----------

### Spawners
Spawners create food around them when a smaller cell is eaten by it.

#### Attributes
* `class Spawner` is a subclass of 	`Element`, and inherits its attributes.
* `this.id` is the id of the spawner.
* `this.defaultSize` is the initiation size of the spawner.
#### Methods
The only method, `this.act()`, does three main things:
* Eat nearby `Cells` that are small
* Eat `Food`
* Expel `Food` outside if `this.size	` is greater than `this.defaultSize`

----------

### Hiding spots

Force larger cells to split (`reproduce()`) while allowing smaller cells to hide.

#### Attributes
`class Petri` is a subclass of 	`Element`, and inherits its attributes.
#### Methods
`splitCells()` splits larger cells within range.
