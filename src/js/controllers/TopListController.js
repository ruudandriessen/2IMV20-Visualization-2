'use strict';

var Controller = require('../core/Controller');
var d3 = require('d3');
const ElementList = require('../core/ElementList');

class PositionList extends ElementList {
    get data() {
        const grouped = new Map();

        this.controller.values.asKeyValueArray()
            .filter(([,value]) => value !== null)
            .forEach(([country, value]) => {
            if (!grouped.has(value)) {
                grouped.set(value, [[country, value]]);
            } else {
                grouped.get(value).push([country, value]);
            }
        });

        return Array.from(grouped.entries())
            .sort(([a,], [b,]) => this.controller.highest ? b - a : a - b)
            .slice(0, 3)
            .map(([, countriesAndValues]) => countriesAndValues);
    }

    get keyMapping() {
        return (_, i) => i;
    }

    select() {
        return this.container
            .selectAll('li.toplist__position');
    }

    enter(elements) {
        const li = elements
            .append('li')
            .classed('mdl-list__item', true)
            .classed('toplist__position', true);

        li
            .append('div')
            .classed('mdl-list__item-avatar', true)
            .text((_, i) => i+1);

        const content = li
            .append('div')
            .classed('mdl-list__item-primary-content', true);

        content
            .append('ul')
            .classed('mdl-list', true);
    }

    exit(elements) {
        elements
            .remove()
    }
}

class CountryList extends ElementList {
    get data() {
        return (countriesAndValues) => countriesAndValues;
    }

    get keyMapping() {
        return ([country,]) => country;
    }

    select() {
        return this.container
            .selectWithData()
            .select('ul')
            .selectAll('li');
    }

    enter(elements) {
        const li = elements
            .append('li')
            .classed('mdl-list__item', true)
            .classed('mdl-list__item--two-line', true);

        const content = li
            .append('div')
            .classed('mdl-list__item-primary-content', true);

        const country = content
            .append('div');

        country
            .append('span')
            .classed('flag-icon', true)
            .style('background-image', ([country,]) => `url('/img/flags/${this.controller.countries.get(country).alpha2Code.toLowerCase()}.svg')`);

        country
            .append('span')
            .text(([country,]) => this.controller.countries.get(country).name);

        const value = content
            .append('div')
            .classed('toplist__value', true)
            .classed('mdl-list__item-sub-title', true);

        value
            .append('span')
            .classed('toplist__number', true);

        value
            .append('span')
            .classed('toplist__meter', true)
            .append('span');
    }

    exit(elements) {
        elements
            .remove()
    }

    updateElements(elements) {
        const format = (value) => {
            return value !== null ? d3.format('.4s')(value) : '-';
        };

        const percentage = (metric, value) => {
            if (value === null) {
                return 0;
            }

            return d3.format("%")
            (d3.scale
                [metric.scale]()
                .domain([metric.minValue, metric.maxValue])
                .range([0, 1])(value));
        };

        elements
            .select('toplist__number')
            .text(([,value]) => format(value));

        elements
            .select('toplist__number')
            .attr('width', ([,value]) => percentage(value));
    }
}

class TopListController extends Controller {
    init() {
        this.positionList = new PositionList(
            this,
            this.container.select('ol')
        );

        this.countryList = new CountryList(
            this,
            this.positionList
        );
    }

    update() {
        this.positionList.update();
        this.countryList.update();
    }
}

module.exports = TopListController;
