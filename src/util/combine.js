export default (keys, values) => {
  const obj = {};
  const keycount = keys && keys.length;

  if (typeof keys !== 'object' || typeof values !== 'object'
    || typeof keycount !== 'number' || typeof values.length !== 'number' || !keycount) {
    return false;
  }

  if (keycount !== values.length) return false;

  for (let i = 0; i < keycount; i++) {
    obj[keys[i]] = values[i];
  }

  return obj;
};
