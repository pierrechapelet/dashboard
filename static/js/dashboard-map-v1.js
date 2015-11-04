(function() {
 
  var width = 600;
  var height = 300;
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
          .scale(4000)
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

  d3.json('static/data/schools.geojson', function(req, geojson) {

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

    console.log(features);
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

  d3.select('.map-title').text('Field Directorates');
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
      d3.csv("static/data/sampledata.csv",function(res) { callback(null, res) });
    })
    .await(makeGraphs);

function makeGraphs(err, csvdata) {
  //console.log(csvdata);

  var donorschooseProjects = csvdata;
  var dateFormat = d3.time.format("%Y-%m-%d");
  donorschooseProjects.forEach(function(d) {
    //d["date_posted"] = dateFormat.parse(d["date_posted"]);
    //d["date_posted"].setDate(1);
    d["total_donations"] = +d["total_donations"];
    //d["total_price_excluding_optional_support"] = +d["total_price_excluding_optional_support"];
  });

  console.log(donorschooseProjects);

  var ndx = crossfilter(donorschooseProjects);


//var dateDim = ndx.dimension(function(d) { return d["date_posted"]; });
var resourceTypeDim = ndx.dimension(function(d) { return d["resource_type"]; });
var povertyLevelDim = ndx.dimension(function(d) { return d["poverty_level"]; });
var stateDim = ndx.dimension(function(d) { return d["school_state"]; });
var totalDonationsDim  = ndx.dimension(function(d) { return d["total_donations"]; });


var all = ndx.groupAll();
//var numProjectsByDate = dateDim.group(); 
var numProjectsByResourceType = resourceTypeDim.group();
var numProjectsByPovertyLevel = povertyLevelDim.group();
var totalDonationsByState = stateDim.group().reduceSum(function(d) {
    return d["total_donations"];
});
var totalDonations = ndx.groupAll().reduceSum(function(d) {return d["total_donations"];});

var max_state = totalDonationsByState.top(1)[0].value;
//var minDate = dateDim.bottom(1)[0]["date_posted"];
//var maxDate = dateDim.top(1)[0]["date_posted"];

//var timeChart = dc.barChart("#time-chart");
var resourceTypeChart = dc.rowChart("#resource-type-row-chart");
var povertyLevelChart = dc.rowChart("#poverty-level-row-chart");
//var usChart = dc.geoChoroplethChart("#us-chart");
var numberProjectsND = dc.numberDisplay("#number-projects-nd");
var totalDonationsND = dc.numberDisplay("#total-donations-nd");

numberProjectsND
    .formatNumber(d3.format("d"))
    .valueAccessor(function(d){return d; })
    .group(all);

totalDonationsND
    .formatNumber(d3.format("d"))
    .valueAccessor(function(d){return d; })
    .group(totalDonations)
    .formatNumber(d3.format(".3s"));

/*timeChart
    .width(600)
    .height(160)
    .margins({top: 10, right: 50, bottom: 30, left: 50})
    .dimension(dateDim)
    .group(numProjectsByDate)
    .transitionDuration(500)
    .x(d3.time.scale().domain([minDate, maxDate]))
    .elasticY(true)
    .xAxisLabel("Year")
    .yAxis().ticks(4);
    */

resourceTypeChart
    .width(300)
    .height(250)
    .dimension(resourceTypeDim)
    .group(numProjectsByResourceType)
    .xAxis().ticks(4);

povertyLevelChart
    .width(300)
    .height(250)
    .dimension(povertyLevelDim)
    .group(numProjectsByPovertyLevel)
    .xAxis().ticks(4);

/*usChart.width(1000)
    .height(330)
    .dimension(stateDim)
    .group(totalDonationsByState)
    .colors(["#E2F2FF", "#C4E4FF", "#9ED2FF", "#81C5FF", "#6BBAFF", "#51AEFF", "#36A2FF", "#1E96FF", "#0089FF", "#0061B5"])
    .colorDomain([0, max_state])
    .overlayGeoJson(statesJson["features"], "state", function (d) {
        return d.properties.name;
    })
    .projection(d3.geo.albersUsa()
                .scale(600)
                .translate([340, 150]))
    .title(function (p) {
        return "State: " + p["key"]
                + "\n"
                + "Total Donations: " + Math.round(p["value"]) + " $";
    })

*/
    dc.renderAll();
    








}








 
}());







