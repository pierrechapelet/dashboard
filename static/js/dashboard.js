(function() {
 
  var width = 800;
  var height = 300;
 

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
          .scale(6000)
          .translate([width / 2, height / 2]);
 
  path.projection(projection); // We assign projection to path
 
  /*
   * We create a new svg element at the root of div #grid-1-1
   */
  var svg = d3.select('#map').append("svg")
      .attr("width", width)
      .attr("height", height);
 
  /*
   * We create a SVG group to store all our directorates 
   */
  var directorates = svg
      .append("g")
      .attr("id", "departements");

  var schools = svg
      .append("g")
      .attr("id", "schools")
 
  /*
   * We load the geojson file for directorates
   */
  d3.json('static/geojson/directorates.geojson', function(req, geojson) {
 
    /*
     * We "bind" one SVG path element for each record in the "features" table of our geojson object 
     */
    var features = directorates
            .selectAll("path")
                .data(geojson.features);
    /*
     * For each record in "features"
     * we create a SVG path with basic properties and link it to directorateClickHandler event
     */
    features.enter()
        .append("path")
            .attr('class', 'directorate')
            .attr('fill', "#ccc")
            .attr("stroke", "#fff")
          .attr("d", path)
          .on('click', directorateClickHandler);
 
  });

  /*
   * We load the geojson file for schools
   */
  d3.json('static/geojson/schools.geojson', function(req, geojson) {

    var features = schools
            .selectAll("path")
                .data(geojson.features);

    features.enter()
        .append("circle")
            .attr('class', 'schools')
            .attr("transform", function(d) { return "translate(" + path.centroid(d) + ")"; })
            .attr("r", 0.4)
            .style("fill", "stellblue")
            .style("fill-opacity", 0.8)
            .style("stroke", "grey")
            .style("stroke-width", 0.1)
          .attr("d", path);
  });


  /*
   * Zooming function Fonction qui permet de zoomer sur la carte
   * en cliquant sur les départements
   * Récupéré ici : http://bl.ocks.org/mbostock/2206340
   */
  var centered;
  function directorateClickHandler(d) {
    var x, y, k;
 
    if (d && centered !== d) {
            var centroid = path.centroid(d);
            x = centroid[0];
            y = centroid[1];
            k = 5;
            centered = d;

        } else {
            x = width / 2;
            y = height / 2;
            k = 1;
            centered = null;
        }
 
        directorates.selectAll("path")
            .classed("active", centered && function(d) { return d === centered; });
 
        var trStr = "translate(" + width / 2 + "," + height / 2 + ")" +
            "scale(" + k + ")translate(" + -x + "," + -y + ")";
         
        directorates.transition()
            .duration(1000)
            .attr("transform", trStr);

        schools.transition()
            .duration(1000)
            .attr("transform", trStr);

        
 
    };
 
/**********************************
* OTHER GRAPHS                    *
**********************************/






}());







