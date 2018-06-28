import * as topojson from 'topojson';
import { csv, json } from 'd3';
import './index.css';

import Map from './components/map';
import { createLayers, processTopojson } from './utils';

async function fetchTopoJson(topologyUrl) {
  return json(topologyUrl);
}

async function fetchData(dataUrl) {
  return csv(dataUrl, datum => ({
    location_id: datum.location_id,
    value: +datum.value,
  }));
}

async function fetch() {
  const dataset = await fetchData('src/resources/fakedata.csv');
  const topology = await fetchTopoJson('src/resources/world-topo.json');
  return {
    dataset,
    topology,
  };
}

const mapSettings = {
  chart: {
    container: '#chart',
    height: 500,
    width: 1000,
  },
};

fetch()
  .then(({ dataset, topology }) => {
    const presimplifiedTopojson = topojson.presimplify(topology);
    processTopojson(presimplifiedTopojson);
    const map = new Map(mapSettings, presimplifiedTopojson);

    const mapRenderOptions = {
      layers: createLayers({ detail: 2, dataset, topo: presimplifiedTopojson }),
    };

    map.render(mapRenderOptions);
  });

