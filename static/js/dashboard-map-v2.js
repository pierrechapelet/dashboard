(function() {
 
  var width = 600;
  var height = 240;
  var active = d3.select(null);


/**********************************
* MAIN MAP                        *
**********************************/

 
  /* 
   * We create a path object to play with geographic data
   */
  var path = d3.geo.path();
 
  // We define projection properties
  var projection = d3.geo.mercator() // mercator
          .center([36.179, 31.00]) // we center map on Jordan
          .scale(3500)
          .translate([width / 2, height / 2]);

  var zoom = d3.behavior.zoom()
    .translate([0, 0])
    .scale(1)
    .scaleExtent([1, 8])
    .on("zoom", zoomed);
 
  path.projection(projection); // We assign projection to path
 
  /*
   * We create a new svg element at the root of div #grid-1-1
   */
  var svg = d3.select('#map').append("svg")
      .attr("width", width)
      .attr("height", height)
      .on("click", stopped, true);

  svg.append("rect")
    .attr("class", "background")
    .attr("width", width)
    .attr("height", height)
    .on("click", reset);
 
  /*
   * We create 2 SVG groups to store all our directorates and schools
   */
  var directorates = svg
      .append("g")
      .attr("id", "departements");

  var schools = svg
      .append("g")
      .attr("id", "schools")

  directorates
    .call(zoom) // delete this line to disable free zooming
    .call(zoom.event);
 
  /*
   * We load the geojson file for directorates
   */
  d3.json('static/data/directorates.geojson', function(req, geojson) {
    /*
     * We "bind" one SVG path element for each record in the "features" table of our geojson object 
     */
    var features = directorates
            .selectAll("path")
                .data(geojson.features);
    /*
     * For each record in "features"
     * we create a SVG path element
     */
    features.enter()
        .append("path")
            .attr('class', 'directorate')
            .attr('fill', "#ccc")
            .attr("stroke", "#fff")
          .attr("d", path)
          .on('click', clickedOndirectorate);
  });

  /*
   * We load the geojson file for schools
   */
var color = d3.scale.ordinal()
  .domain(['public', 'private'])
  .range(['black','red']);

  d3.json('static/data/schoolsdata.geojson', function(req, geojson) {

    var features = schools
            .selectAll("path")
                .data(geojson.features);

    /*
     * For each record in the "features"
     Pour chaque entrée du tableau feature, on
     * créait un élément SVG path, avec les
     * propriétés suivantes
     */
    features.enter()
        .append("circle")
            .attr('class', 'schools')
            .attr("transform", function(d) { return "translate(" + path.centroid(d) + ")"; })
            .attr("r", 0.4)
            .style("fill", function(d, i) {return color(d.properties.Sector); })
            .style("fill-opacity", 1)
            .style("stroke", "grey")
            .style("stroke-width", 0.1)
            .attr("d", path);
            //.on('click', clicked);

    //console.log(features);
  });

/*
 * On directorate=> click event
 */
function clickedOndirectorate(d) {
  if (active.node() === this) return reset();
  active.classed("active", false);
  active = d3.select(this).classed("active", true);

  var bounds = path.bounds(d),
      dx = bounds[1][0] - bounds[0][0],
      dy = bounds[1][1] - bounds[0][1],
      x = (bounds[0][0] + bounds[1][0]) / 2,
      y = (bounds[0][1] + bounds[1][1]) / 2,
      scale = 0.9 / Math.max(dx / width, dy / height),
      translate = [width / 2 - scale * x, height / 2 - scale * y];

  svg.transition()
      .duration(750)
      .call(zoom.translate(translate).scale(scale).event);

  //console.log(d);

  d3.select('.map-title').text(d.properties.GOV_E);

}

/*
 * reset selected directorate to null
 */
function reset() {
  active.classed("active", false);
  active = d3.select(null);

  svg.transition()
      .duration(750)
      .call(zoom.translate([0, 0]).scale(1).event);

  d3.select('.map-title').text('Jordan');
}

/*
 * zoom function
 */
function zoomed() {
  directorates.style("stroke-width", 1.5 / d3.event.scale + "px");
  directorates.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
  schools.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
  //schools.style("stroke-width", 10 / d3.event.scale + "px");
  //var test=d3.select("circle").transition().attr("r", 5);
  //console.log(test);
}

// If the drag behavior prevents the default click,
// also stop propagation so we don’t click-to-zoom.
function stopped() {
  if (d3.event.defaultPrevented) d3.event.stopPropagation();
}


/**********************************
* OTHER GRAPHS                    *
**********************************/
queue()
    .defer(function(callback) {
      d3.csv("static/data/schoolsdata.csv",function(res) { callback(null, res) });
    })
    .defer(function(callback) {
      d3.json("static/data/directorates.geojson",function(res) { callback(null, res) });
    })
    .await(makeGraphs);

function makeGraphs(err, csvdata, directoratesJson) {
//console.log(csvdata);
console.log(directoratesJson);

  var schoolrecords = csvdata;
  schoolrecords.forEach(function(d) {
    d["RefHP14"] = +d["RefHP14"];
    d["RefLP14"] = +d["RefLP14"];
    d["RefSC14"] = +d["RefSC14"];
    d["TotRef14"] = +d["TotRef14"];
    d["TotStud14"] = +d["TotStud14"];
    d["openyear"] = +d["openyear"];
  });

  //console.log(schoolrecords);
  

  var ndx = crossfilter(schoolrecords);
  var directorateDim = ndx.dimension(function(d) { return d["areaeducid"]; });
  var sectorDim =  ndx.dimension(function(d) { return d["Sector"]; });
  var genderDim =  ndx.dimension(function(d) { return d["genderid"]; });
  var ownershipDim = ndx.dimension(function(d) { return d["ownerid"]; });
  var providerDim = ndx.dimension(function(d) { return d["provider"]; });
  var openingdateDim = ndx.dimension(function(d) { return d["openyear"]; });
  var totalstudentsDim = ndx.dimension(function(d) { return d["TotStud14"]; });
  var totalrefugeesDim = ndx.dimension(function(d) { return d["TotRef14"]; });

  var all = ndx.groupAll();

  var numSchoolsByDirectorate = directorateDim.group();
  var numSchoolsBySector = sectorDim.group();
  var numSchoolsByGender = genderDim.group();
  var numSchoolsByOwnership = ownershipDim.group();
  var numSchoolsByProvider = providerDim.group();
  var numSchoolsByYear = openingdateDim.group();

  //var totalstudentsByDirectorate = directorateDim.group().reduceSum(function(d) { return d["TotStud14"];});
  //var totalstudentsBySector = sectorDim.group().reduceSum(function(d) { return d["TotStud14"];});
  //var totalrefugeesBySector = sectorDim.group().reduceSum(function(d) { return d["TotRef14"];});

  var totalstudents = ndx.groupAll().reduceSum(function(d) { return d["TotStud14"];});
  var totalrefugees = ndx.groupAll().reduceSum(function(d) { return d["TotRef14"];});

  //We define the charts location
  var sectorChart = dc.pieChart("#sector-pie-chart");
  var genderChart = dc.pieChart("#gender-pie-chart");
  var ownershipChart = dc.pieChart("#ownership-row-chart");
  var providerChart = dc.barChart("#provider-row-chart");
  var totalstudentsChart = dc.numberDisplay("#total-students-nb");
  var totalrefugeesChart = dc.numberDisplay("#total-refugees-nb");
  //var schoolsbyyearChart = dc.lineChart("numSchoolsByYear-line-chart");
  var jordanChart = dc.geoChoroplethChart("#map-chart");

  //We define the charts settings

  // Numbers
  totalstudentsChart
  .formatNumber(d3.format("d"))
  .valueAccessor(function(d){return d; })
  .group(totalstudents)
  .formatNumber(d3.format(".3s"));

  totalrefugeesChart
  .formatNumber(d3.format("d"))
  .valueAccessor(function(d){return d; })
  .group(totalrefugees)
  .formatNumber(d3.format(".3s"));

  //A pie chart
  ownershipChart
  .height(220)
  //.width(350)
  .radius(90)
  .innerRadius(40)
  .transitionDuration(1000)
  .dimension(ownershipDim)
  .group(numSchoolsByOwnership);

  //A pie chart
  sectorChart
  .height(220)
  //.width(350)
  .radius(90)
  .innerRadius(40)
  .transitionDuration(1000)
  .dimension(sectorDim)
  .group(numSchoolsBySector);

  //A pie chart
  genderChart
  .height(220)
  //.width(350)
  .radius(90)
  .innerRadius(40)
  .transitionDuration(1000)
  .dimension(genderDim)
  .group(numSchoolsByGender);

  //A bar chart
  providerChart
  //.width(800)
  .height(220)
  .transitionDuration(1000)
  .dimension(providerDim)
  .group(numSchoolsByProvider)
  .margins({top: 10, right: 50, bottom: 30, left: 50})
  .centerBar(false)
  .gap(5)
  .elasticY(true)
  .x(d3.scale.ordinal().domain(providerDim))
  .xUnits(dc.units.ordinal)
  .renderHorizontalGridLines(true)
  .renderVerticalGridLines(true)
  .ordering(function(d){return d.value;})
  .yAxis().tickFormat(d3.format("s"));

  //Define threshold values for data (to b used for the line chart by year)
  //var minDate = ownershipDim.bottom(1)[0].openyear;
  //var maxDate = ownershipDim.top(1)[0].openyear;

  //console.log(minDate);
  //console.log(maxDate);

  //A line chart
  //schoolsbyyearChart
  ///.width(600)
  //.height(220)
  //.margins({top: 10, right: 50, bottom: 30, left: 50})
  //.dimension(openingdateDim)
  //.group(numSchoolsByYear)
  //.renderArea(true)
  //.transitionDuration(500)
  //.x(d3.time.scale().domain([minDate, maxDate]))
  //.elasticY(true)
  //.renderHorizontalGridLines(true)
  //.renderVerticalGridLines(true)
  //.xAxisLabel("Year")
  //.yAxis().ticks(6);

  jordanChart.width(1000)
    .height(330)
    .dimension(directorateDim)
    .group(numSchoolsByDirectorate)
    .colors(["#E2F2FF", "#C4E4FF", "#9ED2FF", "#81C5FF", "#6BBAFF", "#51AEFF", "#36A2FF", "#1E96FF", "#0089FF", "#0061B5"])
    .colorDomain([0, 1000])
    .overlayGeoJson(directoratesJson["features"], "areaeducid", function (d) {
        return d.properties.GOV_E;
    })
    .projection(d3.geo.mercator()
                .center([39, 31.00])
                .scale(3500)
                .translate([340, 150]))
    .title(function (p) {
        return "State: " + p["key"]
                + "\n"
                + "Total Donations: " + Math.round(p["value"]) + " $";
              });

  dc.renderAll();




    
}

 
}());







