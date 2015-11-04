(function() {
 
var d3dashboard = {};

d3dashboard.dataManager = function module() {
    var exports = {},
        dispatch = d3.dispatch('geoReady', 'dataReady', 'dataLoading'),
        data;
    d3.rebind(exports, dispatch, 'on');
    return exports;
}






var refugeeDataManager = d3dashboard.dataManager();




 
}());
