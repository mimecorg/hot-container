const deps = [ 'errors/cyclic1' ];

function init( cyclic1 ) {
  return {
    name: 'cyclic2',
    cyclic1
  };
}

module.exports = { deps, init };
