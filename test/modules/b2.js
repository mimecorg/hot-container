const deps = [ 'c', 'c2' ];

function init( c, c2 ) {
  return {
    name: 'b2',
    date: new Date(),
    c,
    c2
  };
}

module.exports = { deps, init };
