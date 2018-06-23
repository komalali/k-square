export default (...input) => {
  let joined = [].slice.call(input, 0).join('/');

  // make sure protocol is followed by two slashes
  joined = joined.replace(/:\//g, '://');

  // remove consecutive slashes
  joined = joined.replace(/([^:\s])\/+/g, '$1/');

  // remove trailing slash before parameters or hash
  joined = joined.replace(/\/(\?|&|#(\w+)$)/g, '$1');

  // replace ? in parameters with &
  joined = joined.replace(/(\?.+)\?/g, '$1&');

  return joined;
};
