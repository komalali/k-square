export default function (...rest) {
  const [transition, callback] = rest;

  if (transition.empty()) {
    callback.apply(this, rest);
  }

  let n = 0;
  transition
    .each(() => { n += 1; })
    .each('end', function (...more) {
      n -= 1;
      if (!n) callback.apply(this, more);
    });
}
