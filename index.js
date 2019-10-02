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

  function register( name, instance ) {
    if ( map[ instance ] != null )
      throw new Error( 'Module is already registered: ' + name );

    const record = add( name );

    record.state = State.Initialized;
    record.instance = instance;
  }

  function get( name ) {
    let record = map[ name ];

    if ( record != null ) {
      if ( record.state == State.Initialized )
        return record.instance;

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

      return record.instance;
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

  function meta( name ) {
    const record = map[ name ];
    if ( record != null && record.state == State.Initialized )
      return record.meta;
    else
      return null;
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
      instance: null,
      meta: null
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
      const { deps, init, destroy, ...meta } = result;
      if ( !( deps instanceof Array ) )
        throw new TypeError( 'Invalid type of deps export in module: ' + name );
      if ( typeof init != 'function' )
        throw new TypeError( 'Invalid type of init export in module: ' + name );
      if ( destroy != null && typeof destroy != 'function' )
        throw new TypeError( 'Invalid type of destroy export in module: ' + name );
      if ( deps.length != init.length )
        throw new TypeError( 'Wrong number of init arguments in module: ' + name );
      record.state = State.Loaded;
      record.deps = deps;
      record.init = init;
      if ( destroy != null )
        record.destroy = destroy;
      record.meta = meta;
    } else {
      record.state = State.Initialized;
      record.instance = result;
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

    record.instance = record.init.apply( null, args );
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
    record.instance = null;
    record.meta = null;

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
        record.instance = null;

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

  function destroy() {
    for ( const name in map ) {
      const record = map[ name ];
      if ( record.state == State.Initialized && record.destroy != null ) {
        record.destroy();
        record.state = State.Loaded;
        record.instance = null;
      }
    }
  }

  return {
    register,
    get,
    exists,
    meta,
    on,
    stop,
    destroy
  };
}

module.exports = hotContainer;
