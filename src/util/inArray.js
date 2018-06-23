/* eslint-disable */

export default (needle, haystack, argStrict) => {
  let key = '';
  const strict = !!argStrict;

  if (strict) {
    for (key in haystack) {
      if (haystack[key] === needle) {
        return true;
      }
    }
  } else {
    for (key in haystack) {
      if (haystack[key] === needle) {
        return true;
      }
    }
  }

  return false;
};
