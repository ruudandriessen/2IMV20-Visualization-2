'use strict';

var Controller = require('../Controller');
var d3 = require('d3');

class WorldMap extends Controller {
    init() {
        this.svg = this.container
            .append('svg')
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .attr('viewBox', '0 0 1920 1080');

        this.tooltip = this.container
            .append('div')
            .attr('class', 'hidden tooltip');

        var projection = d3.geo
            .mercator()
            .scale(250)
            .translate([1920 / 2, 1080 / 2 + 200]);

        this.geoPath = d3.geo
            .path()
            .projection(projection);
    }

    update() {
        var elements = this.svg
            .selectAll('.countries');

        var data = elements.data(this.data.asArray());

        data
            .exit()
            .remove();

        data
            .enter()
            .append('path')
            .attr('class', (country) => country.countryCode)
            .on('mousemove', (country) => {
                // Once we enter a country, update the tooltip
                var mouse = d3.mouse(this.container.node());

                this.tooltip
                    .classed('hidden', false)
                    .style({
                        left: (mouse[0] + 15) + 'px',
                        top: (mouse[1] - 35) + 'px'
                    })
                    .html(country.name);
            })
            .on('mouseout', () => {
                // Hide the tooltip
                this.tooltip.classed('hidden', true);
            });

        data
            .attr('d', (country) => {
                return this.geoPath({type: 'MultiPolygon', coordinates: country.coordinates})
            });
    }
}

module.exports = WorldMap;