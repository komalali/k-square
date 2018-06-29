import * as topojson from 'topojson';
import { csv, json } from 'd3';
import Map from '../dist/src/components/choropleth/map';
import './index.css';
import { createLayers, processTopojson } from '../dist/src/components/choropleth/utils';

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
    height: 600,
    width: 1100,
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

