const copy = (source) => {
  let result;
  let list;
  let type;
  let key;
  let i;
  let l;

  if (!source || !(source instanceof Object)) {
    return source;
  }

  if ((source instanceof Array)) {
    type = 'array';
    result = [];
    list = source;
  } else {
    type = 'object';
    result = {};
    list = Object.keys(source);
  }

  for (i = 0, l = list.length; i < l; ++i) {
    key = (type === 'object') ? list[i] : i;
    result[key] = copy(source[key]);
  }

  return result;
};

export default copy;
