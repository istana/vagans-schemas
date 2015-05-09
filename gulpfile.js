var gulp = require('gulp');
var taskListing = require('gulp-task-listing');
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
var mocha = require('gulp-mocha');

gulp.task('help', taskListing);

gulp.task('lint', function() {
	console.log('Running lint');
	return gulp.src(['./src/**/*.js[on]?', './*.js[on]?', './test/**/*.js'])
		.pipe(jshint())
		.pipe(jshint.reporter(stylish));
});


gulp.task('test', function() {
	console.log('Running tests....');
	return gulp.src('./test/**/*.js', {read: false})
		.pipe(mocha({reporter: 'nyan'}))
});

