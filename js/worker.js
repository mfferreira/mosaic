/*
* @Author: marcoferreira
* @Date:   2016-12-08 20:48:00
* @Last Modified by:   Marco Ferreira
* @Last Modified time: 2016-12-09 04:35:00
*/

'use strict';

onmessage = function(e) {
 	var imgSource = 'http://localhost:8765/color/'+e.data,
		xhr = new XMLHttpRequest();

	xhr.onreadystatechange = function() {
		if(xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
			postMessage(xhr.responseText);
		}
	}

	xhr.open('GET', imgSource, true);
	xhr.send();
}
