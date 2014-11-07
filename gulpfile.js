'use strict';

var _ = require('underscore'),
    argv = require('yargs').argv,
    browserify = require('browserify'),
    connect = require('gulp-connect'),
    deploy = require('gulp-gh-pages'),
    frontMatter = require('gulp-front-matter'),
    gulp = require('gulp'),
    gulpif = require('gulp-if'),
    gutil = require('gulp-util'),
    htmlmin = require('gulp-htmlmin'),
    marked = require('gulp-marked'),
    merge = require('merge-stream'),
    minifycss = require('gulp-minify-css'),
    path = require('path'),
    rename = require('gulp-rename'),
    rimraf = require('gulp-rimraf'),
    sass = require('gulp-sass'),
    source = require('vinyl-source-stream'),
    streamify = require('gulp-streamify'),
    uglify = require('gulp-uglify'),
    swig = require('swig'),
    swigExtras = require('swig-extras'),
    through = require('through2'),
    watchify = require('watchify')


/**
 * Debug mode may be set in one of these manners:
 * - gulp --debug=[true | false]
 * - export NODE_DEBUG=[true | false]
 */
var DEBUG = (argv.debug || process.env.NODE_DEBUG) !== 'false'


var site = {
    'title': 'Wunderdog K-9 Care & Training',
    'url': 'http://localhost:9000',
    'urlRoot': '/',
    'author': 'Lynn Wunderli',
    'email': 'wunderdogwi@yahoo.com',
    'time': new Date()
}


// This is deployed to blog.crushingpennies.com/thewunderdog/ (for now).
if (argv._.indexOf('deploy') > -1) {
    site.url = 'http://blog.crushingpennies.com/wunderdog'
    site.urlRoot = '/wunderdog/'
}


swig.setDefaults({
    loader: swig.loaders.fs(__dirname + '/assets/templates'),
    cache: false
})
swigExtras.useFilter(swig, 'truncate')


function summarize(marker) {
    return through.obj(function (file, enc, cb) {
        var summary = file.contents.toString().split(marker)[0]
        file.page.summary = summary
        this.push(file)
        cb()
    })
}


function applyTemplate(templateFile) {
    var tpl = swig.compileFile(path.join(__dirname, templateFile))

    return through.obj(function (file, enc, cb) {
        var data = {
            site: site,
            page: file.page,
            content: file.contents.toString()
        }
        file.contents = new Buffer(tpl(data), 'utf8')
        this.push(file)
        cb()
    })
}


gulp.task('cleanposts', function () {
    return gulp.src(['dist/posts'], {read: false})
        .pipe(rimraf())
})


gulp.task('posts', ['cleanposts'], function () {
    return gulp.src('content/posts/*.md')
        .pipe(frontMatter({property: 'page', remove: true}))
        .pipe(marked())
        .pipe(summarize('<!--more-->'))
        // Collect all the posts and place them on the site object.
        .pipe((function () {
            var posts = []
            var tags = []
            return through.obj(function (file, enc, cb) {
                file.page.url = 'posts/' + path.basename(file.path, '.md')
                posts.push(file.page)
                posts[posts.length - 1].content = file.contents.toString()

                if (file.page.tags) {
                    file.page.tags.forEach(function (tag) {
                        if (tags.indexOf(tag) === -1) {
                            tags.push(tag)
                        }
                    })
                }

                this.push(file)
                cb()
            },
            function (cb) {
                posts.sort(function (a, b) {
                    return b.date - a.date
                })
                site.posts = posts
                site.tags = tags
                cb()
            })
        })())
        .pipe(applyTemplate('assets/templates/post.html'))
        .pipe(gulp.dest('dist/posts'))
        .pipe(connect.reload())
})


gulp.task('testimonials', function () {
    return gulp.src('content/testimonials/*.md')
        .pipe(frontMatter({property: 'page', remove: true}))
        .pipe(marked())
        // Collect all the testimonials and place them on the site object.
        .pipe((function () {
            var testimonials = []
            return through.obj(function (file, enc, cb) {
                testimonials.push(file.page)
                testimonials[testimonials.length - 1].content = file.contents.toString()
                this.push(file)
                cb()
            },
            function (cb) {
                testimonials.sort(function (a, b) {
                    if (a.author < b.author) {
                        return -1;
                    }
                    if (a.author > b.author) {
                        return 1;
                    }
                    return 0;
                })
                site.testimonials = testimonials
                cb()
            })
        })())
})


gulp.task('cleanpages', function () {
    return gulp.src(['dist/*.html'], {read: false})
        .pipe(rimraf())
})


gulp.task('pages', ['cleanpages', 'testimonials'], function () {
    var html = gulp.src(['content/pages/*.html'])
        .pipe(frontMatter({property: 'page', remove: true}))
        .pipe(through.obj(function (file, enc, cb) {
            var data = {
                site: site,
                page: {}
            }
            var tpl = swig.compileFile(file.path)
            file.contents = new Buffer(tpl(data), 'utf8')
            this.push(file)
            cb()
        }))

    var markdown = gulp.src('content/pages/*.md')
        .pipe(frontMatter({property: 'page', remove: true}))
        .pipe(marked())
        .pipe(applyTemplate('assets/templates/page.html'))
        .pipe(rename({extname: '.html'}))

    return merge(html, markdown)
        .pipe(gulpif(!DEBUG, htmlmin({
            // This option seems logical, but it breaks gulp-rev-all
            removeAttributeQuotes: false,

            removeComments: true,
            collapseWhitespace: true,
            removeRedundantAttributes: true,
            removeStyleLinkTypeAttributes: true,
            minifyJS: true,
            minifyCSS: true,
            minifyURLs: true
        })))
        .pipe(gulp.dest('dist'))
        .pipe(connect.reload())
})


gulp.task('cleanimages', function () {
    return gulp.src(['dist/images'], {read: false})
        .pipe(rimraf())
})


gulp.task('images', function () {
    return gulp.src('images/**/*')
        .pipe(gulp.dest('dist/images'))
        .pipe(connect.reload())
})


gulp.task('cleanstyles', function () {
    return gulp.src(['dist/styles'], {read: false})
        .pipe(rimraf())
})


gulp.task('styles', ['cleanstyles'], function () {
    return gulp.src('assets/styles/app.scss')
        .pipe(sass())
        .pipe(gulpif(!DEBUG, minifycss()))
        .pipe(gulp.dest('dist/styles'))
        .pipe(connect.reload())
})


gulp.task('cleanfavicon', function () {
    return gulp.src(['dist/favicon.ico'], {read: false})
        .pipe(rimraf())
})


gulp.task('favicon', ['cleanfavicon'], function () {
    return gulp.src('assets/favicon.ico')
        .pipe(gulp.dest('dist'))
        .pipe(connect.reload())
})


function scripts(watch) {
    var args = watch ? _.clone(watchify.args) : {}
    args.debug = DEBUG

    var bundler = browserify('./assets/scripts/app.js', args)

    if (watch) {
        bundler = watchify(bundler)
    }

    function rebundle() {
        gutil.log('Bundling... ')

        return bundler.bundle()
            // log errors if they happen
            .on('error', function(e) {
                gutil.log('Browserify Error', e)
            })
            .pipe(source('app.js'))
            .pipe(gulpif(!DEBUG, streamify(uglify())))
            .pipe(gulp.dest('./dist/scripts'))
            .pipe(connect.reload())
    }

    bundler.on('update', rebundle)
    return rebundle()
}


gulp.task('cleanscripts', function () {
    return gulp.src(['dist/scripts'], {read: false})
        .pipe(rimraf())
})


gulp.task('rss', ['posts'], function () {
    return gulp.src(['assets/templates/atom.xml'])
        .pipe(through.obj(function (file, enc, cb) {
            var data = {
                site: site,
                page: {}
            }
            var tpl = swig.compileFile(file.path)
            file.contents = new Buffer(tpl(data), 'utf8')
            this.push(file)
            cb()
        }))
        .pipe(gulp.dest('dist'))
})


gulp.task('content', ['posts', 'pages', 'rss'])
gulp.task('default', ['content', 'images', 'styles', 'favicon', 'rss'])


gulp.task('clean', function() {
    return gulp.src('dist', {read: false})
        .pipe(rimraf())
})


gulp.task('watch', ['default'], function () {
    gulp.watch(['assets/templates/**'], ['content'])
    gulp.watch(['assets/styles/**'], ['styles'])
    gulp.watch(['assets/images/**'], ['images'])

    gulp.watch(['content/pages/**', 'content/testimonials/**'], ['pages'])
    gulp.watch(['content/posts/**'], ['posts', 'rss'])

    scripts(true)

    connect.server({
        root: ['dist'],
        port: 9000,
        livereload: true
    })
})


gulp.task('dist', ['default'], function() {
    return scripts(false)
})


gulp.task('deploy', ['dist'], function () {
    return gulp.src('./dist/**/*')
        .pipe(deploy());
})
