import * as topojson from 'topojson';
import { csv, json } from 'd3';
import './index.css';

import Map from './components/choropleth/map';
import { createLayers, processTopojson } from './components/choropleth/utils/index';

function fetchTopoJson(topologyUrl) {
  return json(topologyUrl);
}

function fetchData(dataUrl) {
  return csv(dataUrl, datum => ({
    location_id: datum.location_id,
    value: +datum.value,
  }));
}

async function fetch() {
  const dataset = await fetchData('src/components/choropleth/resources/fakedata.csv');
  const topology = await fetchTopoJson('src/components/choropleth/resources/world-topo.json');
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
    window.map = new Map(mapSettings, presimplifiedTopojson);

    const mapRenderOptions = {
      layers: createLayers({ detail: 1, dataset, topo: presimplifiedTopojson }),
    };

    window.map.render(mapRenderOptions);
  });

