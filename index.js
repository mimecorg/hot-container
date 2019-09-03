const EventEmitter = require( 'events' );
const path = require( 'path' );

const chokidar = require( 'chokidar' );

const State = {
  None: 0,
  Found: 1,
  Loaded: 2,
  Initializing: 3,
  Initialized: 4
};

function hotContainer( { root, dir = '.', aliases, watch = true, verbose = false } = {} ) {
  const map = {};

  const emitter = new EventEmitter();

  if ( root == null )
    root = path.dirname( require.main.filename );

  function register( name, value ) {
    if ( map[ value ] != null )
      throw new Error( 'Module is already registered: ' + name );

    const record = add( name );

    record.state = State.Initialized;
    record.result = value;
  }

  function get( name ) {
    let record = map[ name ];

    if ( record != null ) {
      if ( record.state == State.Initialized )
        return record.result;

      if ( record.error && record.state != State.None )
        return null;

      if ( record.state == State.Initializing )
        throw new Error( 'Cyclic dependency in module: ' + name );
    } else {
      record = add( name );
    }

    try {
      if ( record.state == State.None )
        find( name, record );

      if ( record.state == State.Found )
        load( name, record );

      if ( record.state == State.Loaded )
        initialize( name, record );

      return record.result;
    } catch ( err ) {
      record.error = true;

      emitter.emit( 'error', err );

      return null;
    }
  }

  function exists( name ) {
    const record = map[ name ];
    if ( record != null )
      return record.state >= State.Found;

    try {
      resolve( name );
      return true;
    } catch ( err ) {
      return false;
    }
  }

  function add( name ) {
    const record = {
      state: State.None,
      error: false,
      path: null,
      watcher: null,
      deps: null,
      init: null,
      destroy: null,
      result: null
    };

    map[ name ] = record;

    return record;
  }

  function find( name, record ) {
    record.path = resolve( name );
    record.state = State.Found;

    if ( watch ) {
      record.watcher = chokidar.watch( record.path, { ignoreInitial: true } )
        .on( 'change', () => unload( name, record ) )
        .on( 'add', () => unload( name, record ) )
    }
  }

  function resolve( name ) {
    if ( aliases != null ) {
      const index = name.indexOf( '/' );
      const prefix = index > 0 ? name.substr( 0, index ) : null;

      for ( const key in aliases ) {
        if ( key == name )
          return require.resolve( path.resolve( root, aliases[ key ] ) );
        else if ( key == prefix )
          return require.resolve( path.resolve( root, aliases[ key ], name.substr( index + 1 ) ) );
      }
    }

    return require.resolve( path.resolve( root, dir, name ) );
  }

  function load( name, record ) {
    if ( verbose )
      console.log( 'loading module: ' + name );

    const result = require( record.path );

    if ( typeof result == 'object' && result.deps != null && result.init != null ) {
      record.state = State.Loaded;
      record.deps = result.deps;
      record.init = result.init;
      if ( result.destroy != null )
        record.destroy = result.destroy;
    } else {
      record.state = State.Initialized;
      record.result = result;
    }
  }

  function initialize( name, record ) {
    if ( verbose )
      console.log( 'initializing module: ' + name );

    record.state = State.Initializing;

    const args = record.deps.map( dep => {
      const arg = get( dep );
      if ( arg == null )
        throw new Error( 'Unresolved dependency: ' + dep );
      return arg;
    } );

    record.result = record.init.apply( null, args );
    record.state = State.Initialized;
  }

  function unload( name, record ) {
    if ( verbose )
      console.log( 'unloading module: ' + name );

    if ( record.state == State.Initialized && record.destroy != null )
      record.destroy();

    delete require.cache[ record.path ];

    record.state = State.Found;
    record.error = false;
    record.deps = null;
    record.init = null;
    record.destroy = null;
    record.result = null;

    invalidate( name );
  }

  function invalidate( dep ) {
    for ( const name in map ) {
      const record = map[ name ];

      if ( ( record.state == State.Initialized || record.state == State.Loaded && record.error ) && record.deps != null && record.deps.includes( dep ) ) {
        if ( verbose )
          console.log( 'invalidating module: ' + name );

        if ( record.state == State.Initialized && record.destroy != null )
          record.destroy();

        record.state = State.Loaded;
        record.error = false;
        record.result = null;

        invalidate( name );
      }
    }
  }

  function on( name, listener ) {
    emitter.on( name, listener );
  }

  function stop() {
    if ( watch ) {
      for ( const name in map ) {
        const watcher = map[ name ].watcher;
        if ( watcher != null )
          watcher.close();
      }
      watch = false;
    }
  }

  return {
    register,
    get,
    exists,
    on,
    stop
  };
}

module.exports = hotContainer;
