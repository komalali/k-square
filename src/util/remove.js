export default (array, ...remove) => {
  let what;
  let { length } = remove;
  while (length > 0 && array.length) {
    length -= 1;
    what = remove[length];
    while (array.includes(what)) {
      array.splice(array.indexOf(what), 1);
    }
  }
  return array;
};
