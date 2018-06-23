import * as topojson from 'topojson';

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
