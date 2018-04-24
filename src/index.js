import * as d3 from 'd3';
import './index.css';

// Make this a function so it can be easily reused when updating the chart.
function generateRandomDataset(numberOfDataPoints) {
  const dataPoints = [];
  for (let i = 0; i < numberOfDataPoints; i++) {
    const randomNumber = Math.floor(Math.random() * 21) + 5;
    dataPoints.push(randomNumber);
  }
  return dataPoints;
}

// Properties for our chart. ES6 uses const and let instead of var.
const properties = {
  width: 800,
  height: 600,
  barPadding: 1,
  data: generateRandomDataset(20),
  labelOffset: 14,
};

d3.select('.chart-title')
  .append('h4')
  .text('This is the title of this chart')
  .style('color', 'red');

const svg = d3.select('.chart')
  .append('svg')
  .attr('height', properties.height)
  .attr('width', properties.width);

// instead of using scale.ordinal and then rangeBand, d3v4 has a scaleBand()
const xScale = d3.scaleBand()
  .rangeRound([0, properties.width])
  .domain(d3.range(properties.data.length));

const yScale = d3.scaleLinear() // d3v4 syntax
  .domain([0, d3.max(properties.data)])
  .range([0, properties.height]);

svg.selectAll('rect')
  .data(properties.data)
  .enter()
  .append('rect')
  .attr('x', (datum, index) => xScale(index))
  .attr('y', datum => properties.height - yScale(datum)) // Arrow functions from ES6
  .attr('width', xScale.bandwidth())
  .attr('height', datum => yScale(datum))
  .attr('fill', datum => `rgb(0, 0, ${datum * 10})`); // Template-literals from ES6

svg.selectAll('text')
  .data(properties.data)
  .enter()
  .append('text')
  .attr('class', 'label')
  .text(datum => datum)
  .attr('x', (datum, index) => xScale(index) + xScale.bandwidth() / 2)
  .attr('y', datum => properties.height - yScale(datum) + properties.labelOffset);

function updateChart() {
  const data = generateRandomDataset(20);
  // object-destructuring from ES6. equivalent to const height = properties.height;
  const { height, labelOffset } = properties;

  svg.selectAll('rect')
    .data(data)
    .transition()
    .duration(500)
    .attr('y', datum => height - yScale(datum))
    .attr('height', datum => yScale(datum))
    .attr('fill', datum => `rgb(0, 0, ${datum * 10})`);

  svg.selectAll('text')
    .data(data)
    .transition()
    .duration(500)
    .text(datum => datum)
    .attr('x', (datum, index) => xScale(index) + xScale.bandwidth() / 2)
    .attr('y', datum => height - yScale(datum) + labelOffset);
}

d3.select('.button')
  .on('click', updateChart);

