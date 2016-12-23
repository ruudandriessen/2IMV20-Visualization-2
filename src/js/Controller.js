'use strict';

class Controller {
    constructor(container, data) {
        this.container = container;
        this.data = data;

        this.init();

        data.on('change', () => this.update());
    }

    init() {}

    update() {}
}

module.exports = Controller;