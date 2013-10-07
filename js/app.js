window.Shutdown2013 = {};

Shutdown2013.FurloughMap = function() {
    _.bindAll(this, 'render', 'zoom', 'abbrevText', 'updateTip');
    this.width = 1280 - 80;
    this.height = 800 - 280;
    this.xScale = d3.scale.linear().range([0, this.width]);
    this.yScale = d3.scale.linear().range([0, this.height]);

    this.legendText = [
        {'key': 'furloughed', 'name': "Furloughed Employees"},
        {'key': 'exempt_a', 'name': "Furlough-Exempt: Law enforcement, health & safety"},
        {'key': 'exempt_b', 'name': "Furlough-Exempt: Financed from available funds"},
        {'key': 'exempt_c', 'name': "Furlough-Exempt: Protecting life and property"},
        {'key': 'exempt_d', 'name': "Furlough-Exempt: Other/Unknown"}
    ];

    this.treemap = d3.layout.treemap()
        //.mode('slice-dice')
        .padding(1)
        .round(true)
        .size([this.width, this.height])
        .value(function(d) { return d.size; })
        .sort(function(a,b) {
            if(a.name.match('exempt')) { return 1; }
            else if(a.name.match('furloughed')) { return -1; }
            return a.value - b.value;
        });

    this.svg =  d3.select('#furlough-map-container .chart')
        .style({'width': this.width + 'px', 'height': this.height + 'px'})
        .append("svg:svg")
        .attr("width", this.width)
        .attr("height", this.height)
        .append("svg:g")
        .attr("transform", "translate(.5,.5)")

    this.$details = $('.chart .agency-details');
    this.tip = new Shutdown2013.Tooltip();
    this.render();
};
_.extend(Shutdown2013.FurloughMap.prototype, {
    render: function(data) {
        data = data || Shutdown2013.AGENCIES;
        this.node = data, this.root = data;
        data.children = data.children.sort(function(a,b) {
            var aTotal = 0, bTotal = 0;
            for(var i=0; i<a.children.length; i++) { aTotal += a.children[i].size; }
            for(var i=0; i<b.children.length; i++) { bTotal += b.children[i].size; }
            return bTotal - aTotal;
        });

        var nodes = this.treemap.nodes(this.root).filter(function(d) { return !d.children; }),
            nodeParents = this.getParents(nodes),
            parentCell = this.defineParentCell(nodeParents),
            cell = this.defineCell(),
            cellText = this.defineCellText(parentCell),
            $legend = $('#furlough-map-legend');

        $legend.find('.total-employees').text(this.root.value.commafy());
        $legend.find('.total-exempt').text((this.root.value - this.root.furloughed_total).commafy());
        $legend.find('.total-furloughed').text(this.root.furloughed_total.commafy());

        this.makeBottomLegend();

        $('svg').on('mousemove', this.updateTip)
            .on('mouseenter', this.updateTip)
            .on('mouseleave', this.tip.hide);


        d3.select(window).on("click", _.bind(function() { this.zoom(this.root); }, this));
    },
    defineParentCell: function(nodeParents) {
        return this.svg.selectAll('g.parentCell')
            .data(nodeParents)
            .enter().append("svg:g")
            .attr("class", "parentCell")
            .attr('data-agency', function(d) { return d.name })
            .attr('data-staff', function(d) { return d.value })
            .attr('data-furloughed', function(d) { return d.furloughed_total })
            .attr('data-exempt', function(d) { return d.exempt_total });
    },
    defineCell: function() {
        var cell = this.svg.selectAll('g.parentCell').selectAll('g.cell')
            .data(function(d) { return d.children; })
            .enter().append('svg:g')
            .attr('class', 'cell')
            .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
            .on("click", _.bind(function(d) { return this.zoom(this.node == d.parent ? this.root : d.parent); }, this))
            .on('mouseover', function(d) { d3.select(this.parentNode).classed('active', true) })
            .on('mouseout', function(d) { d3.select(this.parentNode).classed('active', false) });

        cell.append("svg:rect")
            .attr("width", function(d) { return d.dx; })
            .attr("height", function(d) { return d.dy; })
            .attr('class', function(d) { return d.name; });

        return cell;
    },
    defineCellText: function(cell) {
        var cellText = cell.append("svg:text")
            .attr('class', 'abbrevText')
            .attr("x", function(d) { return d.dx / 2; })
            .attr("y", function(d) { return d.dy / 2; })
            .attr("dy", ".35em")
            .attr("text-anchor", "middle")
            .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
            .text(function(d) { return d.name; })
        return this.abbrevText(cellText);
    },
    makeBottomLegend: function() {
        var $legendBottom = $('#furlough-legend-bottom');

        _(this.legendText).each(function(legendItem) {
            $legendBottom.append('<span class="legend-bottom-item"><span class="swatch swatch-' + legendItem.key + '">' +
                '</span><h6 class="' + legendItem.key +'">' + legendItem.name +'</h6></span>');
        })
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

        if(zoomDir == 'in') {
            this.makeDetails(d, this.$details);
            this.$details.slideDown();
            this.zoomed = true;
            this.tip.hide();
        } else {
            this.$details.slideUp();
            this.zoomed = false;
        }

        this.node = d;
        d3.event.stopPropagation();
    },
    makeDetails: function(d, $details) {
        $details.find('h3').text(d.name);
        var $staffPercent = $details.find('tr.agency-staff-percent td'),
            $staffCount = $details.find('tr.agency-staff-count td');
        $staffPercent.first().text(Math.round(100 * (d.exempt_total / d.value)) + "%");
        $staffPercent.last().text(Math.round(100 * (d.furloughed_total / d.value)) + "%");
        $staffCount.first().text(d.exempt_total.commafy());
        $staffCount.last().text(d.furloughed_total.commafy());

        $details.css({left: (this.width / 2) - 150});
        return this;
    },
    abbrevText: function(cellText) {
        cellText.text(function(d) { return (d.abbreviations && d.abbreviations.length) ? d.abbreviations[0] : ''; })
            .filter(function(d) { return (this.getComputedTextLength() + 4 > d.dx); })
            .text(function(d) { return (d.abbreviations && d.abbreviations.length > 1) ? d.abbreviations[1] : ''; })
            .filter(function(d) { return (this.getComputedTextLength() + 4 > d.dx); })
            .text('');

        return cellText
    },
    updateTip: function(e) {
        if(this.zoomed) {
            this.tip.hide();

        } else {
            if(e.target != this.prevTarget) {
                this.prevTarget = e.target;
                var $target = $(e.target), $agency = $target.parents('g.parentCell');
                var agencyName = $agency.find('text.fullText').text();
                var nodeData = $agency.data();

                var tipHtml = ['<h3>', nodeData.agency, '</h3>',
                    '<h6 class="text-red">', Math.round(100 * (nodeData.furloughed / nodeData.staff)), '% furloughed</h6>',
                    '<h6 class="text-gray"><em>click for details</em></h6>'].join('');
                this.tip.html(tipHtml);
            }
            this.tip.position(e).show();
        }

    }

});

Shutdown2013.ServiceList = function(services) {
    this.services = services || Shutdown2013.SERVICES;
    this.tip = new Shutdown2013.Tooltip();
    _.bindAll(this, 'updateTip');
    this.$container = $('#services-container');
    this.containers = {
        '$ok': this.$container.find('#services-ok'),
        '$risk': this.$container.find('#services-risk'),
        '$halted': this.$container.find('#services-halted')
    };
    this.render();
    return this;
};
_.extend(Shutdown2013.ServiceList.prototype, {
    render: function($container) {
        if(!$container) { $container = $('#services-container'); }
        //var $servicesUl = $("<ul class='services'></ul>"), serviceItems = []
//        serviceItems = _(this.services).map(function(service) {
//            return $('<li></li>')
//                .addClass('service ' + service.status)
//                .text(service.name)
//                .data('description', service.description);
//        });
        serviceItems = _(this.services).map(_.bind(function(service) {
            var li = $('<li></li>')
                .addClass('service ' + service.status)
                .text(service.name)
                .data('description', service.description);

            if(this.containers['$' + service.status]) {
                this.containers['$' + service.status].append(li);
            }
            return li;
        }, this));
        //$container.html($servicesUl.html(serviceItems));

        this.$container.on('mousemove', this.updateTip)
            .on('mouseenter', this.updateTip)
            .on('mouseleave', _.bind(function() { this.tip.hide();}, this));
    },
    updateTip: function(e) {
        if(e.target != this.prevTarget) {
            if(e.target.tagName != 'LI') { this.tip.hide(); return; }
            this.prevTarget = e.target;
            var $target = $(e.target), description = $target.data('description');
            this.tip.text(description);
        }
        this.tip.position(e).show();
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
        this.$duration.text(d + 'd : ' + h + 'h : ' + m + 'm : ' + s + 's');

        this.$food.text('$' + foodUnpaid.commafy());

        if(Shutdown2013.furloughMap.root.furloughed_total) {
            var furloughed = Shutdown2013.furloughMap.root.furloughed_total,
                avgSalary = Shutdown2013.AVG_SALARY,
                furlSalaryPerS = (avgSalary * furloughed) / (365.25 * 24 * 60 * 60),
                furlSalary = Math.floor(furlSalaryPerS * dT);
            this.$unpaid.text('$' + furlSalary.commafy());
        }
    }
});

Shutdown2013.Tooltip = function() {
    _.bindAll(this, 'show', 'hide', 'html', 'text', 'css', 'position');
    this.$tip = $('div.tooltip');
    this.width = 200;
};
_.extend(Shutdown2013.Tooltip.prototype, {
    show: function() { this.$tip.show(); return this; },
    hide: function() { this.$tip.hide(); return this; },
    html: function(html) { this.$tip.html(html); return this; },
    text: function(text) { this.$tip.text(text); return this; },
    css: function(css) { this.$tip.css(css); return this; },

    position: function(e) {
        var tipHeight = this.$tip.outerHeight(),
            windowWidth = $(window).width(),
            tipLeft = e.pageX - (this.width / 2),
            tipTop = e.pageY - (tipHeight + 15);
        tipLeft = Math.min(Math.max(tipLeft, 20), windowWidth - (this.width + 40));
        this.$tip.css({top: tipTop, left: tipLeft});
        return this;
    }
})
