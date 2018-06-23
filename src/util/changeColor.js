export default (input, ratio, darker) => {
  if (!input) return input;

  let color = input;

  const pad = (number, totalChars) => {
    const padding = '0';
    let num = `${number}`;
    while (num.length < totalChars) {
      num = padding + num;
    }
    return num;
  };

  color = color.replace(/^\s*|\s*$/, '');
  color = color.replace(
    /^#?([a-f0-9])([a-f0-9])([a-f0-9])$/i,
    '#$1$1$2$2$3$3',
  );

  // Calculate ratio
  const difference = Math.round(ratio * 256) * (darker ? -1 : 1);

  // Determine if input is RGB(A)
  const rgb = color.match(new RegExp(
    '^rgba?\\(\\s*' +
      '(\\d|[1-9]\\d|1\\d{2}|2[0-4][0-9]|25[0-5])' +
      '\\s*,\\s*' +
      '(\\d|[1-9]\\d|1\\d{2}|2[0-4][0-9]|25[0-5])' +
      '\\s*,\\s*' +
      '(\\d|[1-9]\\d|1\\d{2}|2[0-4][0-9]|25[0-5])' +
      '(?:\\s*,\\s*' +
      '(0|1|0?\\.\\d+))?' +
      '\\s*\\)$'
    , 'i',
  ));

  const alpha = !!rgb && rgb[4] !== undefined ? rgb[4] : null;

  // Convert hex to decimal
  const decimal = rgb ? [rgb[1], rgb[2], rgb[3]] : color.replace(
    /^#?([a-f0-9][a-f0-9])([a-f0-9][a-f0-9])([a-f0-9][a-f0-9])/i,
    (...rest) => {
      return `
          ${parseInt(rest[1], 16)},
          ${parseInt(rest[2], 16)},
          ${parseInt(rest[3], 16)}
        `;
    },
  ).split(/,/);

  const [r, g, b] = decimal.map((value) => {
    return parseInt(value, 10);
  });

  // Return RGB(A)
  return rgb ?
    `rgb${alpha !== null ? 'a' : ''}(
      ${Math[darker ? 'max' : 'min'](r + difference, darker ? 0 : 255)},
      ${Math[darker ? 'max' : 'min'](g + difference, darker ? 0 : 255)},
      ${Math[darker ? 'max' : 'min'](b + difference, darker ? 0 : 255)}
      ${alpha !== null ? `, ${alpha}` : ''})` :
    // Return hex
    ['#',
      pad(Math[darker ? 'max' : 'min'](r + difference, darker ? 0 : 255).toString(16), 2),
      pad(Math[darker ? 'max' : 'min'](g + difference, darker ? 0 : 255).toString(16), 2),
      pad(Math[darker ? 'max' : 'min'](b + difference, darker ? 0 : 255).toString(16), 2),
    ].join('');
};
