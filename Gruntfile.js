'use strict';

/* eslint-disable no-process-env */

const timeGrunt = require('time-grunt');

module.exports = function(grunt) {
  timeGrunt(grunt);

  grunt.initConfig({
    eslint: {
      options: {
        config: '.eslintrc'
      },
      quick: {
        src: [],
        options: {
          quiet: true
        }
      },
      all: {
        src: ['*.js', 'tasks/**/*.js', 'test/**/*.js', 'test/**/**/*.js', 'backend/**/*.js', 'frontend/app/**/*.js']
      }
    },

    lint_pattern: {
      options: {
        rules: [
          { pattern: /(describe|it)\.only/, message: 'Must not use .only in tests' }
        ]
      },
      all: {
        src: ['<%= eslint.all.src %>']
      },
      css: {
        options: {
          rules: [
            { pattern: /important;(\s*$|(?=\s+[^/]))/, message: 'CSS important rules only allowed with explanatory comment' }
          ]
        },
        src: [
          'frontend/app/**/*.less'
        ]
      },
      quick: {
        src: ['<%= eslint.quick.src %>']
      }
    },

    i18n_checker: {
      all: {
        options: {
          baseDir: __dirname,
          dirs: [{
            localeDir: 'backend/lib/i18n/locales',
            templateSrc: [
              'frontend/app/**/*.pug'
            ],
            core: true
          }],
          verifyOptions: {
            defaultLocale: 'en',
            locales: ['en', 'fr', 'vi', 'zh'],
            rules: [
              'all-keys-translated',
              'all-locales-present',
              'default-locale-translate',
              'key-trimmed',
              'no-duplicate-among-modules',
              'no-duplicate-with-core',
              'no-untranslated-key',
              'valid-json-file'
            ]
          }
        }
      }
    },

    puglint: {
      all: {
        options: {
          config: {
            disallowAttributeInterpolation: true,
            disallowLegacyMixinCall: true,
            validateExtensions: true,
            validateIndentation: 2
          }
        },
        src: [
          'frontend/**/*.pug'
        ]
      }
    },

    splitfiles: {
      options: {
        chunk: 1
      },
      midway: {
        options: {
          common: ['test/midway-backend/all.js'],
          target: 'mochacli:midway'
        },
        files: {
          src: ['test/midway-backend/**/*.js']
        }
      }
    },
    mochacli: {
      options: {
        require: ['chai', 'mockery'],
        reporter: 'spec',
        timeout: process.env.TEST_TIMEOUT || 5000,
        exit: true
      },
      backend: {
        options: {
          files: ['test/unit-backend/all.js', grunt.option('test') || 'test/unit-backend/**/*.js']
        }
      }
    },

    karma: {
      unit: {
        configFile: './test/config/karma.conf.js',
        browsers: ['PhantomJS']
      }
    }
  });

  grunt.loadTasks('tasks');

  grunt.loadNpmTasks('@linagora/grunt-lint-pattern');
  grunt.loadNpmTasks('@linagora/grunt-i18n-checker');
  grunt.loadNpmTasks('grunt-eslint');
  grunt.loadNpmTasks('grunt-mocha-cli');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-puglint');

  grunt.registerTask('i18n', 'Check the translation files', ['i18n_checker']);
  grunt.registerTask('pug-linter', 'Check the pug/jade files', ['puglint:all']);
  grunt.registerTask('linters', 'Check code for lint', ['eslint:all', 'lint_pattern:all', 'lint_pattern:css', 'i18n', 'pug-linter']);
  grunt.registerTask('linters-dev', 'Check changed files for lint', ['prepare-quick-lint', 'eslint:quick', 'lint_pattern:quick']);
  grunt.registerTask('test-midway-backend', ['splitfiles:midway']);
  grunt.registerTask('test', ['linters', 'test-midway-backend']);
  grunt.registerTask('default', ['test']);
};
