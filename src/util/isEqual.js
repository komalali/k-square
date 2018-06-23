export default (a, b) => {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;

  for (let i = 0, l = a.length; i < l; ++i) {
    if (!b.includes(a[i])) return false;
  }

  return true;
};
