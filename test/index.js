const chai = require( 'chai' );
const sinon = require( 'sinon' );
const sinonChai = require( 'sinon-chai' );
const mock = require( 'mock-require' );

chai.use( sinonChai );

afterEach( () => {
  sinon.restore();
} );

mock( 'chokidar', './mock/chokidar' );
mock( 'hot-container', '..' );
