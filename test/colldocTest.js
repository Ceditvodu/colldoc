'use strict';

const assert = require('assert');
const colldoc = require('../colldoc.js');

describe('colldoc', function() {
  describe('#getColor', function() {

    it('should return string with reset code', function() {
      assert.equal(colldoc.getColor('1'), '\x1b[0m');
    } );

    it('should return x1b[30m when set "frontBlack" as param', function() {
      assert.equal(colldoc.getColor('frontBlack'), '\x1b[30m');
    } );

  } );
  
  describe('#getFileContent', function () {

    it('should return file content with "hello" inside', function () {

      Promise.resolve(colldoc.getFileContent('./sandbox/hello_content.html'))
        .then(result => {
          assert.equal(result, 'hello');
        });

    });

    it('must throw an error if there is no such file', function () {

      Promise.resolve(colldoc.getFileContent('./sandbox/goust.html'))
        .then(_ => assert.fail())
        .catch(_ => assert.ok('error'));

    });

  });

  describe('#saveFile', function () {

    it('should return file content with "hello" inside', function () {

      Promise.resolve(colldoc.getFileContent('./sandbox/hello_content.html'))
        .then(result => {
          assert.equal(result, 'hello');
        });

    });

    it('must throw an error if there is no such file', function () {

      Promise.resolve(colldoc.getFileContent('./sandbox/goust.html'))
        .then(_ => assert.fail())
        .catch(_ => assert.ok('error'));

    });

  });

} );

