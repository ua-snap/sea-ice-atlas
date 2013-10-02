'use strict';

var request = require('request');

module.exports = function (grunt) {
    var reloadPort = 35729,
        files;

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        less: {
                options: {
                    paths: ['src/less'],
                    compress: true
                },
                files: {
                		dest: 'build/style.css',
                		src: 'src/less/style.less'
                }
            
        },
        concat: {
        		css: {
        			files: {
        				'public/css/style.css': [
        					'src/bower_components/bootstrap/dist/css/bootstrap.css',
        					'build/style.css'
        				]
        			}
        		},
        		js: {
        			files: {
        				'public/js/client.js': [
        					'src/bower_components/bootstrap/dist/js/bootstrap.min.js'
        				]
        			}
        		}
        },
        copy: {
        		bootstrap: {
        			expand: true,
        			src: ['src/bower_components/bootstrap/dist/fonts/*'],
        			dest: 'public/fonts'
        		}
        },
        uglify: {

        },
        cssmin: {

        },
        develop: {
            server: {
                file: 'app.js'
            }
        },
        watch: {
            options: {
                nospawn: true,
                livereload: reloadPort
            },
            server: {
                files: [
                            'app.js',
                            'routes/*.js',
                            'Gruntfile.js'
                ],
                tasks: ['develop', 'delayed-livereload']
            },
            js: {
                files: ['public/js/*.js'],
                options: {
                    livereload: reloadPort
                }
            },
            css: {
                files: ['public/css/*.css'],
                options: {
                    livereload: reloadPort
                }
            },
            less: {
            	files: ['src/less/*.less'],
            	tasks: ['develop', 'delayed-livereload']
            },
            jade: {
                files: ['views/*.jade'],
                options: {
                    livereload: reloadPort
                }
            }
        }
    });

    grunt.config.requires('watch.server.files');
    files = grunt.config('watch.server.files');
    files = grunt.file.expand(files);

    grunt.registerTask('delayed-livereload', 'Live reload after the node server has restarted.', function () {
        var done = this.async();
        setTimeout(function () {
            request.get('http://localhost:' + reloadPort + '/changed?files=' + files.join(','), function (err, res) {
                var reloaded = !err && res.statusCode === 200;
                if (reloaded) {
                    grunt.log.ok('Delayed live reload successful.');
                } else {
                    grunt.log.error('Unable to make a delayed live reload.');
                }
                done(reloaded);
            });
        }, 500);
    });

    grunt.loadNpmTasks('grunt-develop');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-copy');

    grunt.registerTask('default', ['less', 'concat', 'copy', 'develop', 'watch']);
};
