const deps = [ 'b' ];

function init( b ) {
  return {
    name: 'a',
    b
  };
}

module.exports = { deps, init };
