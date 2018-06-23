import intersect from './intersect';
import isIn from './isIn';

export default (a, b) => {
  if (a instanceof Array && b instanceof Array) {
    return intersect(a, b).length !== 0;
  }

  if (a instanceof Array) {
    return isIn(b, a);
  }

  if (b instanceof Array) {
    return isIn(a, b);
  }

  return (a.length <= b.length) ? isIn(a, b) : isIn(b, a);
};
