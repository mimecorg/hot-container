const deps = [ 'errors/init' ];

function init( init ) {
  return {
    name: 'dep',
    init
  };
}

module.exports = { deps, init };
