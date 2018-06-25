import { json } from 'd3';
import './index.css';

import Map from './components/map';

async function fetchTopoJson(topologyUrl) {
  return json(topologyUrl);
}

const mapSettings = {
  chart: {
    container: '#chart',
    height: 500,
    width: 1000,
  },
};

fetchTopoJson('src/resources/world-topo.json').then((topology) => {
  console.log(topology);
  const map = new Map(mapSettings, topology);

  const mapRenderOptions = {
    layers: [
      {
        key: 'admin0',
        topology: topology.objects.admin0,
        extent: [-Infinity, Infinity],
      },
    ],
  };

  map.render(mapRenderOptions);
});

