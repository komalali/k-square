export default (color, dark = 'dark', light = 'light') => {
  let r = 0;
  let g = 0;
  let b = 0;
  let result = color;

  if (/rgba/.test(result)) {
    result = result.replace('rgba(', '').replace(')', '').split(/,/);
    [r, g, b] = result;
  } else if (/rgb/.test(result)) {
    result = result.replace('rgb(', '').replace(')', '').split(/,/);
    [r, g, b] = result;
  } else if (/#/.test(result)) {
    result = result.replace('#', '');
    if (result.length === 3) {
      let _t = '';
      _t += result[0] + result[0];
      _t += result[1] + result[1];
      _t += result[2] + result[2];
      result = _t;
    }
    r = parseInt(result.substr(0, 2), 16);
    g = parseInt(result.substr(2, 2), 16);
    b = parseInt(result.substr(4, 2), 16);
  }

  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? light : dark;
};
