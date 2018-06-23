export default (start, stop, steps) => {
  const min = (start < stop) ? start : stop;
  const max = (stop > start) ? stop : start;

  const span = max - min;

  const values = [...Array(steps)].map((value, index) => {
    return min + ((span / (steps - 1)) * index);
  });

  return (start > stop) ? values.reverse() : values;
};
