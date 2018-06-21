import * as d3 from 'd3';
import topojson from 'topojson';
import { merge } from 'lodash';

export default class Choropleth {
  constructor(props) {
    const defaultProps = {
      animation: 750,
      containerDivId: 'chart',
      height: 600,
      width: 800,
      zoomPadding: {
        bottom: 10,
        left: 10,
        right: 10,
        top: 10,
      },
    };

    this.props = merge({}, defaultProps, props);
  }

  async fetchTopojson() {
    this.props.topojson = await d3.json('src/resources/world-topo.json');
    console.log(this.props.topojson);
  }

  renderMap() {
    const {
      containerDivId,
      height,
      width,
    } = this.props;

    this.container = d3.select(`#${containerDivId}`);

    this.path = d3.geoPath();

    this.svg = this.container
      .append('svg')
      .attr('width', `${width}px`)
      .attr('height', `${height}px`)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');
  }

  render() {
    this.fetchTopojson()
      .then(() => {
        this.renderMap();
      });
  }
}
