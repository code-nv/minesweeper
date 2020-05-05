// Handler when the DOM is fully loaded

app = {};
app.grid = [];

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
			besideMine: false,
			mine: false,
			flag: false,
		};
		xPos++;
		if (xPos == width) {
			xPos = 0;
			yPos++;
		}
	}
	console.log(app.grid);
};

// random number generator
app.rng = (max) => {
	return Math.floor(Math.random() * max);
};

// give random squares a mine value
app.placeMines = (mines) => {
	let counter = 0;
	app.grid[app.rng(app.grid.length)].mine = true;
	app.grid.forEach((tile) => {
		tile.mine ? counter++ : counter;
	});
	counter < mines ? app.placeMines(mines) : console.log(app.grid, "done");
};

// display minefield
app.visualizeGrid = () => {
	const minefield = document.querySelector(".mineField");
	app.grid.forEach((tile) => {
		const htmlToAppend = `<li class="tile hidden" data-position="${tile.pos}"> ${tile.mine ? "M" : "T"}</li>`;
		minefield.innerHTML += htmlToAppend;
	});
	const gameTiles = document.getElementsByClassName("tile");
	for (let i = 0; i < gameTiles.length; i++) {
		gameTiles[i].style.width = `${app.grid.tileWidth}%`;
		gameTiles[i].style.height = `${app.grid.tileHeight}%`;
	}

	// tell board to listen for clicks
	document.querySelector(".mineField").addEventListener("click", (e) => {
		app.makeMove(e.target);
	});
	// app.createEventListeners(gameTiles);
};

app.makeMove = (tile) => {
	console.log(tile, "this is make move tile");
	// check if tile is already revealed
	const classList = tile.classList;
	if (classList.toString().includes("revealed")) {
		return;
	} else {
		// reveal logic
		tile.classList.toggle("hidden");
		tile.classList.toggle("revealed");
		// feed position into adjacent checker
		app.isAdjacentToMine(tile.getAttribute("data-position"));
	}
};

// find adjacent square's to this square
app.isAdjacentToMine = (current) => {
	current = current.split(",");
	adjacentTiles = {
		tiles: [],
		mines: 0,
	};
	// ensuring square is adjacent
	const difference = (a, b, c) => {
		return Math.abs(a[c] - b[c]);
	};

	app.grid.filter((tile) => {
        let targetTile
        if (tile.pos[0] == current[0] && tile.pos[1] == current[1]){
            targetTile = tile
        }
		const xDiff = difference(tile.pos, current, 0);
		const yDiff = difference(tile.pos, current, 1);
		if (xDiff < 2 && yDiff < 2) {
			adjacentTiles.tiles.push(tile);
			if (tile.mine) {
                adjacentTiles.mines++;
                tile.besideMine = true
                console.log(tile, adjacentTiles.mines)

				// adjacentTiles.tiles.pop(tile)
			}
			// don't take the event tile
			if (tile.pos[0] == current[0] && tile.pos[1] == current[1]) {
				adjacentTiles.tiles.pop(tile);
			}
		}
    })
};

const nextMove = (adjacentTiles) => {
	adjacentTiles.tiles.forEach((tile) => {
		console.log(adjacentTiles.tiles);
		if (!tile.mine && tile.state == "hidden") {
			tile.state = "revealed";
			const nextTile = document.querySelectorAll(`li[data-position="${tile.pos}`);
			app.makeMove(nextTile[0]);
			console.log(nextTile, "this is next tile");
		} else {
			console.log("turn over");
			return;
		}
	});
};

document.addEventListener("DOMContentLoaded", function () {
	app.createGrid("normal", 5, 5);
	app.placeMines(10);
	app.visualizeGrid();
});
