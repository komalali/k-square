export default (breadcrumb, obj, ...rest) => {
  let result = true;

  let current = obj;

  if (typeof current === 'undefined') return false;

  for (let i = 0, l = rest.length; i < l; ++i) {
    if (current[rest[i]] === undefined) {
      if (breadcrumb) {
        current[rest[i]] = {};
        result = false;
      } else return false;
    }
    current = current[rest[i]];
  }
  return result;
};
