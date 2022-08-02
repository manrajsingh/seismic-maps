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

  var urlParams = {
    "ref": "",
    "risk-category": "",
    "site-class": "",
    "title": "",
    "location": ""
  };


  var update_view = function(){
    selector = options.siteClassSelector;
    ref = $(options.referenceDocumentSelector).val();

    var match,
        pl     = /\+/g,  // Regex for replacing addition symbol with a space
        search = /([^&=]+)=?([^&]*)/g,
        decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
        query  = window.location.search.substring(1);

    while (match = search.exec(query)){
      urlParams[decode(match[1])] = decode(match[2]);
    }


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

    //default risk category
    $("#risk-category option[value='II']").prop('selected', true);

    if(urlParams["site-class"] == ""){
      $(selector + ' option[value="D-default"]').prop('selected', true);
    }

    if(urlParams["location"] != ""){
      $(".searchbox").val(urlParams["location"]);
      if(urlParams["ref"] != ""){
        $("#dcrd option[value="+ urlParams["ref"].toLowerCase() +"]").prop('selected', true);
      }
      if(urlParams["title"] != ""){
        $("#project-title").val(urlParams["title"]);
      }
      if(urlParams["risk-category"] != ""){
        $("#risk-category option[value="+ urlParams["risk-category"].toUpperCase() +"]").prop('selected', true);
      }
      if(urlParams["site-class"] != ""){
        $("#site-class option[value="+ urlParams["site-class"].toUpperCase() +"]").prop('selected', true);
      }
      $(".searchbutton").click();
    }
    ref = $(options.referenceDocumentSelector).val();
    //hide riskCategory if referenceDocument = asce41.
    if (["asce41"].indexOf(ref.substring(0,ref.indexOf('-'))) >= 0) {
      $("#risk-category").attr("disabled","disabled");
      $(".input-risk-category").hide();
      $(".input-custom-probability").show();
    }
    else{
      $("#risk-category").removeAttr("disabled");
      $(".input-risk-category").show();
      $(".input-custom-probability").hide();
    }

    input_boxes_view();

  };


  //listners
  $(options.referenceDocumentSelector).change(function (){
    update_view();
  });

  $(".input-coords").keyup(function(){
    this.value = this.value.replace(/[^0-9\.-]/g,'');
  })

  $(".searchbox").keyup(function(e){
    $(".searchbox").val($(this).val());
  });

  $(document).ready(function(){
    $(options.referenceDocumentSelector + ' option[value="asce7-16"]').prop('selected', true);
    
    $("[name=searchby]").on("change", function(){
      input_boxes_view();
      //console.log($("[name=searchby]:checked").val());
    });

    update_view();

  });



})();



function input_boxes_view(){
  switch($("[name=searchby]:checked").val()){
      case "address":
        $(".input-coords").hide();
        $(".input-address").show();
        break;
      case "coords":
        $(".input-coords").show();
        $(".input-address").hide();
        break;
    }
}

function asce7_41_result_view(){
  if (["asce41"].indexOf(ref.substring(0,ref.indexOf('-'))) >= 0) {
      $("#risk-category").attr("disabled","disabled");
      $(".input-risk-category").hide();
      $(".input-custom-probability").show();
    }
    else{
      $("#risk-category").removeAttr("disabled");
      $(".input-risk-category").show();
      $(".input-custom-probability").hide();
    }
}

function initMap() {
  // Create the map with no initial style specified.
  // It therefore has default styling.
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 38.6120641, lng: -121.5083665 },
    zoom: 16,
    mapTypeControl: true
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
      $("[value=coords]").click();
      $(".input-latitude").val( map.getCenter().lat().toFixed(8));
      $(".input-longitude").val( map.getCenter().lng().toFixed(8));
      map_dragged = false;
    }
  });

  var panorama = map.getStreetView();
  google.maps.event.addListener(panorama, 'visible_changed', function() {
    if (panorama.getVisible()) {
        $(".centerMarker").hide();
    } else {
        $(".centerMarker").show();
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

  var address = ($("[name=searchby]:checked").val() == "address")?$(".searchbox").val():$(".input-latitude").val() +","+ $(".input-longitude").val();
  if($("[name=searchby]:checked").val() == "address"){
    address =$(".searchbox").val();
    if(address.length < 3){
      error_title = "Invalid Input";
      error_message = "Please provide a valid address";
      displayErrorNotification(error_title, error_message);
      return;
    }
  }
  else{
    lat = $(".input-latitude").val();
    lng = $(".input-longitude").val();
    if (lat < -90 || lat > 90) {
      error_title = "Invalid Input";
      error_message = "Latitude must be between -90 and 90 degrees inclusive.";
      displayErrorNotification(error_title, error_message);
      return;
    }
    else if (lng < -180 || lng > 180) {
      error_title = "Invalid Input";
      error_message = "Longitude must be between -180 and 180 degrees inclusive.";
      displayErrorNotification(error_title, error_message);
      return;
    }
    else if (lat == "" || lng == "") {
      error_title = "Invalid Input";
      error_message = "Enter a valid Latitude or Longitude!";
      displayErrorNotification(error_title, error_message);
      return;
    }
    address = lat + "," + lng;
  }


  if($("#site-class").val() == 'F'){
    error_title = "Site Class: F";
    error_message = "A site response analysis shall be performed in accordance with ASCE/SEI 7 section 21.1 for structures on Site Class F sites. If your structure is exempted under ASCE/SEI 7 Section 20.3.1, select a substitute site class.";
    displayErrorNotification(error_title, error_message);
    return;
  }

  $("#result").html('<div style="text-align:center; margin-top:40px;"><img src="/img/loader.gif"></div>').show();
  $(".searchbox,.searchbutton,.input-coords").attr("disabled","disabled");
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
        $(".searchbox,.searchbutton,.input-coords").removeAttr("disabled");
        $(".searchbutton").html("Go");
      }
    });
  }
}

function usgs_seismic_info(lat, lng, formatted_address){
  dcrd = $("#dcrd").val();
  riskCategory = $("#risk-category").val();
  siteClass = $("#site-class").val();
  tracking_payload = dcrd + '|' + riskCategory + '|' + siteClass + '|'+ formatted_address + '|' + lat + ',' + lng;
  if (["asce41"].indexOf(dcrd.substring(0,dcrd.indexOf('-'))) >= 0) {
    if($("#custom-probability").val() != "" ){
      //Dont send risk category as part of param when ref document is asce41
      input = {latitude:lat, longitude: lng, siteClass: siteClass, customProbability: $("#custom-probability").val(), title: "Example"};
    }
    else{
      input = {latitude:lat, longitude: lng, siteClass: siteClass, title: "Example"};
    }
    
  }
  else{
    input = {latitude:lat, longitude: lng, riskCategory: riskCategory, siteClass: siteClass, title: "Example"};
  }

  $.ajax({
        method: 'GET',
	timeout: 12000,
        dataType: 'json',
        url: 'https://earthquake.usgs.gov/ws/designmaps/'+ dcrd +'.json',
        data: input,
        success: function(data, status, jqXHR){
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
          $(".searchbox,.searchbutton,.input-coords").removeAttr("disabled");
          $(".searchbutton").html("Go");
          asce7_41_result_view();
          ga_event('usgs-search', tracking_payload, 'Seismic Maps data search', jqXHR.status);
        },
        error: function(jqXHR , textStatus, errorThrown){
	  //displayErrorNotification("USGS service returned the following error", jqXHR.status + " " + jqXHR.statusText + "<br>" + jqXHR.responseJSON.response );
	  displayErrorNotification("USGS service error: ", textStatus+"("+jqXHR.status+")");
          ga_event('usgs-search', tracking_payload, 'Seismic Maps data search', textStatus);
          $("#result").html('').hide();
          $(".searchbox,.searchbutton,.input-coords").removeAttr("disabled");
          $(".searchbutton").html("Go");
        },
      });
}

function ga_event(eCategory, eAction, eLabel, eValue){
    gtag('event', eAction, {
	        'event_category': eCategory,
	        'event_label': eLabel,
	        'value': eValue 
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
    crs: usgs.response.data.crs,
	  cr1: usgs.response.data.cr1,
    sdc: usgs.response.data.sdc,
    fa: usgs.response.data.fa,
    fv: usgs.response.data.fv,
    fpga: usgs.response.data.fpga,
	  pgauh: usgs.response.data.pgauh,
	  cv: usgs.response.data.cv,
    pgam: usgs.response.data.pgam,
    ssrt: usgs.response.data.ssrt,
    tsubl: usgs.response.data['t-sub-l'],
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
        "ss" : { "display": "S<sub>S</sub>", "description" : "spectral response (0.2 s)", "value": null },
        "s1" : { "display": "S<sub>1</sub>", "description" : "spectral response (1.0 s)", "value": null },
        "sxs" : { "display": "S<sub>XS</sub>", "description" : "site-modified spectral response (0.2 s)", "value": null },
        "sx1" : { "display": "S<sub>X1</sub>", "description" : "site-modified spectral response (1.0 s)", "value": null },
        "fa" : { "display": "F<sub>a</sub>", "description" : "site amplification factor (0.2 s)", "value": null },
        "fv" : { "display": "F<sub>v</sub>", "description" : "site amplification factor (1.0 s)", "value": null },
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
        "sxs" : { "display": "S<sub>XS</sub>", "description" : "site-modified spectral response (0.2 s)", "value": null },
        "sx1" : { "display": "S<sub>X1</sub>", "description" : "site-modified spectral response (1.0 s)", "value": null },
    },
    "bse-2e":{
        "display": false,
        "hazardLevel": {"display": "Hazard Level", "description": "", "value": "BSE-2E"},
        "ss" : { "display": "S<sub>S</sub>", "description" : "spectral response (0.2 s)", "value": null },
        "s1" : { "display": "S<sub>1</sub>", "description" : "spectral response (1.0 s)", "value": null },
        "sxs" : { "display": "S<sub>XS</sub>", "description" : "site-modified spectral response (0.2 s)", "value": null },
        "sx1" : { "display": "S<sub>X1</sub>", "description" : "site-modified spectral response (1.0 s)", "value": null },
        "fa" : { "display": "f<sub>a</sub>", "description" : "site amplification factor (0.2 s)", "value": null },
        "fv" : { "display": "f<sub>v</sub>", "description" : "site amplification factor (1.0 s)", "value": null },
    },
    "bse-1e":{
        "display": false,
        "hazardLevel": {"display": "Hazard Level", "description": "", "value": "BSE-1E"},
        "ss" : { "display": "S<sub>S</sub>", "description" : "spectral response (0.2 s)", "value": null },
        "s1" : { "display": "S<sub>1</sub>", "description" : "spectral response (1.0 s)", "value": null },
        "sxs" : { "display": "S<sub>XS</sub>", "description" : "site-modified spectral response (0.2 s)", "value": null },
        "sx1" : { "display": "S<sub>X1</sub>", "description" : "site-modified spectral response (1.0 s)", "value": null },
        "fa" : { "display": "F<sub>a</sub>", "description" : "site amplification factor (0.2 s)", "value": null },
        "fv" : { "display": "F<sub>v</sub>", "description" : "site amplification factor (1.0 s)", "value": null },
    },
    //"t-sub-l-data":{
    "tl-data":{
      "display": false,
      "hazardLevel": {"display": "Hazard Level", "description": "", "value": "BSE-1E"},
      "t-sub-l" : { "display": "T-Sub-L", "description" : "Long-period transition period in seconds", "value": null },
    },
    "custom":{
        "display": false,
        "hazardLevel": {"display": "Hazard Level", "description": "", "value": ""},
        "customProbability" : { "display": "Custom Probability", "description" : "Decimal probability of exceedance in 50 years for target ground motion.", "value": null },
        "ss" : { "display": "S<sub>S</sub>", "description" : "spectral response (0.2 s)", "value": null },
        "fa" : { "display": "F<sub>a</sub>", "description" : "site amplification factor (0.2 s)", "value": null },
        "sxs" : { "display": "S<sub>XS</sub>", "description" : "site-modified spectral response (0.2 s)", "value": null },
        "s1" : { "display": "S<sub>1</sub>", "description" : "spectral response (1.0 s)", "value": null },
        "fv" : { "display": "F<sub>v</sub>", "description" : "site amplification factor (1.0 s)", "value": null },
        "sx1" : { "display": "S<sub>X1</sub>", "description" : "site-modified spectral response (1.0 s)", "value": null },
    },
  };

  console.log(view_data);
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
    customProbability: usgs.request.parameters.customProbability,
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
    //chart_print = new google.visualization.LineChart(document.getElementById(charts_config[d].target+"_print"));
    chart.draw(data, options);
    //chart_print.draw(data, options);
  }
}

function print_map(){
    window.print();
}
