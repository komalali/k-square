import * as topojson from 'topojson';
import { find } from 'lodash';

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

      const data = dataset.reduce((geoResult, row) => {
        geoResult[row.location_id] = row.value;

        if (row.value < min) min = row.value;
        if (row.value > max) max = row.value;

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
