export default (parent, child) => {
  let i = parent.length;
  while (i !== 0) {
    i -= 1;
    if (parent[i] === child) {
      return true;
    }
  }
  return false;
};
