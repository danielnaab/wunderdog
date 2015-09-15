'use strict';

var $ = require('zepto-browserify').$


module.exports = function() {
    var scrollTop = function () {
        window.scrollTo(0, 0)
    }
    $(window).ready(function () {
        if (!window.location.hash) {
            window.location.hash = $('article').first().attr('id')
        }
    })
    $(window).on('hashchange', scrollTop)
}
