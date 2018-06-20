import './index.css';

import generateRandomDataset from './utils';
import createBarChart from './components/barChart';

// Properties for our chart. ES6 uses const and let instead of var.
const properties = {
  width: 800,
  height: 600,
  barPadding: 1,
  data: generateRandomDataset(20),
  labelOffset: 14,
};

createBarChart(properties);
