const path = require( 'path' );

const expect = require( 'chai' ).expect;

const hotContainer = require( 'hot-container' );

const root = path.resolve( __dirname, '..' );

describe( 'container - basic operations', () => {
  it( 'loads a module', () => {
    const container = hotContainer( { root, dir: 'modules', watch: false } );
    const c = container.get( 'c' );

    expect( c ).to.be.an( 'object' );
    expect( c.name ).to.equal( 'c' );
  } );

  it( 'returns the same module when called twice', () => {
    const container = hotContainer( { root, dir: 'modules', watch: false } );
    const c1 = container.get( 'c' );
    const c2 = container.get( 'c' );

    expect( c1 ).to.equal( c2 );
  } );

  it( 'loads a module with recursive dependencies', () => {
    const container = hotContainer( { root, dir: 'modules', watch: false } );
    const a = container.get( 'a' );

    expect( a ).to.be.an( 'object' );
    expect( a.name ).to.equal( 'a' );
    expect( a.b ).to.be.an( 'object' );
    expect( a.b.name ).to.equal( 'b' );
    expect( a.b.c ).to.be.an( 'object' );
    expect( a.b.c.name ).to.equal( 'c' );
  } );

  it( 'loads a module with multiple dependencies', () => {
    const container = hotContainer( { root, dir: 'modules', watch: false } );
    const b2 = container.get( 'b2' );

    expect( b2 ).to.be.an( 'object' );
    expect( b2.name ).to.equal( 'b2' );
    expect( b2.c ).to.be.an( 'object' );
    expect( b2.c.name ).to.equal( 'c' );
    expect( b2.c2 ).to.be.an( 'object' );
    expect( b2.c2.name ).to.equal( 'c2' );
  } );

  it( 'reuses the same dependency between modules', () => {
    const container = hotContainer( { root, dir: 'modules', watch: false } );
    const b = container.get( 'b' );
    const b2 = container.get( 'b2' );

    expect( b.c ).to.be.an( 'object' );
    expect( b.c.name ).to.equal( 'c' );
    expect( b.c ).to.equal( b2.c );
  } );

  it( 'resolves a file alias', () => {
    const container = hotContainer( { root, aliases: { file: 'modules/c' }, watch: false } );
    const c = container.get( 'file' );

    expect( c ).to.be.an( 'object' );
    expect( c.name ).to.equal( 'c' );
  } );

  it( 'resolves a directory alias', () => {
    const container = hotContainer( { root, aliases: { dir: 'modules' }, watch: false } );
    const c = container.get( 'dir/c' );

    expect( c ).to.be.an( 'object' );
    expect( c.name ).to.equal( 'c' );
  } );

  it( 'returns a registered module', () => {
    const container = hotContainer( { root, dir: 'modules', watch: false } );

    const o = { name: 'o' };
    container.register( 'o', o );

    const result = container.get( 'o' );

    expect( result ).to.equal( o );
  } );

  it( 'uses a registered module as dependency', () => {
    const container = hotContainer( { root, dir: 'modules', watch: false } );

    const o = { name: 'o' };
    container.register( 'c', o );

    const b = container.get( 'b' );
    expect( b.c ).to.equal( o );
  } );

  it( 'returns true when a module exists', () => {
    const container = hotContainer( { root, dir: 'modules', watch: false } );

    const exists = container.exists( 'c' );

    expect( exists ).to.be.true;
  } );

  it( 'returns true when a module was loaded', () => {
    const container = hotContainer( { root, dir: 'modules', watch: false } );

    container.get( 'c' );
    const exists = container.exists( 'c' );

    expect( exists ).to.be.true;
  } );

  it( 'returns false when a module does not exist', () => {
    const container = hotContainer( { root, dir: 'modules', watch: false } );

    const exists = container.exists( 'no-such-module' );

    expect( exists ).to.be.false;
  } );

  it( 'returns module metadata', () => {
    const container = hotContainer( { root, dir: 'modules', watch: false } );

    container.get( 'meta' );
    const meta = container.meta( 'meta' );

    expect( meta ).to.be.an( 'object' );
    expect( meta.c1 ).to.equal( 'foo' );
    expect( meta.c2 ).to.equal( 5 );
  } );
} );
