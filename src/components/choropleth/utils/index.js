import * as topojson from 'topojson';
import { reduce } from 'lodash';

export const copy = (source) => {
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

export const merge = (...items) => {
  let keys;
  let key;
  let src;
  const dst = {};
  let a;
  let al;
  let k;
  let kl;
  for (a = 0, al = items.length; a < al; ++a) {
    src = items[a];
    if ((src instanceof Object)
      && !(src instanceof Array)
      && !(src instanceof Function)
    ) {
      keys = Object.keys(src);
      for (k = 0, kl = keys.length; k < kl; ++k) {
        key = keys[k];
        if ((src[key] instanceof Object)
          && !(src[key] instanceof Array)
          && !(src[key] instanceof Function)
        ) {
          dst[key] = merge(dst[key] || {}, src[key]);
        } else dst[key] = src[key];
      }
    }
  }
  return dst;
};

export const intersect = (x, y) => {
  const ret = [];
  let a;
  let b;

  if (x.length > y.length) {
    a = y;
    b = x;
  } else {
    a = x;
    b = y;
  }

  for (let i = 0, al = a.length; i < al; ++i) {
    for (let z = 0, bl = b.length; z < bl; ++z) {
      if (a[i] === b[z]) {
        ret.push(a[i]);
        break;
      }
    }
  }

  return ret;
};

export const doesIntersect = (a, b) => {
  if (a instanceof Array && b instanceof Array) {
    return intersect(a, b).length !== 0;
  }

  if (a instanceof Array) {
    return b.includes(a);
  }

  if (b instanceof Array) {
    return a.includes(b);
  }

  return (a.length <= b.length) ? b.includes(a) : a.includes(b);
};

export const range = (start, stop, steps) => {
  const min = (start < stop) ? start : stop;
  const max = (stop > start) ? stop : start;

  const span = max - min;

  const values = [...Array(steps)].map((value, index) => {
    return min + ((span / (steps - 1)) * index);
  });

  return (start > stop) ? values.reverse() : values;
};

export function createLayers(options = {}) {
  const {
    dataset,
    detail,
    topo,
  } = options;

  const layers = [...Array(detail)].map((_, level) => {
    return `admin${level}`;
  }).concat([`admin${(detail - 1)}_disputes`]);

  return layers.reduce((layerResults, layer) => {
    const topology = topo.objects[layer];

    if (topology) {
      let min = Infinity;
      let max = -Infinity;

      const data = dataset.reduce((geoResult, { location_id, value }) => {
        geoResult[`${location_id}`] = { value };

        if (value < min) min = value;
        if (value > max) max = value;

        return geoResult;
      }, {});

      layerResults.push({
        key: layer.includes('disputes') ? 'disputes' : layer,
        topology,
        data,
        extent: [min, max],
      });
    }

    return layerResults;
  }, []);
}

export function processTopojson(topology) {
  const previousDisputedLayer = {};

  topology.objects = reduce(topology.objects, (results, value, key) => {
    const isDisputedLayer = key.includes('disputes');

    value.geometries = value.geometries.reduce((geometries, feature, index) => {
      const { disputes = [], loc_id, admin_id } = feature.properties;
      const location_id = (admin_id || loc_id) || {};
      const geomKey = `key-${index + 1}`;
      let properties;

      if (isDisputedLayer) {
        properties = {
          key: geomKey,
          location_id: (location_id) ? location_id : previousDisputedLayer[loc_id].location_id,
          disputes: disputes.map(Number),
        };

        previousDisputedLayer[loc_id] = properties;
      } else if (key === 'admin0' || location_id) {
        properties = {
          key: geomKey,
          location_id,
        };
      }

      if (properties) {
        geometries.push({
          ...feature,
          properties,
        });
      }

      return geometries;
    }, []);

    if (value.geometries.length) {
      results[key] = value;
    }

    return results;
  }, {});
}

export { default as format } from './format';
