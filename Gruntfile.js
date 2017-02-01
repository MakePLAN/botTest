'use strict';

module.exports = function (grunt) {

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-shell');
    grunt.loadNpmTasks('grunt-mocha-test');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            options: {
                curly: true,
                eqeqeq: true,
                eqnull: true,
                browser: true,
                latedef: true,
                strict: true,
                node: true,
                esversion: 6,
                sub: true
            },
            uses_defaults: ['src/**/*.js', 'test/**/*.js']
        },
        shell: {
            jibo: {
                command: 'jibo sim'
            }
        },
        mochaTest: {
            test: {
                options: {
                    timeout: 6000
                },
                src: ['test/unit/*.js']
            },
            email: {
                options: {
                    timeout: 20000
                },
                src: ['test/unit/emailClientTest.js']
            }
        }
    });

    grunt.registerTask('build', ['jshint', 'mochaTest', 'shell']);
    grunt.registerTask('test', ['jshint', 'mochaTest']);
    grunt.registerTask('lint', ['jshint']);
};
