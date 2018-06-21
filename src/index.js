import './index.css';

import Choropleth from './components/choropleth';

// Properties for the map.
const mapProps = {
  containerDivId: 'chart',
  topologyUrl: 'src/resources/world-topo.json',
};


const boundingRect = document.getElementById(mapProps.containerDivId)
  .getBoundingClientRect();

mapProps.width = boundingRect.width - 30;
mapProps.height = boundingRect.height - 30;

const map = new Choropleth(mapProps);
map.render();
