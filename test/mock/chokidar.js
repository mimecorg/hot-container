class FSWatcher {
  on( name, listener ) {
    return this;
  }
  close() {
  }
}

function watch( path, options = {} ) {
  return new FSWatcher();
}

module.exports = { watch, FSWatcher };
