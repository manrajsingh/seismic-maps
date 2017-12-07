var map;

var charts_config = {
  sm:{
    "title": "MCER Response Spectrum",
    "data":[],
    "target":"sm_chart"
  },
  sd:{
    "title":"Design Response Spectrum",
    "data":[],
    "target":"sd_chart"
  }
};

var styles = {
  default: null,
  retro: [
          {elementType: 'geometry', stylers: [{color: '#ebe3cd'}]},
          {elementType: 'labels.text.fill', stylers: [{color: '#523735'}]},
          {elementType: 'labels.text.stroke', stylers: [{color: '#f5f1e6'}]},
          {
            featureType: 'administrative',
            elementType: 'geometry.stroke',
            stylers: [{color: '#c9b2a6'}]
          },
          {
            featureType: 'administrative.land_parcel',
            elementType: 'geometry.stroke',
            stylers: [{color: '#dcd2be'}]
          },
          {
            featureType: 'administrative.land_parcel',
            elementType: 'labels.text.fill',
            stylers: [{color: '#ae9e90'}]
          },
          {
            featureType: 'landscape.natural',
            elementType: 'geometry',
            stylers: [{color: '#dfd2ae'}]
          },
          {
            featureType: 'poi',
            elementType: 'geometry',
            stylers: [{color: '#dfd2ae'}]
          },
          {
            featureType: 'poi',
            elementType: 'labels.text.fill',
            stylers: [{color: '#93817c'}]
          },
          {
            featureType: 'poi.park',
            elementType: 'geometry.fill',
            stylers: [{color: '#a5b076'}]
          },
          {
            featureType: 'poi.park',
            elementType: 'labels.text.fill',
            stylers: [{color: '#447530'}]
          },
          {
            featureType: 'road',
            elementType: 'geometry',
            stylers: [{color: '#f5f1e6'}]
          },
          {
            featureType: 'road.arterial',
            elementType: 'geometry',
            stylers: [{color: '#fdfcf8'}]
          },
          {
            featureType: 'road.highway',
            elementType: 'geometry',
            stylers: [{color: '#f8c967'}]
          },
          {
            featureType: 'road.highway',
            elementType: 'geometry.stroke',
            stylers: [{color: '#e9bc62'}]
          },
          {
            featureType: 'road.highway.controlled_access',
            elementType: 'geometry',
            stylers: [{color: '#e98d58'}]
          },
          {
            featureType: 'road.highway.controlled_access',
            elementType: 'geometry.stroke',
            stylers: [{color: '#db8555'}]
          },
          {
            featureType: 'road.local',
            elementType: 'labels.text.fill',
            stylers: [{color: '#806b63'}]
          },
          {
            featureType: 'transit.line',
            elementType: 'geometry',
            stylers: [{color: '#dfd2ae'}]
          },
          {
            featureType: 'transit.line',
            elementType: 'labels.text.fill',
            stylers: [{color: '#8f7d77'}]
          },
          {
            featureType: 'transit.line',
            elementType: 'labels.text.stroke',
            stylers: [{color: '#ebe3cd'}]
          },
          {
            featureType: 'transit.station',
            elementType: 'geometry',
            stylers: [{color: '#dfd2ae'}]
          },
          {
            featureType: 'water',
            elementType: 'geometry.fill',
            stylers: [{color: '#b9d3c2'}]
          },
          {
            featureType: 'water',
            elementType: 'labels.text.fill',
            stylers: [{color: '#92998d'}]
          }
        ]};

(function(options){

  if(typeof options === 'undefined'){
    options = {
      siteClassSelector: "#site-class",
      referenceDocumentSelector: "#dcrd"
    }
  }
  else{
    options.siteClassSelector = (typeof options.siteClassSelector === undefined || options.siteClassSelector == null || options.siteClassSelector == '')?'#site-class':options.siteClassSelector;
    options.referenceDocumentSelector = (typeof options.referenceDocumentSelector === undefined || options.referenceDocumentSelector == null || options.referenceDocumentSelector == '')?'#dcrd':options.referenceDocumentSelector;

  }

  siteClasses = [
    { name: 'A - Hard Rock', value: 'A' },
    { name: 'B - Rock', value: 'B' },
    { name: 'B - Estimated (see Section 11.4.3)', value: 'B-estimated', hide_in_ref: ['asce7-10','asce41-13','nehrp-2009', 'ibc-2015', 'ibc-2012'] },
    { name: 'C - Very Dense Soil and Soft Rock', value: 'C' },
    { name: 'D - Stiff Soil', value: 'D' },
    { name: 'D - Default (See Section 11.4.3)', value: 'D-default', hide_in_ref: ['asce7-10','asce41-13','nehrp-2009', 'ibc-2015', 'ibc-2012'] },
    { name: 'E - Soft Clay Soil', value: 'E' },
    { name: 'F - Site Response Analysis', value: 'F' }
  ];

  var update_view = function(){
    selector = options.siteClassSelector;
    ref = $(options.referenceDocumentSelector).val();

    $(selector + " option").remove();
    siteClasses.forEach(function(i) {
      if(typeof i.hide_in_ref == 'undefined'){
        $(selector).append('<option value="'+i.value+'">'+i.name+'</option>');
      }
      else{
        if(i.hide_in_ref.indexOf(ref) == -1){
          $(selector).append('<option value="'+i.value+'">'+i.name+'</option>');
        }
      }
    });
    $(selector + ' option[value="D"]').prop('selected', true);

    //hide riskCategory if referenceDocument = asce41.
    if (["asce41"].indexOf(ref.substring(0,ref.indexOf('-'))) >= 0) {
      $("#risk-category").attr("disabled","disabled");
    }
    else{
      $("#risk-category").removeAttr("disabled");
    }

  };

  //listners
  $(options.referenceDocumentSelector).change(function (){
    update_view();
  });
  $(document).ready(function(){
    $(options.referenceDocumentSelector + ' option[value="asce7-10"]').prop('selected', true);
    update_view();
  });
})();

$(".searchbox").keyup(function(e){
  $(".searchbox").val($(this).val());
});


function initMap() {
  // Create the map with no initial style specified.
  // It therefore has default styling.
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 38.6120641, lng: -121.5083665 },
    zoom: 16,
    mapTypeControl: false
  });

  map.setOptions({styles: styles['retro']});
  var geocoder = new google.maps.Geocoder();

  $('<div/>').addClass('centerMarker').appendTo(map.getDiv())

  map_dragged = false;

  google.maps.event.addListener(map, 'drag', function() {
    $("#coords-display").html("Lat: " + map.getCenter().lat().toFixed(8) +", Lng: " + map.getCenter().lng().toFixed(8));
    map_dragged = true;
  });

  google.maps.event.addListener(map, 'zoom_changed', function() {
    if($('.map-img img').length > 0) {
      src = $(".map-img img").attr("src");
      $(".map-img img").attr("src",src.replace(/zoom=[0-9]+/, "zoom="+map.getZoom()));
    }
  });

  google.maps.event.addListener(map, 'idle', function() {
    $("#coords-display").html("Lat: " + map.getCenter().lat().toFixed(8) +", Lng: " + map.getCenter().lng().toFixed(8));
    if(map_dragged){
      $(".searchbox").val(map.getCenter().lat().toFixed(8) + ", " + map.getCenter().lng().toFixed(8));
      map_dragged = false;
    }
  });


  $('.searchbutton').click(function() {
    geocodeAddress(geocoder, map);
  });
  $('.searchbox').keypress(function(e) {
    var key = e.which || e.keyCode;
    if (key === 13) {
      geocodeAddress(geocoder, map);
    }
  });
}

function displayErrorNotification(title,message){
  $(".alerts-container").append('<div class="alert alert-danger" role="alert"><strong>' + title + "</strong><br>" + message + "</div>");
}

function clearErrorNotifications(){
  $(".alerts-container > .alert-danger").remove();
}

function geocodeAddress(geocoder, resultsMap) {
  clearErrorNotifications();
  $("#result").html('').hide();
  var address = $(".searchbox").val();

  if(address.length < 3){
    error_title = "Invalid Input";
    error_message = "Please provie a valid address or a valid latitude, longitude.";
    displayErrorNotification(error_title, error_message);
    return;
  }
  if($("#site-class").val() == 'F'){
    error_title = "Site Class: F";
    error_message = "A site response analysis shall be performed in accordance with ASCE/SEI 7 section 21.1 for structures on Site Class F sites. If your structure is exempted under ASCE/SEI 7 Section 20.3.1, select a substitute site class.";
    displayErrorNotification(error_title, error_message);
    return;
  }

  $("#result").html('<div style="text-align:center; margin-top:20px;"><img src="https://loading.io/spinners/hourglass/lg.sandglass-time-loading-gif.gif"></div>').show();
  $(".searchbox,.searchbutton").attr("disabled","disabled");
  $(".searchbutton").html("Searching ... ");

  if(address.search(/[a-zA-Z]/) < 0 && address.search(",") > 0 ){
    //Input is lat lng
    addressParts = address.split(',');
    lat = addressParts[0].trim();
    lng = addressParts[1].trim();
    formatted_address = "";
    map.setCenter({'lat': parseFloat(lat), 'lng': parseFloat(lng) });
    usgs_seismic_info(lat, lng, formatted_address);
  }
  else
  {
    geocoder.geocode({'address': address}, function(results, status) {
      if (status === 'OK') {
        resultsMap.setCenter(results[0].geometry.location);
        lat = results[0].geometry.location.lat();
        lng = results[0].geometry.location.lng();
        usgs_seismic_info(lat, lng, results[0].formatted_address);

      }
      else {
        displayErrorNotification('Geocode was not successful for the following reason: ', status);
        $(".searchbox,.searchbutton").removeAttr("disabled");
        $(".searchbutton").html("Search");
      }
    });
  }
}

function usgs_seismic_info(lat, lng, formatted_address){
  dcrd = $("#dcrd").val();
  riskCategory = $("#risk-category").val();
  siteClass = $("#site-class").val();
  if (["asce41"].indexOf(dcrd.substring(0,dcrd.indexOf('-'))) >= 0) {
    //Dont send risk category as part of param when ref document is asce41
    input = {latitude:lat, longitude: lng, siteClass: siteClass, title: "Seismic Maps"};
  }
  else{
    input = {latitude:lat, longitude: lng, riskCategory: riskCategory, siteClass: siteClass, title: "Seismic Maps"};
  }

  $.ajax({
        method: 'GET',
        dataType: 'json',
        url: 'https://earthquake.usgs.gov/ws/designmaps/'+ dcrd +'.json',
        data: input,
        success: function(data){
          if(data.request.status == "success"){

            if(["asce7","nehrp","ibc"].indexOf(dcrd.substring(0,dcrd.indexOf('-'))) >= 0){
              display_asce7_nehrp_ibc_info(lat, lng, formatted_address, data);
            }
            else if (["asce41"].indexOf(dcrd.substring(0,dcrd.indexOf('-'))) >= 0) {
              display_asce41_info(lat, lng, formatted_address, data);
            }

          }
          else{
             displayErrorNotification("USGS service returned the following error", data.response);
          }
          $(".searchbox,.searchbutton").removeAttr("disabled");
          $(".searchbutton").html("Search");
        },
        error: function(data){
          displayErrorNotification("USGS service returned the following error", data.status + " " + data.statusText + "<br>" + data.responseJSON.response );
          $("#result").html('').hide();
          $(".searchbox,.searchbutton").removeAttr("disabled");
          $(".searchbutton").html("Search");
        },
      });
}

function display_asce7_nehrp_ibc_info(lat,lng,formatted_address, usgs){
  usgsDate = new Date(usgs.request.date);
  source = $("#asce7-nehrp-ibc-result-template").html();
  template = Handlebars.compile(source);
  context = {
    project_title: $("#project-title").val(),
    dcrd: usgs.request.referenceDocument,
    riskCategory: usgs.request.parameters.riskCategory,
    siteClass: usgs.request.parameters.siteClass,
    dateTime: usgsDate.toLocaleDateString() + ", " + usgsDate.toLocaleTimeString(),
    formatted_address: formatted_address,
    latlng: lat + ", " + lng,
    mapZoom: map.getZoom(),
    ss: usgs.response.data.ss,
    s1: usgs.response.data.s1,
    s1rt: usgs.response.data.s1rt,
    s1uh: usgs.response.data.s1uh,
    s1d: usgs.response.data.s1d,
    pgad: usgs.response.data.pgad,
    pga: usgs.response.data.pga,
    sds: usgs.response.data.sds,
    sd1: usgs.response.data.sd1,
    sms: usgs.response.data.sms,
    sm1: usgs.response.data.sm1,
    sdc: usgs.response.data.sdc,
    fa: usgs.response.data.fa,
    fv: usgs.response.data.fv,
    fpga: usgs.response.data.fpga,
    pgam: usgs.response.data.pgam,
    ssrt: usgs.response.data.ssrt,
    ssuh: usgs.response.data.ssuh,
    ssd: usgs.response.data.ssd
  };

  $("#site-class option").each( function() {
    if($(this).val() == usgs.request.parameters.siteClass) {
      context.siteClass = $(this).html();
    }
  });

  for(key in usgs.response.data)
  {
    if(key.indexOf("_note")>0){
      error_key = key.replace("_note","");
      context[error_key] = usgs.response.data[key];

      switch(error_key){
        case 'fv':
          context.sd1 = usgs.response.data.sd1 + '  -' + usgs.response.data[key];
          context.sdc = usgs.response.data.sdc + '  -' + usgs.response.data[key];
          context.sm1 = usgs.response.data.sm1 + '  -' + usgs.response.data[key];
		      context.fv = usgs.response.data.fv + '  -' + usgs.response.data[key];
          break;
        case 'fa':
          context.sms = usgs.response.data.sms +'  -'+ usgs.response.data[key];
          context.sds = usgs.response.data.sds +'  -'+ usgs.response.data[key];
		      context.fa = usgs.response.data.fa +'  -'+ usgs.response.data[key];
      }
    }
  }

  var html = template(context);
  $("#result").html(html);

  if(usgs.response.data.sdSpectrum != null){
    sd_data = [["Period, T(sec)", "Sa(g)"]].concat(usgs.response.data.sdSpectrum);
    charts_config.sd.data = sd_data;
  }
  if(usgs.response.data.smSpectrum != null){
    sm_data = [["Period, T(sec)", "Sa(g)"]].concat(usgs.response.data.smSpectrum);
    charts_config.sm.data = sm_data
  }
  if(usgs.response.data.smSpectrum == null && usgs.response.data.sdSpectrum == null) {
    $(".spectrum-charts").hide();
  }
  else{
    makecharts();
    $(".spectrum-charts").show();
  }
}

function display_asce41_info(lat,lng,formatted_address, usgs){
  usgsDate = new Date(usgs.request.date);
  source = $("#asce41-result-template").html();
  template = Handlebars.compile(source);
  view_data =usgs.response.data;
  view_model = {
    "bse-2n":{
        "display": false,
        "hazardLevel": {"display": "Hazard Level", "description": "", "value": "BSE-2N"},
        "ss" : { "display": "ss", "description" : "spectral response (0.2 s)", "value": null },
        "s1" : { "display": "s1", "description" : "spectral response (1.0 s)", "value": null },
        "sxs" : { "display": "sxs", "description" : "site-modified spectral response (0.2 s)", "value": null },
        "sx1" : { "display": "sx1", "description" : "site-modified spectral response (1.0 s)", "value": null },
        "fa" : { "display": "fa", "description" : "site amplification factor (0.2 s)", "value": null },
        "fv" : { "display": "fv", "description" : "site amplification factor (1.0 s)", "value": null },
        "ssuh" : { "display": "ssuh", "description" : "max direction uniform hazard (0.2 s)", "value": null },
        "crs" : { "display": "crs", "description" : "coefficient of risk (0.2 s)", "value": null },
        "ssrt" : { "display": "ssrt", "description" : "risk-targeted hazard (0.2 s)", "value": null },
        "ssd" : { "display": "ssd", "description" : "deterministic hazard (0.2 s)", "value": null },
        "s1uh" : { "display": "s1uh", "description" : "max direction uniform hazard (1.0 s)", "value": null },
        "cr1" : { "display": "cr1", "description" : "coefficient of risk (1.0 s)", "value": null },
        "s1rt" : { "display": "s1rt", "description" : "risk-targeted hazard (1.0 s)", "value": null },
        "s1d" : { "display": "s1d", "description" : "deterministic hazard (1.0 s)", "value": null },


    },
    "bse-1n":{
        "display": false,
        "hazardLevel": {"display": "Hazard Level", "description": "", "value": "BSE-1N"},
        "sxs" : { "display": "sxs", "description" : "site-modified spectral response (0.2 s)", "value": null },
        "sx1" : { "display": "sx1", "description" : "site-modified spectral response (1.0 s)", "value": null },
    },
    "bse-2e":{
        "display": false,
        "hazardLevel": {"display": "Hazard Level", "description": "", "value": "BSE-2E"},
        "ss" : { "display": "ss", "description" : "spectral response (0.2 s)", "value": null },
        "s1" : { "display": "s1", "description" : "spectral response (1.0 s)", "value": null },
        "sxs" : { "display": "sxs", "description" : "site-modified spectral response (0.2 s)", "value": null },
        "sx1" : { "display": "sx1", "description" : "site-modified spectral response (1.0 s)", "value": null },
        "fa" : { "display": "fa", "description" : "site amplification factor (0.2 s)", "value": null },
        "fv" : { "display": "fv", "description" : "site amplification factor (1.0 s)", "value": null },
    },
    "bse-1e":{
        "display": false,
        "hazardLevel": {"display": "Hazard Level", "description": "", "value": "BSE-1E"},
        "ss" : { "display": "ss", "description" : "spectral response (0.2 s)", "value": null },
        "s1" : { "display": "s1", "description" : "spectral response (1.0 s)", "value": null },
        "sxs" : { "display": "sxs", "description" : "site-modified spectral response (0.2 s)", "value": null },
        "sx1" : { "display": "sx1", "description" : "site-modified spectral response (1.0 s)", "value": null },
        "fa" : { "display": "fa", "description" : "site amplification factor (0.2 s)", "value": null },
        "fv" : { "display": "fv", "description" : "site amplification factor (1.0 s)", "value": null },
    },
    "t-sub-l-data":{
      "display": false,
      "hazardLevel": {"display": "Hazard Level", "description": "", "value": "BSE-1E"},
      "t-sub-l" : { "display": "T-Sub-L", "description" : "Long-period transition period in seconds", "value": null },
    },
    "custom":{
        "display": false,
        "hazardLevel": {"display": "Hazard Level", "description": "", "value": ""},
        "customProbability" : { "display": "Custom Probability", "description" : "Decimal probability of exceedance in 50 years for target ground motion.", "value": null },
        "ss" : { "display": "ss", "description" : "spectral response (0.2 s)", "value": null },
        "fa" : { "display": "fa", "description" : "site amplification factor (0.2 s)", "value": null },
        "sxs" : { "display": "sxs", "description" : "site-modified spectral response (0.2 s)", "value": null },
        "s1" : { "display": "s1", "description" : "spectral response (1.0 s)", "value": null },
        "fv" : { "display": "fv", "description" : "site amplification factor (1.0 s)", "value": null },
        "sx1" : { "display": "sx1", "description" : "site-modified spectral response (1.0 s)", "value": null },
    },
  };

  for(arrItem in view_data){
    hzl = view_data[arrItem]["hazardLevel"].toLowerCase().replace(/\s+/,'-');
    view_model[hzl]["display"] = true;
    for(attr in view_model[hzl]){
      view_model[hzl][attr]["value"] = view_data[arrItem][attr];
    }
  }

  context = {
    project_title: $("#project-title").val(),
    dcrd: usgs.request.referenceDocument,
    riskCategory: usgs.request.parameters.riskCategory,
    siteClass: usgs.request.parameters.siteClass,
    dateTime: usgsDate.toLocaleDateString() + ", " + usgsDate.toLocaleTimeString(),
    formatted_address: formatted_address,
    latlng: lat + ", " + lng,
    data:view_model,
    mapZoom: map.getZoom()
  };

  $("#site-class option").each( function() {
    if($(this).val() == usgs.request.parameters.siteClass) {
      context.siteClass = $(this).html();
    }
  });

  for(key in usgs.response.data)
  {
    if(key.indexOf("_note")>0){
      error_key = key.replace("_note","");
      context[error_key] = usgs.response.data[key];

      switch(error_key){
        case 'fv':
          context.sd1 = usgs.response.data.sd1 + '  -' + usgs.response.data[key];
          context.sdc = usgs.response.data.sdc + '  -' + usgs.response.data[key];
          context.sm1 = usgs.response.data.sm1 + '  -' + usgs.response.data[key];
		      context.fv = usgs.response.data.fv + '  -' + usgs.response.data[key];
          break;
        case 'fa':
          context.sms = usgs.response.data.sms +'  -'+ usgs.response.data[key];
          context.sds = usgs.response.data.sds +'  -'+ usgs.response.data[key];
		      context.fa = usgs.response.data.fa +'  -'+ usgs.response.data[key];
      }
    }
  }

  var html = template(context);
  $("#result").html(html);
}

function makecharts(){
  google.charts.load('current', {'packages':['corechart','line']});
  google.charts.setOnLoadCallback(drawChart);
}

function drawChart() {
  for( d in charts_config){
    data = google.visualization.arrayToDataTable(charts_config[d].data);
    options = {
      title: charts_config[d].title,
      vAxis: { title: 'Sa(g)'},
      hAxis : {title: 'Period, T (sec)'},
      legend: {'position': 'bottom' }
    };
    chart = new google.visualization.LineChart(document.getElementById(charts_config[d].target));
    chart_print = new google.visualization.LineChart(document.getElementById(charts_config[d].target+"_print"));
    chart.draw(data, options);
    chart_print.draw(data, options);
  }
}

function print_map(){
    window.print();
}
