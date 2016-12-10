/*
* @Author: Marco Ferreira
* @Date:   2016-12-10 18:30:28
* @Last Modified by:   Marco Ferreira
* @Last Modified time: 2016-12-10 18:33:29
*/

define(function(){

	function tileQ (context) {
		var queue = {context: context, q: {}};

		this.currentRow = null;

		this.reset = function() {
			queue = {context: context, q: {}};
		}

		this.getQueue = function() {
			return queue;
		}

		this.setContext = function (context) {
			queue.context = context;
		};

		this.getContext = function() {
			return queue.context;
		}

		this.queueTile = function (x, y, tileColorHEX) {
			if (!queue.q[y])
				queue.q[y] = {done: 0, cols: {}};

			queue.q[y].cols[x] = tileColorHEX;
		};

		this.getRow = function(y) {
			return queue.q[y];
		}

		this.setDone = function(y) {
			// console.log("this.setDone:", y);
			queue.q[y].done++;
		};
	};

	return {
		newQueue: function() {
			return new tileQ();
		}
	};

});
