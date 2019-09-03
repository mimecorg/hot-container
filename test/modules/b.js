const deps = [ 'c' ];

function init( c ) {
  return {
    name: 'b',
    c
  };
}

function destroy() {
}

module.exports = { deps, init, destroy };
