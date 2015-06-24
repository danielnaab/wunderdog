'use strict';

var $ = require('zepto-browserify').$


module.exports = function() {
    $(window).on('hashchange', function () {
        window.scrollTo(0, 0)
    })
}
