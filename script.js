// Handler when the DOM is fully loaded

app = {};
app.grid = [];
app.hidden = [];
app.mines = [];
app.warnings = [];
app.adjacentMoveTiles = [];
app.flagState = false;

// creates board given difficulty or dimensions
app.createGrid = (level = "", width = 0, height = 0) => {
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
	console.log(app.grid);
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
		counter < mines ? app.placeMines(mines, counter) : app.checkAdjacent(app.mines, "placing");
	}
};

// useful for finding adjacent tiles
app.difference = (a, b, c) => {
	return Math.abs(a[c] - b[c]);
};

// occurs on click of a tile in gameboard
// reveals this tile and looks at adjacent tiles,
// puts all these tiles in an array for later
// recursively executes itself with the above array if those tiles are not a mine or neighbouring a mine
app.makeMove = (current) => {
	const adjacentTiles = [...current];
	adjacentTiles.forEach((tile) => {
		// check posisition
		tilePos = tile.pos.toString();
		// give revealed property
		tile.revealed = true;
		// target tile
		const change = document.querySelectorAll(`[data-position="${tilePos}"]`);
		// reveal tile clicked
		change[0].classList.add("revealed");
		change[0].classList.remove("hidden");
		// looks at adjacent
		if (tile.warning) {
			change[0].innerHTML = tile.adjacentMines;
		}
	});
	app.checkAdjacent(current, "playing");
	// console.log(current, "next moves");
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
					// console.log(app.warnings);
				}
				// double checking that the tile hasn't reached its endstate
				if (!tile.revealed) {
					// reveal adjacent warnings
					if (purpose == "playing" && tile.warning) {
						tile.revealed = true;
						change[0].classList.add("revealed");
						change[0].classList.remove("hidden");
						change[0].innerHTML = tile.adjacentMines;
						// app.adjacentMoveTiles.push(tile);
						// app.makeMove(app.adjacentMoveTiles);

						// warnings do not trigger neighbouring warnings
					}
					// reveal if empty
					if (purpose == "playing" && !tile.mine && !tile.warning) {
						tile.revealed = true;
						change[0].classList.add("revealed");
						change[0].classList.remove("hidden");
						app.adjacentMoveTiles.push(tile);
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
	minefield.style.width = `${app.grid.width * 30}px`;
	minefield.style.height = `${app.grid.height * 30}px`;
	app.grid.forEach((tile) => {
		const htmlToAppend = `<li class="tile hidden" data-position="${tile.pos}"> ${tile.mine ? "" : ""}</li>`;
		minefield.innerHTML += htmlToAppend;
	});
	const gameTiles = document.getElementsByClassName("tile");
	for (let i = 0; i < gameTiles.length; i++) {
		// gameTiles[i].style.width = `${app.grid.tileWidth}%`;
		// 	gameTiles[i].style.height = `${app.grid.tileHeight}%`;
	}

	// tell board to listen for clicks
	document.querySelector(".mineField").addEventListener("click", (e) => {
		const filterBy = e.target.getAttribute("data-position").split(",");
		const targetTile = app.grid.filter((tile) => {
			return tile.pos[0] == filterBy[0] && tile.pos[1] == filterBy[1];
		});
		if (checkTile(e, targetTile)) {
			app.makeMove(targetTile);
		}
	});
};


// determine what kind of tile has been clicked and what to do next
const checkTile = (e, targetTile) => {
	const checkTile = [...e.target.classList];

	if (checkTile.join(" ").includes("revealed") || checkTile.join(" ").includes("flagged")) {
		console.log("already revealed / flagged");
		return false;
	}
	if (app.flagState) {
		if (checkTile.join(" ").includes("flagged")) {
			e.target.innerHTML = "";
			e.target.classList.remove("flagged");
			return false;
		} else {
			e.target.classList.add("flagged");
			e.target.innerHTML = "🚩";
			return false;
		}
	} else if (targetTile[0].mine) {
		e.target.classList.add("red");
		return false;
	} else {
		return true;
	}
};

document.addEventListener("DOMContentLoaded", function () {
	app.createGrid("normal", 20, 15);
	app.placeMines(45, 0);
	app.visualizeGrid();
	// stop adjacent function at warnings!

	const flagButton = document.querySelector(".flag");
	flagButton.addEventListener("click", () => {
		app.flagState = !app.flagState;
		app.flagState ? flagButton.classList.add("active") : flagButton.classList.remove("active");
	});
});

// if a tile has a flag on it, don't reveal via adjacent.
// if click on a mine, end game
// if all tiles revealed !mine and all tiles !revealed are mine, win
// prevent tiles from being revealed diagonally
