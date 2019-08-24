const deps = [ 'errors/cyclic2' ];

function init( cyclic2 ) {
  return {
    name: 'cyclic1',
    cyclic2
  };
}

module.exports = { deps, init };
