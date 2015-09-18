'use strict';

var $ = require('zepto-browserify').$


// Define a function to replace the URL hash without updating browser history.
var replaceHash = null
if ('replaceState' in history) {
    replaceHash = function(newhash) {
        if (('' + newhash).charAt(0) !== '#') {
            newhash = '#' + newhash
        }
        history.replaceState('', '', newhash)
    }
}
else {
    var hash = location.hash
    replaceHash = function(newhash) {
        if (location.hash !== hash) {
            history.back()
        }
        location.hash = newhash
    }
}


module.exports = function() {
    setInterval(function() {
        var match = $('.slideshow > input:checked').attr('id').match(/radio-(\d+)/)
        var page = ((match ? match[1] : 1) % 3)
        $('.slideshow > #radio-' + (page + 1)).prop('checked', true)
    }, 5000)

    // On touch devices, show the testimonial on click.
    $('article.testimonial div').on('click', function () {
        // Clear other "selected" testimonials.
        $('article.testimonial div').removeClass('selected')

        // Add class to the clicked element.
        $(this).addClass('selected')
    })
}
