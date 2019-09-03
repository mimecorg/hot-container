# hot-container

Dependency injection container with hot-reloading for Node.js.

<a href="https://npmjs.org/package/hot-container"><img src="https://img.shields.io/npm/v/hot-container.svg" alt="NPM module"></a>
<a href="https://github.com/mimecorg/hot-container/blob/master/LICENSE"><img src="https://img.shields.io/github/license/mimecorg/hot-container.svg" alt="MIT License"></a>

## Introduction

A dependency injection container is an object which knows how to create other objects or functions. These objects or functions can be composed using other objects or functions, called dependencies.

Each object or function managed by the container is defined as a separate Node.js module, i.e. a file with a `.js` or `.json` extension, located in a specific directory. It can be either a plain Node.js module, or a special dynamic module which exports a constructor function and an array of dependencies. The dependencies are automatically resolved by the container and injected into the constructor.

When the hot-reloading feature is enabled, the container tracks file changes and automatically reloads modified modules. All objects or functions which depend on the modified modules are also automatically re-created. This is especially useful during development, making it possible to modify the application code on-the-fly without having to restart it. Hot-reloading can be disabled in production mode to reduce resource usage.

## Installation

```sh
$ npm install hot-container
```

## Usage

### Creating a container

```js
const hotContainer = require( 'hot-container' );

const container = hotContainer( {
  root: __dirname,
  dir: 'modules',
  aliases: {
    config: 'data/config.json',
    utils: 'utils'
  },
  watch: true,
  verbose: true
} );
```

Options:

- `root` - the path of the root directory; the default value is the directory containing the current entry script
- `dir` - the directory, relative to `root`, containing modules which can be loaded by the containers; the default value is `'.'`
- `aliases` - an object which defines file and directory aliases (see the [aliases](#aliases) section below)
- `watch` - when enabled, modified modules are automatically reloaded; the default value is `true`
- `verbose` - when enabled, debugging information is printed to the console; the default value is `false`

### Dynamic modules

A module which depends on other modules is defined in the following way:

```js
const deps = [ 'db', 'log' ];

function init( db, log ) {
  return function() { ... };
}

module.exports = { deps, init };
```

The `deps` array specifies the dependencies of the module. The `init` function is called with resolved dependencies as arguments. It should return the module instance, i.e. the object or function which can be then retrieved from the container or injected as a dependency of another module.

### Static modules

The container can also load simple modules without any dependencies. In that case the module instance should be directly exported from the module:

```js
module.exports = function() { ... };
```

### Retrieving a module instance

The **`get( name )`** method can be used to get the instance of the specified module:

```js
const handler = container.get( 'handler' );
if ( handler != null )
  handler( request, response, next );
```

If the module or one of its dependencies cannot be loaded or initialized, `null` is returned. See the [error handling](#error-handling) section below for information about handling errors.

Note that modules are only loaded and initialized when they are needed, i.e. when `get()` is called. For hot-reloading to work, make sure that `get()` is called on every request or event processed by the application, in order to get an up-to-date instance of the module.

### Programmatic registration

Use the **`register( name, instance )`** method to add an object or function directly to the container:

```js
container.register( 'foo', function() { ... } );
```

The registered object or function can then be used as a dependency of a dynamic module or retrieved from the container using `get()`.

The container can be registered in itself:

```js
conainer.register( 'container', container );
```

This makes it possible for modules to access the container, for example in order to retrieve an instance of another module on demand, rather than during initialization.

### Error handling

Use the **`on( name, listener )`** method to register an error handler:

```js
container.on( 'error', err => console.error( err ) );
```

If no error handler is registered, the application will be aborted when an error occurs.

### Destroying a module

A dynamic module can export an optional `destroy()` function:

```js
let timer = null;

const deps = [ 'one', 'two' ];

function init( one, two ) {
  timer = setTimeout( function() { ... }, 1000 );
  return function() { ... };
}

function destroy() {
  if ( timer != null ) {
    clearTimeout( timer );
    timer = null;
  }
}

module.exports = { deps, init, destroy };
```

This function is called when the module or one of its dependencies are modified. It should clean up any external resources, such as timers, file handles, etc.

Note that a module is destroyed immediately when a modification is detected, but it's not initialized again until it's needed.

### Stopping the container

Use the `stop()` method to stop watching modified files:

```js
container.stop();
```

Note that the application will keep running as long as the container is watching files.

### Aliases

You can define aliases to access files or directories outside of the default `dir` directory. For example:

```js
  aliases: {
    config: 'data/config.json',
    utils: 'utils'
  }
```

In this case, when `'config'` is used as the module name, the container will load the `data/config.json` file. When the module name is prefixed with `'utils/'`, for example `'utils/log'`, it will load files from the `'utils'` directory.

The alias paths can be absolute or relative to the `root` directory.
