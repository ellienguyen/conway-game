/**
 * Created by admin on 3/28/17.
 */

function Vector (x , y) {
    this.x = x;
    this.y = y;
}

Vector.prototype.plus = function (position) {
    return new Vector(this.x + position.x, this.y + position.y);
};

var neighbors = [];
for (var i = -1; i <= 1; i++) {
    for (var j = -1; j <= 1; j++) {
        if (i != 0 || j != 0) {
            var vector = new Vector(i,j);
            neighbors.push(vector);
        }
    }
}

function findNeighbors(vector, width, height) {
    var result = [];
    neighbors.forEach(function (element) {
        var neighbor = vector.plus(element);
        if (neighbor.x >= 0 && neighbor.y >= 0 && neighbor.x < width && neighbor.y < height) {
            result.push(neighbor);
        }
    });
    return result;
};

function Cell(vector) {
    this.position = vector;
    this.state = false;
}

function Grid(width, height) {
    this.data = [];
    for (var i = 0; i < width; i++) {
        var column = [];
        for (var j = 0; j < height; j++) {
            var newCell = new Cell(new Vector(i, j));
            newCell.neighbor = findNeighbors(new Vector(i, j), width, height);
            column.push(newCell);
        }
        this.data.push(column);
    }
    this.liveCells = [];
}

Grid.prototype.getState = function (x, y) {
    if (this.data[x][y]) {
        return this.data[x][y].state;
    } else {
        return undefined;
    }

};

Grid.prototype.changeState = function (x, y, value) {
    if (arguments[3]) {
        this.data[x][y].state = value;
    } else {
        this.data[x][y].state = !this.data[x][y].state;
    }
    return this.data[x][y].state;

};

Grid.prototype.futureState = function (cell, x, y) {
    var liveNeighbor = 0;
    cell.neighbor.forEach(function (neighbor) {
        if (this.getState(neighbor.x, neighbor.y)) {
            liveNeighbor++;
        }
    }, this);
    if (cell.state) {
        if (liveNeighbor < 2 || liveNeighbor > 3) {
            return false;
        }
    } else {
        if (liveNeighbor == 3) {
            return true;
        }
    }
};

function World(cvWidth, cvHeight, unit) {
    this.dataWidth = Math.ceil(cvWidth / unit);
    this.dataHeight = Math.ceil(cvHeight / unit);
    this.grid = new Grid(this.dataWidth, this.dataHeight);
    this.cellToChange = [];
    this.generation = 0;
}

World.prototype.makeStep = function () {
    var cellToChange = [];
    this.grid.data.forEach(function (column, xIndex) {
        column.forEach(function (cell, yIndex) {
            var future = this.futureState(cell, xIndex, yIndex);
            if (future != undefined) {
                cellToChange.push([xIndex, yIndex, future]);
            }
        }, this);
    }, this.grid);
    cellToChange.forEach(function (demand) {
        this.grid.changeState(demand[0], demand[1], demand[2]);
    }, this);
    this.cellToChange = cellToChange;
    this.generation++;
};

World.prototype.redraw = function () {
    this.cellToChange.forEach(function (demand) {
        if (demand[2]) {
            toggleFillStyle(demand[0] * unit, demand[1] * unit, liveColor);
        } else {
            toggleFillStyle(demand[0] * unit, demand[1] * unit, backgroundColor);
        }
    });
};




var canvas = document.querySelector("canvas");
var cx = canvas.getContext("2d");
var cvWidth;
var cvHeight;
var unit = 10;
var backgroundColor = "#F2F2F2";
var liveColor = "orange";
var gridColor = "white";
var world;
var patternType = {};
//resize the canvas properly
window.addEventListener("load", function () {
    var canvasWrapper = document.getElementsByClassName("canvas-wrapper");
    var canvas = document.getElementsByTagName("canvas");
    canvas[0].setAttribute("width", String(canvasWrapper[0].clientWidth));
    canvas[0].setAttribute("height", String(canvasWrapper[0].clientHeight));
    cvWidth = canvasWrapper[0].clientWidth;
    cvHeight = canvasWrapper[0].clientHeight;
    world = new World(cvWidth, cvHeight, unit);
    resetBackground(cvWidth,cvHeight,backgroundColor);
    drawGrid(cvWidth,cvHeight,unit,gridColor);
    patternType.startX = Math.round(world.dataWidth / 3);
    patternType.startY = Math.round(world.dataHeight / 3);
});

canvas.addEventListener("click", function (event) {
    var xIndex = (Math.floor(event.offsetX / unit));
    var yIndex = (Math.floor(event.offsetY / unit));
    var cellState = world.grid.changeState(xIndex, yIndex);
    world.cellToChange = [[xIndex, yIndex, cellState]];
    world.redraw();
});

var stepButton = document.getElementById("step-forward");
stepButton.addEventListener("click", function () {
    step();
});

var playButton = document.getElementById("play");
playButton.addEventListener("click", function () {
    run();
    playButton.className += " active";
});

var pauseButton = document.getElementById("pause");
function pause() {
    stop();
    pauseButton.className += " active";
}
pauseButton.addEventListener("mousedown", pause);
pauseButton.addEventListener("touchstart", pause);
pauseButton.addEventListener("mouseup", pause);

pauseButton.addEventListener("click", pause);
var refreshButton = document.getElementById("refresh");
refreshButton.addEventListener("click", clear);

patternType.glider = function () {
    return [[this.startX + 1, this.startY], [this.startX + 2, this.startY + 1], [this.startX, this.startY + 2],
        [this.startX + 1, this.startY + 2],
        [this.startX + 2, this.startY + 2]];
};

patternType.gun = function () {
    return [[4,16],[4,17],[5,16],[5,17],[12,17],[12,18],[13,16],[13,18],[14,16],[14,17],[20,18],[20,19],[20,20],[21,18],[22,19],[26,15],[26,16],[27,14],[27,16],[28,14],[28,15],[28,26],[28,27],[29,26],[29,28],[30,26],[38,14],[38,15],[39,14],[39,15],[39,21],[39,22],[39,23],[40,21],[41,22]];
};

patternType.spaceship = function () {
    var result = [];
    for (var i = 1; i <= 4; i++) {
        result.push([this.startX + i, this.startY]);
    }
    result.push([this.startX, this.startY + 1]);
    result.push([this.startX, this.startY + 3]);
    result.push([this.startX + 4, this.startY + 1]);
    result.push([this.startX + 4, this.startY + 2]);
    result.push([this.startX + 3, this.startY + 3]);
    return result;
};

patternType.row = function () {
    var result = [];
    for (var i = 1; i <= 10; i++) {
        result.push([this.startX + i, this.startY]);
    }
    return result;
};

patternType.pulsar = function () {
    return [[10,32],[10,33],[10,34],[10,38],[10,39],[10,40],[12,30],[12,35],[12,37],[12,42],[13,30],[13,35],[13,37],[13,42],[14,30],[14,35],[14,37],[14,42],[15,32],[15,33],[15,34],[15,38],[15,39],[15,40],[17,32],[17,33],[17,34],[17,38],[17,39],[17,40],[18,30],[18,35],[18,37],[18,42],[19,30],[19,35],[19,37],[19,42],[20,30],[20,35],[20,37],[20,42],[22,32],[22,33],[22,34],[22,38],[22,39],[22,40]];
};

patternType.random = function () {
    var result = [];
    for (var i = 0; i < world.dataWidth; i++) {
        for (var j = 0; j < world.dataHeight; j++) {
            if (Math.random() < 0.2) {
                result.push([i, j]);
            }
        }
    }
    return result;
};

patternType.none = function () {
    return [];
};

function addNewPattern() {
    var result = [];
    world.grid.data.forEach(function (column, xIndex) {
        column.forEach(function (cell, yIndex) {
            if (cell.state) {
                result.push([xIndex, yIndex]);
            }
        });
    });
    return result;
};

function updateInfo() {
    var genInfo = document.getElementById("generation");
    var liveInfo = document.getElementById("live-cells");
    var newLiveInfo = document.createTextNode("Live cells: "+ addNewPattern().length);
    liveInfo.replaceChild(newLiveInfo, liveInfo.childNodes[0]);
    var newGenInfo = document.createTextNode("Generation: "+ world.generation);
    genInfo.replaceChild(newGenInfo, genInfo.childNodes[0]);
}

var patternForm = document.getElementById("pattern-select");
patternForm.onchange = function (event) {
    if (event.target.value) {
        setNewPattern(patternType[event.target.value]());
        updateInfo();
    }
};

var speedSlider = document.getElementById("speed");
speedSlider.onchange = function () {
    fps = speedSlider.value;
};

// var addBtn = document.getElementById("add-new");
// addBtn.addEventListener("click", function () {
//     console.log(addNewPattern().toString());
// });

function setNewPattern(array) {
    world = new World(cvWidth, cvHeight, unit);
    clear();
    stop();
    world.cellToChange = [];
    array.forEach(function (cell) {
        world.grid.changeState(cell[0], cell[1], true);
        world.cellToChange.push([cell[0], cell[1], true]);
    });
    world.redraw();
}

function toggleFillStyle(x, y, color) {
    cx.fillStyle = color;
    cx.fillRect(x + 1, y + 1, unit - 2, unit - 2);
}

function drawGrid(cvWidth, cvHeight, unit, color) {
    cx.beginPath();
    cx.lineWidth = 1;
    cx.strokeStyle = color;
    for (var i = 0; i <= cvWidth; i+= unit) {
        cx.moveTo(i, 0);
        cx.lineTo(i, cvHeight);
        cx.stroke();
    }
    for (var j = 0; j <= cvHeight; j+= unit) {
        cx.moveTo(0, j);
        cx.lineTo(cvWidth, j);
        cx.stroke();
    }
}

function resetBackground(cvWidth, cvHeight, color) {
    cx.fillStyle = color;
    cx.fillRect(0,0,cvWidth,cvHeight);
}

var myTimeout;
var myRequest;
var fps = speedSlider.defaultValue;
function run() {
    myTimeout = setTimeout(function() {
        myRequest = requestAnimationFrame(run);
        step();
        // Drawing code goes here
    }, 1000 / fps);
};

function stop() {
    clearTimeout(myTimeout);
    cancelAnimationFrame(myRequest);
}

function step() {
    world.makeStep();
    world.redraw();
    updateInfo();
}

function clear() {
    world = new World(cvWidth, cvHeight, unit);
    resetBackground(cvWidth, cvHeight, backgroundColor);
    drawGrid(cvWidth, cvHeight, unit, gridColor);
};

if (window.innerWidth < 991) {
    var verticalGroup = document.getElementsByClassName("btn-group-vertical")[0];
    verticalGroup.className = "btn-group";
    var card = document.getElementsByClassName("card")[0];
    var select = document.getElementsByTagName("select")[0];
    verticalGroup.appendChild(select);
    select.parentNode.removeChild(select);
}






