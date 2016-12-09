/*
* @Author: marcoferreira
* @Date:   2016-12-08 20:48:00
* @Last Modified by:   Marco Ferreira
* @Last Modified time: 2016-12-08 22:42:29
*/

'use strict';

onmessage = function(e) {
	// console.log('Message received from main script:', e.data);
 	var imgSource = 'http://localhost:8765/color/'+e.data,
		xhr = new XMLHttpRequest();

	xhr.onreadystatechange = function() {
		if(xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
			// console.log(xhr.responseText);
			postMessage(xhr.responseText);
		}
		// else {
		// 	console.log('ERROR: unable to GET', imgSource, "xhr.readyState:", xhr.readyState, "xhr.status:", xhr.status)
		// 	return;
		// }
	}

	xhr.open('GET', imgSource, true);
	xhr.send();
}
