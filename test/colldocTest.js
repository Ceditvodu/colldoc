const assert = require('assert');
const colldoc = require('../colldoc.js');

describe('colldoc', function() {
	describe('#getColor()', function() {

		it('should return string with reset code', function() {
			assert.equal(colldoc.getColor('1'), '\x1b[0m');
		} );

		it('should return x1b[30m when set "frontBlack" as param', function() {
			assert.equal(colldoc.getColor('frontBlack'), '\x1b[30m');
		} );

	} );
} );

