const c1 = 'foo';
const c2 = 5;

const deps = [ 'b' ];

function init( b ) {
  return {
    name: 'meta',
    b
  };
}

module.exports = { c1, c2, deps, init };
