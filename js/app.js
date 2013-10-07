window.Shutdown2013 = {};

Shutdown2013.FurloughMap = function() {
    _.bindAll(this, 'loadedData', 'zoom', 'abbrevText');
    this.width = 1280 - 80;
    this.height = 800 - 280;
    this.xScale = d3.scale.linear().range([0, this.width]);
    this.yScale = d3.scale.linear().range([0, this.height]);

    this.treemap = d3.layout.treemap()
        //.mode('slice-dice')
        .padding(1)
        .round(true)
        .size([this.width, this.height])
        //.sticky(true)
        .value(function(d) { return d.size; })
        .sort(function(a,b) {
            if(a.name.match('exempt')) { return 1; }
            else if(a.name.match('furloughed')) { return -1; }
            return a.value - b.value;
        });

    this.svg = d3.select("#furlough-map-container").append("div")
        .attr("class", "chart")
        .style({'width': this.width + 'px', 'height': this.height + 'px'})
        .append("svg:svg")
        .attr("width", this.width)
        .attr("height", this.height)
        .append("svg:g")
        .attr("transform", "translate(.5,.5)")

    this.$details = $('<div class="agency-details"></div>').appendTo('.chart')

    this.loadedData();
};
_.extend(Shutdown2013.FurloughMap.prototype, {
    loadData: function() {
        //d3.json('data/agencies.json', this.loadedData);
    },

    loadedData: function(data) {
        data = data || Shutdown2013.AGENCIES;
        this.node = data, this.root = data;
        data.children = data.children.sort(function(a,b) {
            var aTotal = 0, bTotal = 0;
            for(var i=0; i<a.children.length; i++) { aTotal += a.children[i].size; }
            for(var i=0; i<b.children.length; i++) { bTotal += b.children[i].size; }
            return bTotal - aTotal;
        });

        var nodes = this.treemap.nodes(this.root).filter(function(d) { return !d.children; });
        var nodeParents = this.getParents(nodes);
        //console.log(nodeParents);

        var parentCell = this.svg.selectAll('g.parentCell')
            .data(nodeParents)
            .enter().append("svg:g")
            .attr("class", "parentCell")
            .attr('data-staff', function(d) { return d.value })
            .attr('data-furloughed', function(d) { return d.children[0].value })
            .attr('data-exempt', function(d) { return d.children[1].value })

        var cell = this.svg.selectAll('g.parentCell').selectAll('g.cell')
            .data(function(d) { return d.children; })
            .enter().append('svg:g')
            .attr('class', 'cell')
            .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
            .on("click", _.bind(function(d) { return this.zoom(this.node == d.parent ? this.root : d.parent); }, this))
            .on('mouseover', function(d) {
                d3.select(this.parentNode).classed('active', true)
            })
            .on('mouseout', function(d) {
                d3.select(this.parentNode).classed('active', false)
            });

        cell.append("svg:rect")
            .attr("width", function(d) { return d.dx; })
            .attr("height", function(d) { return d.dy; })
            .attr('class', function(d) { return d.name; });

        cellText = parentCell.append("svg:text")
            .attr('class', 'abbrevText')
            .attr("x", function(d) { return d.dx / 2; })
            .attr("y", function(d) { return d.dy / 2; })
            .attr("dy", ".35em")
            .attr("text-anchor", "middle")
            .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
            .text(function(d) { return d.name; })
        cellText = this.abbrevText(cellText)

        parentCell.append("svg:text")
            .attr('class', 'fullText')
            .attr("x", function(d) { return d.dx / 2; })
            .attr("y", function(d) { return d.dy / 2; })
            .attr("dy", ".35em")
            .attr("text-anchor", "middle")
            .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
            .text(function(d) { return d.name; })
            .style("opacity", 0);

        this.$tip = $('div.tooltip')
        $('svg').on('mousemove', _.bind(this.makeTooltip, this))
            .on('mouseleave', _.bind(function() { this.$tip.hide();}, this))
            .on('mouseenter', _.bind(function() { this.$tip.show();}, this));


        d3.select(window).on("click", _.bind(function() { this.zoom(this.root); }, this));
    },
    getParents: function(nodes) {
        var parentNames = {}, nodeParents = [];
        for(var i= 0, len=nodes.length; i<len; i++) {
            if(!parentNames[nodes[i].parent.name]) {
                nodeParents.push(nodes[i].parent);
                parentNames[nodes[i].parent.name] = true;
            }
        }
        return nodeParents;
    },
    zoom: function(d) {
        var kx = this.width / d.dx, ky = this.height / d.dy, x = this.xScale, y = this.yScale;
        this.xScale.domain([d.x, d.x + d.dx]);
        this.yScale.domain([d.y, d.y + d.dy]);

        var t = this.svg.selectAll("g.cell").transition()
            .duration(d3.event.altKey ? 7500 : 750)
            .attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; });

        t.select("rect")
            .attr("width", function(d) { return kx * d.dx; })
            .attr("height", function(d) { return ky * d.dy; })

        var zoomDir = (d == this.root) ? 'out' : 'in';
        this.svg.selectAll("g.parentCell").select("text.abbrevText")
            .transition()
            .duration(d3.event.altKey ? 7500 : 750)
            .attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; })
            .attr("x", function(d) { return kx * d.dx / 2; })
            .attr("y", function(d) { return ky * d.dy / 2; })
            .style("opacity", function(d) { return zoomDir == 'out' ? 1 : 0; });

        this.svg.selectAll("g.parentCell").select("text.fullText")
            .transition()
            .duration(d3.event.altKey ? 7500 : 750)
            .attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; })
            .attr("x", function(d) { return kx * d.dx / 2; })
            .attr("y", function(d) { return ky * d.dy / 2; })
            .style("opacity", function(d) { return zoomDir == 'out' ? 0 : 1; });

        if(zoomDir == 'in') {
            this.$details.text(d.name).css({left: (this.width / 2) - 150});
            this.$details.show();
        } else { this.$details.hide(); }

        this.node = d;
        d3.event.stopPropagation();
    },
    abbrevText: function(cellText) {
        cellText
            //.filter(function(d) { return (this.getComputedTextLength() > d.dx); })
            .text(function(d) { return (d.abbreviations && d.abbreviations.length) ? d.abbreviations[0] : ''; })
            .filter(function(d) { return (this.getComputedTextLength() + 6 > d.dx); })
            .text(function(d) { return (d.abbreviations && d.abbreviations.length > 1) ? d.abbreviations[1] : ''; })
        return cellText
    },
    makeTooltip: function(e) {
        if(e.target != this.prevTarget) {
            this.prevTarget = e.target;
            var $target = $(e.target), $agency = $target.parents('g.parentCell');
            var agencyName = $agency.find('text.fullText').text();
            var nodeData = $agency.data();
            console.log(nodeData);
            this.$tip.html(agencyName + "<br />" + nodeData.staff);
        }

        var tipLeft = Math.max(e.pageX - 100, 20);
        this.$tip.css({top: e.pageY - 80, left: tipLeft})
    }

});

Shutdown2013.ServiceList = function(services) {
    this.services = services || Shutdown2013.SERVICES;
    this.$tip = $('.tooltip');
    _.bindAll(this, 'updateTip');
    this.render();
    return this;
};
_.extend(Shutdown2013.ServiceList.prototype, {
    render: function($container) {
        if(!$container) { $container = $('#services-container'); }
        var $servicesUl = $("<ul class='services'></ul>"), serviceItems = []
        serviceItems = _(this.services).map(function(service) {
            return $('<li></li>')
                .addClass('service ' + service.status)
                .text(service.name)
                .data('description', service.description);
//                    return ["<li class='service ", service.status, "'>", service.name, "</li>"].join('')
        })
        $container.html($servicesUl.html(serviceItems));
        $servicesUl.on('mousemove', this.updateTip)
            .on('mouseleave', _.bind(function() { this.$tip.hide();}, this))
            .on('mouseenter', _.bind(function() { this.$tip.show();}, this));
    },
    updateTip: function(e) {
        if(e.target != this.prevTarget) {
            this.prevTarget = e.target;
            var $target = $(e.target), description = $target.data('description');
            this.$tip.text(description);
        }
        this.$tip.css({top: e.pageY - 80, left: e.pageX - 100})
    }
});

Shutdown2013.StatsClock = function() {
    this.$duration = $('#shutdown-duration');
    this.$unpaid = $('#unpaid-salary');
    this.$food = $('#food-vouchers')
    this.beginDate = new Date(2013, 9, 1);
    setInterval(_.bind(this.update, this), 1000);
};
_.extend(Shutdown2013.StatsClock.prototype, {
    update: function() {
        var now = new Date(),
            dT = Math.floor((now - this.beginDate) / 1000),
            d = Math.floor(dT / (60 * 60 * 24)),
            h = Math.floor(dT / (60 * 60)) - (d * 24),
            m = Math.floor(dT / 60) - ((d * 24 * 60) + (h * 60)),
            s = dT - ((d * 24 * 60 * 60) + (h * 60 * 60) + (m * 60)),
            foodUnpaid = Math.floor((Shutdown2013.WIC_FOOD_COST_2012 / (365.25 * 24 * 60 * 60)) * dT);
        this.$duration.text('duration - ' + d + 'd : ' + h + 'h : ' + m + 'm : ' + s + 's');

        this.$food.text("WIC Food Vouchers Unpaid: $" + foodUnpaid.commafy());

        if(Shutdown2013.furloughMap.root.furloughed_total) {
            var furloughed = Shutdown2013.furloughMap.root.furloughed_total,
                avgSalary = Shutdown2013.AVG_SALARY,
                furlSalaryPerS = (avgSalary * furloughed) / (365.25 * 24 * 60 * 60),
                furlSalary = Math.floor(furlSalaryPerS * dT);
            this.$unpaid.text('est. unpaid salary: $' + furlSalary.commafy());
        }
    }
});

