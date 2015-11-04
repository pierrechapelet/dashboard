(function() {
 
/**********************************
* LOAD DATASETS BEFORE RENDERING GRAPHS                    
**********************************/
queue()
    .defer(function(callback) {
      d3.json("/emisdata/schools",function(res) { callback(null, res) });
    })
    .defer(function(callback) {
      d3.json("static/data/directorates.geojson",function(res) { callback(null, res) });
    })
    .await(makeGraphs);

/**********************************
* THEN RENDER INTERACTIVE DC.JS SCHOOL GRAPHS                    
**********************************/    

function makeGraphs(err, schooldata, directoratesJson) {
  //console.log(csvdata);
  //console.log(directoratesJson);

  // CLEAN DATASET
  var schoolrecords = schooldata;
  schoolrecords.forEach(function(d) {
    d["NbStudents"] = +d["NbStudents"];
    d["YearCreation"] = +d["YearCreation"];
    //test
    d["NbMaleStudents"] = +d["NbMaleStudents"];
    d["NbFemaleStudents"] = +d["NbFemaleStudents"];
  });

  console.log(schoolrecords);
  
  // CREATE CROSSFILTER
  var ndx = crossfilter(schoolrecords);
  var all = ndx.groupAll();

  // DEFINE CROSSFILTER DIMENSIONS
  var ownershipDim =  ndx.dimension(function(d) { return d["Ownership"]; });
  var genderDim = ndx.dimension(function(d) { return d["Gender"]; });
  var authorityDim = ndx.dimension(function(d) { return d["Authority"]; });
  var regionDim = ndx.dimension(function(d) { return d["RegionClassification"]; });
  var geoDim = ndx.dimension(function(d) { return d["Admin3"]; });
  var creationyearDim = ndx.dimension(function(d) { return d["YearCreation"]; });
  var shiftDim = ndx.dimension(function(d) { return d["SchoolPeriod"]; });

  // DEFINE CROSSFILTER FILTERS
  var numSchoolsByGender = genderDim.group();
  var numSchoolsByOwnership = ownershipDim.group();
  var numSchoolsByAuthority = authorityDim.group();
  var numSchoolsByRegion = regionDim.group();
  var numSchoolsByGeography = geoDim.group();
  var numSchoolsByCreationYear = creationyearDim.group();
  var numSchoolsByShift = shiftDim.group();
  
  // generate cumulative counts. see https://groups.google.com/forum/#!topic/dc-js-user-group/W9AvkP_dZ0U
  var _cumulativeSchoolsByYear = creationyearDim.group().reduceSum(function(d){return 1;});
  var cumulativeSchoolsByYear = {
    all:function () { 
      var cumulate = 0; 
      var g = []; 
      _cumulativeSchoolsByYear.all().forEach(function(d,i) { 
      cumulate += d.value; 
      g.push({key:d.key,value:cumulate}) 
      }); 
    return g; 
    } 
  };
  // CREATE REUSABLE FUNCTIONS TO SUM COLUMNS VALUES
  function reduceFieldsAdd(fields) {
      return function(p, v) {
          fields.forEach(function(f) {
              //console.log(p);
              //console.log(v);
              p[f] += v[f];
          });
          return p;
      };
  }
  function reduceFieldsRemove(fields) {
      return function(p, v) {
          fields.forEach(function(f) {
              p[f] -= v[f];
          });
          return p;
      };
  }
  function reduceFieldsInitial(fields) {
      return function() {
          var ret = {};
          fields.forEach(function(f) {
              ret[f] = 0;
          });
          return ret;
      };
  }

  // SUM DATASET COLUMNS BASED ON SCHOOL FILTERS
  var fields = ['NbMaleStudents', 'NbFemaleStudents']; // whatever fields you need
  // TRICK: we map reduce by a dimension to get the number:
  var SumFieldsValues = ndx.groupAll().reduce(reduceFieldsAdd(fields), reduceFieldsRemove(fields), reduceFieldsInitial(fields)); 
  
  // COUNT SCHOOLS BASED ON FILTERS
  var totalschools = ndx.groupAll().reduceSum(function(d) {return 1;});


  //
  //
  // SCHOOL CHARTS
  //
  //

  //We define the charts location
  var jordanChart = dc.geoChoroplethChart("#jordan-map");
  var totalschoolsChart = dc.numberDisplay("#total-schools-nb");
  var regionChart = dc.pieChart("#region-pie-chart");
  var schoolsbyyearChart = dc.lineChart("#schoolsbyyear-linechart");
  var genderChart = dc.pieChart("#gender-pie-chart");
  var ownershipChart = dc.pieChart("#ownership-pie-chart");
  var authorityChart = dc.pieChart("#authority-pie-chart");
  var shiftChart = dc.pieChart("#shift-pie-chart");

  // Trick: we create virtual charts containing the values for Students and Staffs - temp: to render #totalsum-stud-nb
  var virtualchart_totalFemaleStudents = dc.numberDisplay("#no-render");
  var virtualchart_totalMaleStudents = dc.numberDisplay("#no-render");
  

  //We define the charts settings

  // Numbers
  totalschoolsChart
    .formatNumber(d3.format("d"))
    .valueAccessor(function(d){return d; })
    .group(all);
  //.valueAccessor(function(d){return d; })
  //.group(totalstudents)
  //.formatNumber(d3.format(".3s"));

  //A pie chart
  ownershipChart
  .height(150)
  .width(150)
  .radius(70)
  .innerRadius(20)
  .transitionDuration(1000)
  .dimension(ownershipDim)
  .group(numSchoolsByOwnership);

  //A pie chart
  genderChart
  .height(150)
  .width(150)
  .radius(70)
  .innerRadius(20)
  .transitionDuration(1000)
  .dimension(genderDim)
  .group(numSchoolsByGender);

  //A pie chart
  authorityChart
  .height(150)
  .width(150)
  .radius(70)
  .innerRadius(20)
  .transitionDuration(1000)
  .dimension(authorityDim)
  .group(numSchoolsByAuthority);

  //A pie chart
  regionChart
  .height(100)
  .width(100)
  .radius(40)
  .innerRadius(0)
  .transitionDuration(1000)
  .dimension(regionDim)
  .group(numSchoolsByRegion)
  .on("filtered", function(chart, filter){
    //console.log(chart);
    //console.log(filter);
  });

  //A pie chart
  shiftChart
  .height(150)
  .width(150)
  .radius(70)
  .innerRadius(20)
  .transitionDuration(1000)
  .dimension(shiftDim)
  .group(numSchoolsByShift);

  // the jordan map
  jordanChart
    .width(500)
    .height(400)
    .dimension(geoDim)
    .group(numSchoolsByGeography)
    .colors(["#E2F2FF", "#C4E4FF", "#9ED2FF", "#81C5FF", "#6BBAFF", "#51AEFF", "#36A2FF", "#1E96FF", "#0089FF", "#0061B5"])
    .colorDomain([0, 1000])
    .overlayGeoJson(directoratesJson["features"], "areaeducid", function (d) {
        return d.properties.GOV_E;
    })
    .projection(d3.geo.mercator()
                .center([38, 31.50])
                .scale(5000)
                .translate([340, 150]))
    .title(function (p) {
        return "State: " + p["key"]
                + "\n"
                + "Total Schools: " + Math.round(p["value"]) + " $";
              });

  // School by year line chart
  schoolsbyyearChart
        .renderArea(true)
        .width(400)
        .height(250)
        .transitionDuration(1000)
        .margins({top: 30, right: 20, bottom: 25, left: 40})
        .dimension(creationyearDim)
        .mouseZoomable(false)
        // Specify a "range chart" to link its brush extent with the zoom of the current "focus chart".
        //.rangeChart(genderChart)
        .x(d3.scale.linear().domain([1990, 2014]))
        //.x(d3.time.scale().domain([new Date(1985, 0, 1), new Date(2012, 11, 31)]))
        .xUnits(d3.time.years)
        .elasticY(true)
        .renderHorizontalGridLines(true)
    //##### Legend

        // Position the legend relative to the chart origin and specify items' height and separation.
        ///.legend(dc.legend().x(800).y(10).itemHeight(13).gap(5))
        .brushOn(true)
        // Add the base layer of the stack with group. The second parameter specifies a series name for use in the
        // legend.
        // The `.valueAccessor` will be used for the base layer
        .group(cumulativeSchoolsByYear, 'Total number of schools')
        //.valueAccessor(function (d) {
        //    return d.value.cumulnbschool;
        //})
        // Stack additional layers with `.stack`. The first paramenter is a new group.
        // The second parameter is the series name. The third is a value accessor.
        //.stack(doubleshifted, 'Double Shifted Schools', function (d) {
        //    return d.value;
        //})
        // Title can be called by any stack layer.
        .title(function (d) {
            var value = d.value ? d.value : d.value;
            if (isNaN(value)) {
                value = 0;
            }
            return d.key + '\n' + value;
        })
        .xAxis().ticks(5).tickFormat(d3.format("d"))
        ;


  //
  // Virtual CHARTS 
  //
  //
  virtualchart_totalFemaleStudents
    .valueAccessor(function(d){
      //console.log(d);
      return d.NbFemaleStudents; })
    .group(SumFieldsValues)
    .on("renderlet", function(chart, filter){
      testfunction(chart);
    });

  virtualchart_totalMaleStudents
    .valueAccessor(function(d){
      //console.log(d);
      return d.NbMaleStudents; })
    .group(SumFieldsValues)
    .on("renderlet", function(chart, filter){
      testfunction(chart);
    });


  

  dc.renderAll();

  function testfunction(d) {
      console.log("test function was called");
      console.log(virtualchart_totalFemaleStudents.data());
      console.log(virtualchart_totalMaleStudents.data());


  }



    
}

 
}());







