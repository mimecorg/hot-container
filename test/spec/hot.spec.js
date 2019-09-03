const path = require( 'path' );

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );

const chokidar = require( 'chokidar' );

const hotContainer = require( 'hot-container' );

const root = path.resolve( __dirname, '..' );

describe( 'container - hot reloading', () => {
  it( 'watches a module', () => {
    sinon.spy( chokidar, 'watch' );
    sinon.spy( chokidar.FSWatcher.prototype, 'on' );

    const container = hotContainer( { root, dir: 'modules', watch: true } );
    container.get( 'c' );

    expect( chokidar.watch ).to.have.been.calledWith( sinon.match.string, sinon.match( options => {
      expect( options ).to.deep.equal( { ignoreInitial: true } );
      return true;
    } ) );

    expect( chokidar.FSWatcher.prototype.on ).to.have.been.calledWith( 'change', sinon.match.func );
    expect( chokidar.FSWatcher.prototype.on ).to.have.been.calledWith( 'add', sinon.match.func );
  } );

  it( 'reloads a modified module', () => {
    sinon.spy( chokidar.FSWatcher.prototype, 'on' );

    const container = hotContainer( { root, dir: 'modules', watch: true } );
    const c = container.get( 'c' );

    expect( chokidar.FSWatcher.prototype.on ).to.have.been.calledWith( 'change', sinon.match( callback => {
      callback();
      return true;
    } ) );

    const result = container.get( 'c' );

    expect( result ).to.be.an( 'object' );
    expect( result ).to.not.equal( c );
    expect( result.name ).to.equal( 'c' );
    expect( result.date ).to.not.equal( c.date );
  } );

  it( 'reinitializes a module with modified dependency', () => {
    sinon.spy( chokidar.FSWatcher.prototype, 'on' );

    const container = hotContainer( { root, dir: 'modules', watch: true } );
    const b = container.get( 'b' );

    expect( chokidar.FSWatcher.prototype.on.callCount ).to.equal( 4 );
    expect( chokidar.FSWatcher.prototype.on.thirdCall ).to.have.been.calledWith( 'change', sinon.match( callback => {
      callback();
      return true;
    } ) );

    const result = container.get( 'b' );

    expect( result ).to.not.equal( b );
    expect( result.c ).to.not.equal( b.c );
  } );

  it( 'reuses the dependecy when reloading a module', () => {
    sinon.spy( chokidar.FSWatcher.prototype, 'on' );

    const container = hotContainer( { root, dir: 'modules', watch: true } );
    const b = container.get( 'b' );

    expect( chokidar.FSWatcher.prototype.on.callCount ).to.equal( 4 );
    expect( chokidar.FSWatcher.prototype.on.firstCall ).to.have.been.calledWith( 'change', sinon.match( callback => {
      callback();
      return true;
    } ) );

    const result = container.get( 'b' );

    expect( result ).to.not.equal( b );
    expect( result.c ).to.equal( b.c );
  } );

  it( 'destroys a modified module', () => {
    sinon.spy( chokidar.FSWatcher.prototype, 'on' );

    const b = require( '../modules/b' );
    sinon.spy( b, 'destroy' );

    const container = hotContainer( { root, dir: 'modules', watch: true } );
    container.get( 'b' );

    expect( chokidar.FSWatcher.prototype.on.firstCall ).to.have.been.calledWith( 'change', sinon.match( callback => {
      callback();
      return true;
    } ) );

    expect( b.destroy ).to.have.been.called;
  } );

  it( 'destroys a module with modified dependency', () => {
    sinon.spy( chokidar.FSWatcher.prototype, 'on' );

    const b = require( '../modules/b' );
    sinon.spy( b, 'destroy' );

    const container = hotContainer( { root, dir: 'modules', watch: true } );
    container.get( 'b' );

    expect( chokidar.FSWatcher.prototype.on.thirdCall ).to.have.been.calledWith( 'change', sinon.match( callback => {
      callback();
      return true;
    } ) );

    expect( b.destroy ).to.have.been.called;
  } );

  it( 'stops watching a module', () => {
    sinon.spy( chokidar.FSWatcher.prototype, 'close' );

    const container = hotContainer( { root, dir: 'modules', watch: true } );
    container.get( 'c' );
    container.stop();

    expect( chokidar.FSWatcher.prototype.close ).to.have.been.called;
  } );
} );
