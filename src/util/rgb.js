export default (color) => {
  const result = color.match(/\d+/g);
  return result ? {
    r: result[0],
    g: result[1],
    b: result[2],
  } : null;
};
