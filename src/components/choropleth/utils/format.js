import * as d3 from 'd3';

const log10 = (val) => {
  return Math.log(val) / Math.log(10);
};

const round = (val, pos) => {
  let rounded;
  let roundTo;
  const negitive = (val < 0);

  rounded = Math.abs(val);
  roundTo = (1 - log10(rounded)) + (pos - 1);
  roundTo = (roundTo >= pos) ? roundTo : pos;
  rounded = (roundTo < 20) ? rounded.toFixed(roundTo) : rounded;

  return (negitive) ? -rounded : rounded;
};

const tick = (scale, unit) => {
  const ticks = (scale.ticks.apply(scale, [10]).length) - 1;
  const max = d3.max(scale.domain());
  const inc = max / ticks;
  let format;
  let roundTo;

  if (unit === 2) {
    roundTo = Math.ceil((1 - log10((inc * 100))) + 1) - 2;
    format = (roundTo >= 1) ? d3.format(`.${roundTo}%`) : d3.format('.0%');
  } else {
    roundTo = Math.ceil((1 - log10(inc)) + 1) - 2;
    format = (roundTo >= 1) ? d3.format(`.${roundTo}f`) : d3.format('s');
  }
  return (d) => { return format(d).replace('G', 'B'); };
};

const hover = (value, measure) => {
  let val = value;

  if (typeof val === 'object') {
    let out = '';

    const hasMean = Object.prototype.hasOwnProperty.call(val, 'm');
    const hasLower = Object.prototype.hasOwnProperty.call(val, 'l');
    const hasUpper = Object.prototype.hasOwnProperty.call(val, 'u');

    if (hasMean) {
      out += hover(val.m, measure);
    }

    if (hasLower && hasUpper && val.m !== val.l && val.m !== val.u) {
      const lower = hover(val.l, { unit: measure.unit });
      const upper = hover(val.u, { unit: measure.unit });

      out += ` (${lower} &mdash; ${upper}) `;
    }

    return out;
  }

  val = parseFloat(val);

  if (typeof (val) === 'number') {
    val = (measure.unit && measure.unit === 2) ? val *= 100 : val;
    val = d3.format(',')(round(val, 2));
  }

  if (measure.unit && measure.unit === 2) val += '%';

  if (measure.metric) val += ` ${measure.metric}`;

  return val;
};

export default {
  tick,
  hover,
};
