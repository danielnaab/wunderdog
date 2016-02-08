'use strict';

var $ = require('zepto-browserify').$


module.exports = function () {
    function updateHash() {
        window.scrollTo(0, 0)
        $('#menu a').removeClass('selected')
            .filter('[href="' + window.location.hash + '"]')
            .addClass('selected')
    }

    $(window).ready(function () {
        if (!window.location.hash) {
            window.location.hash = $('article').first().attr('id')
        }
        updateHash()
    })

    $(window).on('hashchange', updateHash)
}
