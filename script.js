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
			revealedWarning: false,
			done: false,
		};
		xPos++;
		if (xPos == width) {
			xPos = 0;
			yPos++;
		}
		app.hidden.push(app.grid[i]);
	}
	console.log(app.grid, app.hidden, app.mines);
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
		tile = tile.pos.toString();
		// give revealed property
		tile.revealed = true;
		// target tile
		const change = document.querySelectorAll(`[data-position="${tile}"]`);
		// reveal
		change[0].classList.add("revealed");
		change[0].classList.remove("hidden");
	});
	// looks at adjacent
	app.checkAdjacent(current, "playing");
	console.log(current, "next moves");
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
					console.log(app.warnings);
				}
				// double checking that the tile hasn't reached its endstate
				if (!tile.done) {
					// if an unrevealed warning, display warning
					if (purpose == "playing" && tile.warning && !tile.revealed) {
						tile.revealedWarning = true;
						tile.revealed = true;
						change[0].classList.add("warning");
						change[0].classList.add("revealed");
						change[0].classList.remove("hidden");
						change[0].innerHTML = tile.adjacentMines;
						app.adjacentMoveTiles.push(tile);
						// if clicked displayed warning
					}
					if (purpose == "playing" && tile.warning && tile.revealed) {
						tile.done = true;
						// change[0].classList.add("revealed");
						// change[0].classList.remove("warning");
						// change[0].classList.remove("hidden");
						app.adjacentMoveTiles.push(tile);
						console.log("reading properly");
					}
					if (purpose == "playing" && !tile.warning && !tile.revealed && !tile.mine) {
						tile.done = true;
						tile.revealed = true;
						change[0].classList.add("revealed");
						change[0].classList.remove("hidden");
						app.adjacentMoveTiles.push(tile);
						app.makeMove(app.adjacentMoveTiles);
					}
				}
			}
		});
	});
};

// display minefield
app.visualizeGrid = () => {
	const minefield = document.querySelector(".mineField");
	app.grid.forEach((tile) => {
		const htmlToAppend = `<li class="tile hidden" data-position="${tile.pos}"> ${tile.mine ? "" : ""}</li>`;
		minefield.innerHTML += htmlToAppend;
	});
	const gameTiles = document.getElementsByClassName("tile");
	for (let i = 0; i < gameTiles.length; i++) {
		gameTiles[i].style.width = `${app.grid.tileWidth}%`;
		gameTiles[i].style.height = `${app.grid.tileHeight}%`;
	}

	// tell board to listen for clicks
	document.querySelector(".mineField").addEventListener("click", (e) => {
		const filterBy = e.target.getAttribute("data-position").split(",");
		const targetTile = app.grid.filter((tile) => {
			return tile.pos[0] == filterBy[0] && tile.pos[1] == filterBy[1];
		});
		// app.updateTile(e.target, targetTile);
		const checkWarning = [e.target.classList];
		const checkWarningMod = checkWarning.join("").toString();
		if (checkWarningMod.includes("warning") && checkWarningMod.includes("revealed")) {
			targetTile[0].revealed = true;
			targetTile[0].done = true;
			e.target.classList.remove("hidden");
			e.target.classList.remove("warning");
			e.target.classList.add("revealed");
			e.target.innerHTML = "";
		}
		if (app.flagState) {
			e.target.style.background = "beige";
			e.target.innerHTML = "🚩";
			return;
		} else if (targetTile[0].mine) {
			e.target.classList.add("red");
			return;
		}
		app.makeMove(targetTile);
	});
};

document.addEventListener("DOMContentLoaded", function () {
	app.createGrid("normal", 16, 11);
	app.placeMines(40, 0);
    app.visualizeGrid();
    // stop adjacent function at warnings!

	const flagButton = document.querySelector(".flag");
	flagButton.addEventListener("click", () => {
		app.flagState = !app.flagState;
		console.log(app.flagState);
		app.flagState ? (flagButton.style.background = "yellow") : (flagButton.style.background = "red");
	});
});
