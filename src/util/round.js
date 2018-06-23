import log10 from './log10';

export default (val, pos) => {
  let rounded;
  let roundTo;
  const negitive = (val < 0);

  rounded = Math.abs(val);
  roundTo = (1 - log10(rounded)) + (pos - 1);
  roundTo = (roundTo >= pos) ? roundTo : pos;
  rounded = (roundTo < 20) ? rounded.toFixed(roundTo) : rounded;

  return (negitive) ? -rounded : rounded;
};
