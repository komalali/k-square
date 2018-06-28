import * as topojson from 'topojson';
import { reduce } from 'lodash';

// Make this a function so it can be easily reused when updating the chart.
export function generateRandomDataset(numberOfDataPoints) {
  const dataPoints = [];
  for (let i = 0; i < numberOfDataPoints; i++) {
    const randomNumber = Math.floor(Math.random() * 21) + 5;
    dataPoints.push(randomNumber);
  }
  return dataPoints;
}

export function extractFeatures(topology, featureLayer) {
  return topojson.feature(topojson.presimplify(topology), topology.objects[featureLayer]).features;
}

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
