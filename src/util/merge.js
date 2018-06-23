const merge = (...items) => {
  let keys;
  let key;
  let src;
  const dst = {};
  let a;
  let al;
  let k;
  let kl;
  for (a = 0, al = items.length; a < al; ++a) {
    src = items[a];
    if ((src instanceof Object)
      && !(src instanceof Array)
      && !(src instanceof Function)
    ) {
      keys = Object.keys(src);
      for (k = 0, kl = keys.length; k < kl; ++k) {
        key = keys[k];
        if ((src[key] instanceof Object)
          && !(src[key] instanceof Array)
          && !(src[key] instanceof Function)
        ) {
          dst[key] = merge(dst[key] || {}, src[key]);
        } else dst[key] = src[key];
      }
    }
  }
  return dst;
};

export default merge;
