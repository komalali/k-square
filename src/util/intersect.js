export default (x, y) => {
  const ret = [];
  let a;
  let b;

  if (x.length > y.length) {
    a = y;
    b = x;
  } else {
    a = x;
    b = y;
  }

  for (let i = 0, al = a.length; i < al; ++i) {
    for (let z = 0, bl = b.length; z < bl; ++z) {
      if (a[i] === b[z]) {
        ret.push(a[i]);
        break;
      }
    }
  }

  return ret;
};
