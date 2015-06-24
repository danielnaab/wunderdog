'use strict';

var $ = require('zepto-browserify').$


module.exports = function() {
    var scrollTop = function () {
        window.scrollTo(0, 0)
    }
    $(window).ready(scrollTop)
    $(window).on('hashchange', scrollTop)
}
