'use strict';

var $ = require('zepto-browserify').$


// Define a function to replace the URL hash without updating browser history.
var replaceHash = null
if ('replaceState' in history) {
    replaceHash = function (newhash) {
        if (('' + newhash).charAt(0) !== '#') {
            newhash = '#' + newhash
        }
        history.replaceState('', '', newhash)
    }
}
else {
    var hash = location.hash
    replaceHash = function (newhash) {
        if (location.hash !== hash) {
            history.back()
        }
        location.hash = newhash
    }
}


module.exports = function () {
    var numSlides = 4
    function move(diff, timer) {
        var match = $('.slideshow > input:checked').attr('id').match(/radio-(\d+)/)
        var curPage = match ? match[1] : 1

        var next = Number(curPage) + diff
        if (next === 0) {
            next = numSlides
        }
        else if (next > numSlides) {
            next = 1
        }

        $('.slideshow > #radio-' + next).prop('checked', true)

        if (timer) {
            clearInterval(timer)
        }
    }

    var goNext = move.bind(null, 1)
    var goPrev = move.bind(null, -1)

    var timer = setInterval(goNext, 5000)
    $('.slideshow > .previous-slide').on('click', goPrev.bind(null, timer))
    $('.slideshow > .next-slide').on('click', goNext.bind(null, timer))

    // On touch devices, show the testimonial on click.
    $('article.testimonial div').on('click', function () {
        // Clear other "selected" testimonials.
        $('article.testimonial div').removeClass('selected')

        // Add class to the clicked element.
        $(this).addClass('selected')
    })
}
