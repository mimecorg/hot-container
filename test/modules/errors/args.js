const deps = [ 'a', 'b' ];

function init( a ) {
  return {
    name: 'args',
    a
  };
}

module.exports = { deps, init };
