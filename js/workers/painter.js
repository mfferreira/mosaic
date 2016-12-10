/*
* @Author: Marco Ferreira
* @Date:   2016-12-10 20:17:57
* @Last Modified by:   Marco Ferreira
* @Last Modified time: 2016-12-10 21:07:21
*/

var q, y,
	row,
	cols,
	numCols,
	x, color,
	currentRow;

onmessage = function(e) {

	q = e.data.q,
	y = e.data.y;

	row = q[y];
	cols = Object.keys(row.cols);
	numCols = cols.length;

	// check if this is a callback
	if (currentRow === y) {
		if (row.done < numCols)
			// ignore call if current row isn't fully displayed
			return;
		else {
			// jump to next row (y)
			y += e.data.TILE_HEIGHT;
			row = q[y];
			if (!row)
				// no more rows to work with
				return;
			cols = Object.keys(row.cols);
			numCols = cols.length;
		}
	}

	currentRow = y;

	// fill current row with tiles
	for (var i=0; i < numCols; i++) {
		x = cols[i];
		color = row.cols[x];
		// console.log("y:", y, "x:", x, "color:", color);
		postMessage({
			x: x,
			y: y,
			color: color
		});
	}
};
