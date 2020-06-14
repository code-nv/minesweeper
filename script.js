app = {};
app.grid = [];
app.hidden = [];
app.mines = [];
app.warnings = [];
app.adjacentMoveTiles = [];
app.flagState = false;
app.flagCounter = 0;
app.gameTime = 0;
app.gameTimeHolder = document.querySelector(".time.number");

// start game timer
const gameTimer = () => {
	app.gameTime++;
	app.gameTimeHolder.innerHTML = app.gameTime;
};

let startTimer = setInterval(gameTimer, 1000);

// creates board given difficulty or dimensions
app.createGrid = (width = 0, height = 0) => {
	app.grid.width = width;
	app.grid.height = height;
	app.grid.tileWidth = 100 / width;
	app.grid.tileHeight = 100 / height;
	const totalTiles = width * height;
	xPos = 0;
	yPos = 0;
	for (let i = 0; i < totalTiles; i++) {
		app.grid[i] = {
			pos: [xPos, yPos],
			state: "hidden",
			adjacentMines: 0,
			mine: false,
			flag: false,
			warning: false,
			revealed: false,
			done: false,
		};
		xPos++;
		if (xPos == width) {
			xPos = 0;
			yPos++;
		}
		app.hidden.push(app.grid[i]);
	}
	// console.log(app.grid);
};

// random number generator
app.rng = (max) => {
	return Math.floor(Math.random() * max);
};

// give random squares a mine value
app.placeMines = (mines, counter) => {
	const makeMine = app.grid[app.rng(app.grid.length)];
	// accounting for rng giving doubles
	if (makeMine.mine) {
		app.placeMines(mines, counter);
	} else {
		makeMine.mine = true;
		app.mines.push(makeMine);
		counter++;
		counter < mines
			? app.placeMines(mines, counter)
			: ((document.querySelector(".mine.number").innerHTML = mines), app.checkAdjacent(app.mines, "placing"));
	}
};

// useful for finding adjacent tiles
app.difference = (a, b, c) => {
	return Math.abs(a[c] - b[c]);
};

// occurs on click of a tile in game board
// reveals this tile and looks at adjacent tiles,
// puts all these tiles in an array for later
// recursively executes itself with the above array if those tiles are not a mine or neighbouring a mine
app.makeMove = (current) => {
	const adjacentTiles = [...current];
	adjacentTiles.forEach((tile) => {
		// check position
		tilePos = tile.pos.toString();
		// give revealed property
		tile.revealed = true;
		// target tile
		const change = document.querySelectorAll(`[data-position="${tilePos}"]`);
		// reveal tile clicked
		change[0].classList.add("revealed");
		change[0].classList.remove("hidden");
		change[0].setAttribute('disabled',true)
		// looks at adjacent
		if (tile.warning) {
			change[0].innerHTML = tile.adjacentMines;
		}
	});
	app.checkAdjacent(current, "playing");
};

// when purpose is 'placing' this function tells tiles neighbouring mines that they're neighbouring mines, and gives them the number of mines.
// when playing, it will execute different tile states based on that tile's attributes
app.checkAdjacent = (current, purpose = "playing") => {
	// empty array because it will be filled with adjacent tiles of this adjacent tile
	app.adjacentMoveTiles = [];
	current.forEach((mine) => {
		const subMine = mine;
		app.grid.forEach((tile) => {
			// ensuring only looking at adjacent tiles
			const tilePosition = tile.pos.toString();
			const change = document.querySelectorAll(`[data-position="${tilePosition}"]`);
			const xDiff = app.difference(tile.pos, subMine.pos, 0);
			const yDiff = app.difference(tile.pos, subMine.pos, 1);

			if (xDiff < 2 && yDiff < 2) {
				purpose == "placing" ? tile.adjacentMines++ : null;
				if (!tile.mine && !tile.warning && purpose == "placing") {
					tile.warning = true;
					app.warnings.push(tile);
				}
				// double checking that the tile hasn't reached its endstate
				if (!tile.revealed) {
					// reveal adjacent warnings
					if (purpose == "playing" && [...change[0].classList].includes("flagged")) {
						return;
					} else if (purpose == "playing" && tile.warning) {
						tile.revealed = true;
						change[0].classList.add("revealed");
						change[0].classList.remove("hidden");
						change[0].innerHTML = tile.adjacentMines;
						change[0].setAttribute('disabled',true)
						// warnings do not trigger neighbouring warnings
					}
					// reveal if empty
					if (purpose == "playing" && !tile.mine && !tile.warning) {
						tile.revealed = true;
						change[0].classList.add("revealed");
						change[0].classList.remove("hidden");
						app.adjacentMoveTiles.push(tile);
						change[0].setAttribute('disabled',true)
						// empty tiles trigger neighbouring tiles
						app.makeMove(app.adjacentMoveTiles);
					}
				} else {
					return;
				}
			}
		});
	});
};

// display minefield
app.visualizeGrid = () => {
	const minefield = document.querySelector(".mineField");
	app.grid.forEach((tile) => {
		const htmlToAppend = `<li class="tileContainer"><button class="tile hidden" data-position="${tile.pos}" > ${tile.mine ? "" : ""}</button></li>`;
		minefield.innerHTML += htmlToAppend;
	});
	// getting 
	// const tileWidth = document.querySelector('.tileContainer').clientWidth;
	// minefield.style.width = `${app.grid.width * tileWidth}px`;
	// minefield.style.height = `${app.grid.height * tileWidth}px`;
	// const gameTiles = document.getElementsByClassName("tile");

	// tell board to listen for clicks
	document.querySelector(".mineField").addEventListener("click", activeBoard);
};

// separated so I can toggle the event listener later
const activeBoard = (e) => {
	const filterBy = e.target.getAttribute("data-position").split(",");
	const targetTile = app.grid.filter((tile) => {
		return tile.pos[0] == filterBy[0] && tile.pos[1] == filterBy[1];
	});
	// check special logic on each tile, if it passes call makeMove function
	if (checkTile(e, targetTile)) {
		app.makeMove(targetTile);
		app.checkWin();
	}
};

// determine what kind of tile has been clicked and what to do next
const checkTile = (e, targetTile) => {
	const checkTile = [...e.target.classList];
	if (checkTile.join(" ").includes("revealed")) {
		return false;
	} else if (checkTile.join(" ").includes("flagged") && !app.flagState) {
		// console.log("safe");
		return false;
	} else if (checkTile.join(" ").includes("flagged") && app.flagState) {
		app.markFlag(e, targetTile);
		return false;
	} else if (app.flagState) {
		app.markFlag(e, targetTile);
	} else if (targetTile[0].mine) {
		gameOver(e, "lose");
		return false;
	} else {
		return true;
	}
};

app.markFlag = (e, targetTile) => {
	let count = parseInt(document.querySelector(".mine.number").innerHTML);
	if ([...e.target.classList].join(" ").includes("flagged")) {
		e.target.innerHTML = "";
		e.target.classList.remove("flagged");
		count++;
		document.querySelector(".mine.number").innerHTML = count;
		targetTile[0].flag = false;
		return false;
	} else {
		e.target.classList.add("flagged");
		e.target.innerHTML = "🚩";
		count--;
		document.querySelector(".mine.number").innerHTML = count;
		targetTile[0].flag = true;
		// console.log(targetTile, app.grid);
		return false;
	}
};

app.checkWin = () =>{
	const revealedTiles = document.getElementsByClassName('revealed')
	const hiddenTiles = document.getElementsByClassName('hidden')
	if (revealedTiles != undefined) {
		if(revealedTiles.length + app.mines.length == app.grid.length){
			if (hiddenTiles.length == app.mines.length) {
				gameOver(null,'win');
			}
		}
	} 
}
// trigger listeners for flag button
const flagButton = document.querySelector(".flag");
app.listenForFlagState = () => {
	flagButton.addEventListener("click", () => app.toggleFlagState());
	document.onkeypress = (e) => (e.keyCode == 102 ? app.toggleFlagState() : null);
};
// toggle flag marking functionality
app.toggleFlagState = () => {
	app.flagState = !app.flagState;
	app.flagState ? flagButton.classList.add("active") : flagButton.classList.remove("active");
};

const gameOver = (e, version) => {
	document.querySelector(".mineField").removeEventListener("click", activeBoard);
	document.querySelector(".mineField").removeEventListener("contextmenu", app.rightClick);
	flagButton.setAttribute('disabled',true)
	clearInterval(startTimer);
	if (version == "lose") {
		e.target.classList.add("red");
		e.target.classList.remove("hidden");
		let count = 0;
		let minesLeft = parseInt(document.querySelector(".mine.number").innerHTML);
		let nodeList = [];
		const minesNotFlagged = app.grid.filter((mine) => {
			if (mine.mine) {
				return mine;
			}
		});
		// console.log(app.mines, minesNotFlagged);
		minesNotFlagged.forEach((mine, i) => {
			const minePosition = mine.pos.toString("");
			const change = document.querySelectorAll(`[data-position="${minePosition}"]`);
			nodeList.push(change);
			count++;
			setTimeout(() => {
				// minesLeft--;
				change[0].classList.add("red");
				// document.querySelector(".mine.number").innerHTML = minesLeft;
			}, 100 + count * 100);
		});
	} else {
const winMessage = document.querySelector('.winMessage');
	document.querySelector(".mine.number").innerHTML = 0;
winMessage.classList.add('win')
setTimeout(()=>{
	winMessage.classList.remove('win')
},2100)
	}
};

document.addEventListener("DOMContentLoaded", function () {
	app.rulesToggle();
	app.selectDifficulty();
	app.createGrid(9, 9);
	app.placeMines(10, 0);
	app.visualizeGrid();
	app.listenForFlagState();
	app.triggerRightClicks();
});

app.triggerRightClicks = () => {
	document.querySelector(".mineField").addEventListener("contextmenu", app.rightClick);
};

app.rightClick = e => {
	e.preventDefault();
		const filterBy = e.target.getAttribute("data-position").split(",");
		const targetTile = app.grid.filter((tile) => {
			return tile.pos[0] == filterBy[0] && tile.pos[1] == filterBy[1];
		});
		// prevent revealed tiles being flagger
		if (![...e.target.classList].includes("revealed")) {
			app.markFlag(e, targetTile);
		}
}

app.selectDifficulty = () => {
	const difficulty = document.getElementsByClassName("difficulty");
	for (let i = 0; i < difficulty.length; i++) {
		difficulty[i].addEventListener("click", (e) => {
			const dataRaw = e.target.getAttribute("data-difficulty").split(" ");
			const dataMod = dataRaw.map((number) => {
				return parseInt(number);
			});
			const minefield = document.querySelector(".mineField")
			minefield.innerHTML = "";
			minefield.classList.remove('easy', 'medium', 'hard')
			minefield.classList.add(e.target.innerHTML)
			app.grid = [];
			app.hidden = [];
			app.mines = [];
			app.warnings = [];
			app.adjacentMoveTiles = [];
			app.flagState = false;
			app.flagCounter = 0;
			app.createGrid(dataMod[0], dataMod[1]);
			app.placeMines(dataMod[2], 0);
			app.visualizeGrid();
			app.resetTimer();
			app.triggerRightClicks();
			flagButton.removeAttribute('disabled')
		});
	}
};

app.resetTimer = () => {
	// clear old timer
	clearInterval(startTimer);
	// reset interval iterator
	app.gameTime = 0;
	// clear visible game time
	document.querySelector(".time.number").innerHTML = 0;
	// start interval again
	startTimer = setInterval(gameTimer, 1000);
};



// write win screen logic (stop timer, congratulate winner, show time idk)


// style related javascript

app.rulesToggle = () => {
	const openRules = document.querySelector(".openRules");
	const closeRules = document.querySelector(".closeRules");
	const rules = document.querySelector(".rulesContainer");
	const gameContainer = document.querySelector(".gameContainer");
	openRules.addEventListener("click", () => {
		app.toggleVisibility(rules);
		app.toggleVisibility(gameContainer);
		document.querySelector(".mineField").removeEventListener("click", activeBoard);
		clearInterval(startTimer);
	});
	closeRules.addEventListener("click", () => {
		app.toggleVisibility(rules);
		app.toggleVisibility(gameContainer);
		document.querySelector(".mineField").addEventListener("click", activeBoard);
		startTimer = setInterval(gameTimer, 1000);
	});
};

app.toggleVisibility = (target) => {
	target.classList.toggle("show");
	target.classList.toggle("hide");
};
