const deps = [ 'c' ];

function init( c ) {
  return {
    name: 'b',
    c
  };
}

module.exports = { deps, init };
