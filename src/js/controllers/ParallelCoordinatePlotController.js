'use strict';

const Controller = require('../core/Controller');
const d3 = require('d3');
const ElementList = require('../core/ElementList');

class PCP extends ElementList {
    get data() {
        return this.controller.values.asKeyValueArray();
    }

    countryName(code) {
        return this.controller.countries.models[code];
    }

    get metrics() {
        if (!this.data[0]) {
            return [];
        }

        let metrics = [];
        let data = this.data[0][1] ? this.data[0][1] : [];
        for (let metricId in data) {
            let metric = this.controller.view.metrics.get(data[metricId].metric);
            metric.id = metricId;
            metrics.push(metric);
        }
        return metrics;
    }

    get keyMapping() {
        return ([countryCode,]) => countryCode;
    }

    select() {
        return this.container
            .selectAll('path');
    }

    enter(elements) {
        let self = this;

        this.lines = elements
            .append("path")
            .attr("class", "countryLine foreground")
            .on('mousemove', function (country) {
                d3.select(this)
                    .each(function () {
                        this.parentNode.appendChild(this);
                    });

                const mouse = d3.mouse(self.controller.container.node());
                const countryData = self.countryName(country[0]);

                self.controller.tooltip
                    .classed('is-active', true)
                    .style({
                        left: (mouse[0] - (self.controller.tooltip[0][0].offsetWidth / 2 - 5)) + 'px',
                        top: (mouse[1] - (self.controller.tooltip[0][0].offsetHeight - 60)) + 'px'
                    });

                if (!countryData) {
                    return;
                }
                const backgroundImage = 'alpha2Code' in countryData ?
                    `url('/img/flags/${countryData.alpha2Code.toLowerCase()}.svg')` :
                    null;

                self.controller.tooltip
                    .select('span.flag-icon')
                    .classed('hidden', !('alpha2Code' in countryData))
                    .style('background-image', backgroundImage);

                self.controller.tooltip
                    .select('span.country')
                    .text(countryData.name);
            })
            .on('mouseout', () => {
                self.controller.tooltip.classed('is-active', false);
            });
    }

    exit(elements) {
        elements
            .remove()
    }

    updateElements(elements) {
        const self = this;
        // Update axes
        const metrics = this.metrics;

        if (!metrics || metrics.length == 0) {
            return;
        }

        // Compute scales for the metrics
        let scales = [];
        let order = [];

        this.x = d3.scale.ordinal()
            .domain(metrics.map(function(d) { order.push(d.id); return d.id; }))
            .rangeRoundPoints([100, 1820]); // 100 padding
        this.y = {};


        Object.keys(metrics).forEach((key) => {
            let metric = metrics[key];
            self.y[metric.id] = d3.scale
                [metric.scale]()
                .domain([metric.minValue, metric.maxValue])
                .range([1030, 50]); // 50 top, 50 bottom padding

            scales.push({id: metric.id, key: key, metric: metric.metric, name: metric.name});
        });

        const axis = d3.svg.axis().orient("left");

        let dim = this.container.selectAll(".dimensions")
            .data(scales)
            .enter()
            .append("g")
            .attr("class", "dimension")
            .attr("transform", function(d) { return "translate(" + self.x(d.id) + ")" });

        dim.append("g")
            .attr("class", "axis")
            .each(function(d) { d3.select(this).call(axis.scale(self.y[d.id])); })
            .append("text")
            .style("text-anchor", "middle")
            .attr("y", 12)
            .text(function(d) { return d.name || "-"; });


        dim.append("g")
            .attr("class", "brush")
            .each(function(d) {
                d3.select(this)
                    .call(self.y[d.id].brush = d3.svg.brush().y(self.y[d.id])
                    .on("brushstart", self.brushstart)
                    .on("brush", function() { self.brush(self) }));
            })
            .selectAll("rect")
            .attr("x", -8)
            .attr("width", 16);

        // Draw lines
        let lineFunction = d3.svg.line()
            .x((d) => self.x(d.id))
            .y((d) => self.y[d.id](d.value));

        elements
            .filter(function(d) {
                d = d[1];
                let result = true;
                Object.keys(d).forEach((key) => {
                    const metric = d[key];
                    if (metric.value === null || metric.value === undefined) {
                        result = false;
                    }
                });
                return result;
            })
            .attr('d', (d) => {
                let metric = d[1];
                let result = [];
                for (let i = 0; i < order.length; i++) {
                    let lineData = metric[order[i]];
                    lineData.id = order[i];
                    result.push(lineData);
                }
                return lineFunction(result);
            });

        this.dimensions = dim;
    }


    brushstart() {
        d3.event.sourceEvent.stopPropagation();
    }

    // Handles a brush event, toggling the display of foreground lines.
    brush(self) {
        let actives = self.dimensions.filter(function(d) { return !self.y[d.id].brush.empty(); }),
            extents = actives.map(function(d) { return d.map(function(k) { return self.y[k.__data__.id].brush.extent(); })});

        self.lines.attr("class", function(d) {
            let result = actives.every(function(p, i) {
                let length = p.length;
                for (let j = 0; j < length; j++) {
                    let metricName = p[j].__data__.id;
                    let value = d[1][metricName].value;
                    if (value === undefined || !(extents[i][j][0] <= value && value <= extents[i][j][1])) {
                        return false;
                    }
                }
                return true;
            });
            return result ? "countryLine foreground": "countryLine background";
        });
    }

}

class ParallelCoordinatePlotController extends Controller {
    init() {
        this.tooltip = this.container
            .append('div')
            .classed('mdl-tooltip', true);

        this.tooltip
            .append('span')
            .classed('flag-icon', true);

        this.tooltip
            .append('span')
            .classed('country', true);

        this.pcp = new PCP(
            this,
            this.container.select('svg')
        );
    }

    update() {
        this.pcp.update();
    }
}

module.exports = ParallelCoordinatePlotController;