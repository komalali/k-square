import './index.css';

import Choropleth from './components/choropleth';

// Properties for our chart. ES6 uses const and let instead of var.
const mapProps = {
  containerDivId: 'chart',
};

const boundingRect = document.getElementById(mapProps.containerDivId)
  .getBoundingClientRect();

mapProps.width = boundingRect.width - 30;
mapProps.height = boundingRect.height - 30;

// createBarChart(properties);
const map = new Choropleth(mapProps);
map.render();
