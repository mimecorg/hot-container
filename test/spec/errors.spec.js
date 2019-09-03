const path = require( 'path' );

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );

const hotContainer = require( 'hot-container' );

const root = path.resolve( __dirname, '..' );

describe( 'container - error handling', () => {
  it( 'module does not exist', () => {
    const container = hotContainer( { root, dir: 'modules', watch: false } );

    const handler = sinon.stub();
    container.on( 'error', handler );

    const result = container.get( 'no-such-module' );

    expect( result ).to.be.null;
    expect( handler ).to.have.been.calledWith( sinon.match( err => {
      expect( err ).to.be.an( 'error' );
      return true;
    } ) );
  } );

  it( 'module cannot be loaded', () => {
    const container = hotContainer( { root, dir: 'modules', watch: false } );

    const handler = sinon.stub();
    container.on( 'error', handler );

    const result = container.get( 'errors/load' );

    expect( result ).to.be.null;
    expect( handler ).to.have.been.calledWith( sinon.match( err => {
      expect( err ).to.be.an( 'error' );
      return true;
    } ) );
  } );

  it( 'module cannot be initialized', () => {
    const container = hotContainer( { root, dir: 'modules', watch: false } );

    const handler = sinon.stub();
    container.on( 'error', handler );

    const result = container.get( 'errors/init' );

    expect( result ).to.be.null;
    expect( handler ).to.have.been.calledWith( sinon.match( err => {
      expect( err ).to.be.an( 'error' );
      return true;
    } ) );
  } );

  it( 'cyclic dependency is detected', () => {
    const container = hotContainer( { root, dir: 'modules', watch: false } );

    const handler = sinon.stub();
    container.on( 'error', handler );

    const result = container.get( 'errors/cyclic1' );

    expect( result ).to.be.null;
    expect( handler ).to.have.been.calledWith( sinon.match( err => {
      expect( err ).to.be.an( 'error' );
      expect( err.message ).to.equal( 'Cyclic dependency in module: errors/cyclic1' );
      return true;
    } ) );
  } );

  it( 'dependency cannot be initialized', () => {
    const container = hotContainer( { root, dir: 'modules', watch: false } );

    const handler = sinon.stub();
    container.on( 'error', handler );

    const result = container.get( 'errors/dep' );

    expect( result ).to.be.null;
    expect( handler ).to.have.been.calledTwice;
    expect( handler.secondCall ).to.have.been.calledWith( sinon.match( err => {
      expect( err ).to.be.an( 'error' );
      expect( err.message ).to.equal( 'Unresolved dependency: errors/init' );
      return true;
    } ) );
  } );

  it( 'init has wrong number of arguments', () => {
    const container = hotContainer( { root, dir: 'modules', watch: false } );

    const handler = sinon.stub();
    container.on( 'error', handler );

    const result = container.get( 'errors/args' );

    expect( result ).to.be.null;
    expect( handler ).to.have.been.calledWith( sinon.match( err => {
      expect( err ).to.be.an( 'error' );
      expect( err.message ).to.equal( 'Wrong number of init arguments in module: errors/args' );
      return true;
    } ) );
  } );
} );
