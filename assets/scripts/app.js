'use strict';

var $ = require('zepto-browserify').$


$(window).on('scroll', function() {
    var opac = 1 - $(window).scrollTop() / $('header').height()
    $('header').css({
        opacity: opac
    })
})
