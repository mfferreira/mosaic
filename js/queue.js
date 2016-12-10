/*
* @Author: Marco Ferreira
* @Date:   2016-12-10 18:30:28
* @Last Modified by:   Marco Ferreira
* @Last Modified time: 2016-12-10 20:54:45
*/

define(function(){

	function tileQ (context) {
		var queue = {},
			qContext = context;

		this.currentRow = null;

		this.reset = function() {
			queue = {};
		}

		this.getQueue = function() {
			return queue;
		}

		this.setContext = function (context) {
			qContext = context;
		};

		this.getContext = function() {
			return qContext;
		}

		this.queueTile = function (x, y, tileColorHEX) {
			if (!queue[y])
				queue[y] = {done: 0, cols: {}};

			queue[y].cols[x] = tileColorHEX;
		};

		this.getRow = function(y) {
			return queue[y];
		}

		this.setDone = function(y) {
			// console.log("this.setDone:", y);
			queue[y].done++;
		};
	};

	return {
		newQueue: function() {
			return new tileQ();
		}
	};

});
