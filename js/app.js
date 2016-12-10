/*
* @Author: Marco Ferreira
* @Date:   2016-12-10 17:00:00
* @Last Modified by:   Marco Ferreira
* @Last Modified time: 2016-12-10 17:41:40
*/

requirejs.config({
    baseUrl: 'lib',
    paths: {
        app: '../js'
    }
});

requirejs(['app/client']);
