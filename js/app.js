"use strict";

var map;
// Reference-document code (e.g. "asce7-22"); shared between the setup IIFE and
// asce7_41_result_view(), so it is declared at module scope.
var ref;
// Registry of chart redraw closures, keyed by target element id, so charts can
// be reflowed to fit the page when printing.
var printChartRedraws = {};

var ANNOUNCEMENTS_URL = "https://gist.githubusercontent.com/manrajsingh/3dc12e698b9c48020c82e2d0c3d503a0/raw/seismicmaps-alerts.json";

// ---------------------------------------------------------------------------
// Google Maps API key, defined once. Used by the interactive map loader and,
// via the {{mapsKey}} Handlebars helper below, by the static-map images in the
// result templates. Keep this in sync with the key in index.html's Maps
// <script> loader (that one tag must stay inline because Maps loads via URL).
// Reminder: restrict this key by HTTP referrer in the Google Cloud console.
// ---------------------------------------------------------------------------
var GOOGLE_MAPS_API_KEY = "AIzaSyDKDz3WNmHaEZq6Sn_AXUZXxLQSrHsnRts";

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

  var siteClasses = [
    { name: 'Default', value: 'Default', hide_in_ref:['asce7-16','asce7-10','asce41-17','asce41-13','nehrp-2009','nehrp-2015', 'ibc-2015', 'ibc-2012'] },
    { name: 'A', value: 'A' },
    { name: 'B', value: 'B', hide_in_ref:['asce7-16','asce7-10','asce41-17','asce41-13','nehrp-2009','nehrp-2015', 'ibc-2015', 'ibc-2012'] },
    { name: 'BC', value: 'BC', hide_in_ref:['asce7-16','asce7-10','asce41-17','asce41-13','nehrp-2009','nehrp-2015', 'ibc-2015', 'ibc-2012'] },
    { name: 'B - Rock', value: 'B', hide_in_ref:['asce7-22','asce41-23']},
    { name: 'B - Estimated (see Section 11.4.3)', value: 'B-estimated', hide_in_ref: ['asce7-22', 'asce41-23', 'asce7-10','asce41-13','nehrp-2009', 'ibc-2015', 'ibc-2012'] },
    { name: 'C', value: 'C' },
    { name: 'CD', value: 'CD', hide_in_ref:['asce7-16','asce7-10','asce41-17','asce41-13','nehrp-2009','nehrp-2015', 'ibc-2015', 'ibc-2012'] },
    { name: 'D', value: 'D' },
    { name: 'D - Default (See Section 11.4.3)', value: 'D-default', hide_in_ref: ['asce7-22','asce41-23','asce7-10','asce41-13','nehrp-2009', 'ibc-2015', 'ibc-2012'] },
    { name: 'DE', value: 'DE', hide_in_ref:['asce7-16','asce7-10','asce41-17','asce41-13','nehrp-2009','nehrp-2015', 'ibc-2015', 'ibc-2012'] },
    { name: 'E', value: 'E' },
    { name: 'F', value: 'F' }
  ];

  var urlParams = {
    "ref": "",
    "risk-category": "",
    "site-class": "",
    "title": "",
    "location": ""
  };


  var update_view = function(){
    var selector = options.siteClassSelector;
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
    updateCustomInputLabel(ref);

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
    $(options.referenceDocumentSelector + ' option[value="asce7-22"]').prop('selected', true);
    
    $("[name=searchby]").on("change", function(){
      input_boxes_view();
      //console.log($("[name=searchby]:checked").val());
    });

    update_view();

    loadAnnouncements();

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
  updateCustomInputLabel(ref);
}

// The shared "custom" input means different things per reference document:
// ASCE 41-23 uses a custom return period (years); earlier ASCE 41 versions use
// a custom probability of exceedance. Relabel the field to match.
function updateCustomInputLabel(ref){
  if(ref === 'asce41-23'){
    $(".custom-probability-label").text("Custom Return Period");
    $("#custom-probability").attr("placeholder", "for eg. 975 (years)").attr("aria-label", "Custom Return Period");
  } else {
    $(".custom-probability-label").text("Custom Probability");
    $("#custom-probability").attr("placeholder", "for eg. 0.10").attr("aria-label", "Custom Probability");
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

  var map_dragged = false;

  google.maps.event.addListener(map, 'drag', function() {
    $("#coords-display").html("Lat: " + map.getCenter().lat().toFixed(8) +", Lng: " + map.getCenter().lng().toFixed(8));
    map_dragged = true;
  });

  google.maps.event.addListener(map, 'zoom_changed', function() {
    if($('.map-img img').length > 0) {
      var src = $(".map-img img").attr("src");
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
  // Retry button rendered inside a USGS error notification: re-run the search.
  $(document).on('click', '.retry-search', function() {
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

// Fetch the managed alert feed and render any currently-active banners.
// Runs at page load; failures are silent so the app still works if the
// feed is unreachable.
function loadAnnouncements(){
  var url = ANNOUNCEMENTS_URL + (ANNOUNCEMENTS_URL.indexOf('?') === -1 ? '?' : '&') + 'cb=' + Date.now();
  $.getJSON(url)
    .done(function(data){
      var alerts = (data && data.alerts) ? data.alerts : [];
      renderAnnouncements(alerts);
    })
    .fail(function(){
      // Feed unavailable: don't block the app, just skip banners.
    });
}

function renderAnnouncements(alerts){
  var $container = $(".announcements-container").empty();
  var now = Date.now();

  var validTypes = { info: 1, warning: 1, danger: 1, success: 1 };

  alerts.forEach(function(a){
    if (!a || a.active === false) return;

    // Optional date window: only show while current.
    if (a.start && now < Date.parse(a.start)) return;
    if (a.end && now > Date.parse(a.end)) return;

    var type = validTypes[a.type] ? a.type : 'info';
    var titleHtml = a.title ? '<strong>' + a.title + '</strong><br>' : '';
    var dismissBtn = a.dismissible
      ? '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>'
      : '';
    var dismissClass = a.dismissible ? ' alert-dismissible fade show' : '';

    $container.append(
      '<div class="alert alert-' + type + dismissClass + '" role="alert">' +
      dismissBtn + titleHtml + (a.message || '') +
      '</div>'
    );
  });
}

function geocodeAddress(geocoder, resultsMap) {
  var error_title, error_message, lat, lng, addressParts, formatted_address;
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

  $("#result").html('<div style="text-align:center; margin-top:40px;"><img src="img/loader.gif"></div>').show();
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
  var input;
  var dcrd = $("#dcrd").val();
  var riskCategory = $("#risk-category").val();
  var siteClass = $("#site-class").val();
  var tracking_payload = dcrd + '|' + riskCategory + '|' + siteClass + '|'+ formatted_address + '|' + lat + ',' + lng;
  if (["asce41"].indexOf(dcrd.substring(0,dcrd.indexOf('-'))) >= 0) {
    //Dont send risk category as part of param when ref document is asce41
    input = {latitude:lat, longitude: lng, siteClass: siteClass, title: "Example"};
    var custom = $("#custom-probability").val();
    if(custom != ""){
      // ASCE 41-23 takes a custom return period (years); earlier ASCE 41
      // versions take a custom probability of exceedance.
      if(dcrd == 'asce41-23'){ input.customReturnPeriod = custom; }
      else { input.customProbability = custom; }
    }
  }
  else{
    input = {latitude:lat, longitude: lng, riskCategory: riskCategory, siteClass: siteClass, title: "Example"};
  }

  $.ajax({
        method: 'GET',
	timeout: 12000,
        dataType: 'json',
        url: 'https://earthquake.usgs.gov/ws/building-codes/'+ dcrd +'/calculate',
        data: input,
        success: function(data, status, jqXHR){
          if(usgsSucceeded(data)){
            if(["asce7","nehrp","ibc"].indexOf(dcrd.substring(0,dcrd.indexOf('-'))) >= 0){
              if( dcrd == 'asce7-22'){
                display_asce7_22(lat, lng, formatted_address, data);
              }
              else {
                display_asce7_nehrp_ibc_info(lat, lng, formatted_address, data);
              }
              
            }
            else if (["asce41"].indexOf(dcrd.substring(0,dcrd.indexOf('-'))) >= 0) {
              if( dcrd == 'asce41-23'){
                display_asce41_23_info(lat, lng, formatted_address, data);
              }
              else {
                display_asce41_info(lat, lng, formatted_address, data);
              }
            }

          }
          else{
             displayErrorNotification("USGS service returned the following error", data.response);
          }
          $(".searchbox,.searchbutton,.input-coords").removeAttr("disabled");
          $(".searchbutton").html("Go");
          asce7_41_result_view();
          ga_event('usgs-search', tracking_payload, 'Seismic Maps data search', jqXHR.status);
          // Enriched GA4 event (address + coords + selected parameters).
          gtag('event', 'seismic_search', {
            reference_document: dcrd,
            risk_category: riskCategory,
            site_class: siteClass,
            search_address: formatted_address,
            latitude: lat,
            longitude: lng
          });
        },
        error: function(jqXHR , textStatus, errorThrown){
	  //displayErrorNotification("USGS service returned the following error", jqXHR.status + " " + jqXHR.statusText + "<br>" + jqXHR.responseJSON.response );
	  displayErrorNotification("USGS service error: ", textStatus+"("+jqXHR.status+")" +
	    '<br><button type="button" class="btn btn-sm btn-outline-danger mt-2 retry-search">Retry</button>');
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

// Register a Handlebars helper so result templates can reference the Maps key
// as {{mapsKey}} instead of hard-coding it in every static-map URL.
if (typeof Handlebars !== 'undefined') {
  Handlebars.registerHelper('mapsKey', function(){ return GOOGLE_MAPS_API_KEY; });
}

// ---------------------------------------------------------------------------
// Shared result-rendering helpers (used by all display_* functions below).
// ---------------------------------------------------------------------------

// True if the USGS response indicates success. Handles the normal shape
// (request.status) and the beta ASCE 41-23 shape (top-level status, which the
// beta service even spells "sucess").
function usgsSucceeded(usgs){
  var s = (usgs.request && usgs.request.status) || usgs.status;
  return s === 'success' || s === 'sucess';
}

// Request parameters, normalised. Most reference docs nest them under
// request.parameters; the beta ASCE 41-23 returns a flat request object.
function requestParams(usgs){
  return usgs.request.parameters || usgs.request;
}

// Context common to every result template: project/site metadata, with the
// site-class value mapped to its human-readable label.
function buildBaseContext(lat, lng, formatted_address, usgs){
  var params = requestParams(usgs);
  // request.date is ISO on most docs; ASCE 41-23 omits it and puts an
  // already-formatted date string at the top level instead. Parse whichever is
  // present and format consistently (fall back to the raw string if unparseable).
  var rawDate = usgs.request.date || usgs.date;
  var parsed = new Date(rawDate);
  var dateTime = isNaN(parsed.getTime())
    ? rawDate
    : parsed.toLocaleDateString() + ", " + parsed.toLocaleTimeString();
  var context = {
    project_title: $("#project-title").val(),
    dcrd: usgs.request.referenceDocument || $("#dcrd option:selected").text(),
    riskCategory: params.riskCategory,
    siteClass: params.siteClass,
    dateTime: dateTime,
    formatted_address: formatted_address,
    latlng: lat + ", " + lng,
    mapZoom: map.getZoom()
  };
  $("#site-class option").each(function(){
    if($(this).val() == params.siteClass){
      context.siteClass = $(this).html();
    }
  });
  return context;
}

// Merge USGS "*_note" advisories into the context and annotate the affected
// values. The null guard prevents the "-null" text USGS sometimes returns.
function applyNotes(context, usgs){
  var data = usgs.response.data;
  for(var key in data){
    if(key.indexOf("_note") > 0 && data[key] != null){
      var noteKey = key.replace("_note", "");
      var note = data[key];
      context[noteKey] = note;
      switch(noteKey){
        case 'fv':
          context.sd1 = data.sd1 + '  -' + note;
          context.sdc = data.sdc + '  -' + note;
          context.sm1 = data.sm1 + '  -' + note;
          context.fv  = data.fv  + '  -' + note;
          break;
        case 'fa':
          context.sms = data.sms + '  -' + note;
          context.sds = data.sds + '  -' + note;
          context.fa  = data.fa  + '  -' + note;
          break;
      }
    }
  }
  return context;
}

// Compile the Handlebars template at a selector and render it into #result.
function renderResult(templateSelector, context){
  var template = Handlebars.compile($(templateSelector).html());
  $("#result").html(template(context));
}

// Build/refresh the SD & SM response-spectrum charts, or hide them if absent.
function renderSpectrumCharts(usgs){
  var data = usgs.response.data;
  if(data.sdSpectrum != null){
    charts_config.sd.data = [["Period, T(sec)", "Sa(g)"]].concat(data.sdSpectrum);
  }
  if(data.smSpectrum != null){
    charts_config.sm.data = [["Period, T(sec)", "Sa(g)"]].concat(data.smSpectrum);
  }
  if(data.smSpectrum == null && data.sdSpectrum == null){
    $(".spectrum-charts").hide();
  } else {
    makecharts();
    $(".spectrum-charts").show();
  }
}

function display_asce7_22(lat, lng, formatted_address, usgs){
  var data = usgs.response.data;
  var context = buildBaseContext(lat, lng, formatted_address, usgs);
  $.extend(context, {
    ss: data.ss,
    s1: data.s1,
    sds: data.sds,
    sd1: data.sd1,
    sms: data.sms,
    sm1: data.sm1,
    sdc: data.sdc,
    cv: data.cv,
    pgam: data.pgam,
    ts: data.ts,
    t0: data.t0,
    tl: data.tl,
    multiPeriodDesignSpectrum: data.multiPeriodDesignSpectrum,
    multiPeriodMCErSpectrum: data.multiPeriodMCErSpectrum,
    twoPeriodDesignSpectrum: data.twoPeriodDesignSpectrum,
    twoPeriodMCErSpectrum: data.twoPeriodMCErSpectrum,
    verticalDesignSpectrum: data.verticalDesignSpectrum,
    verticalMCErSpectrum: data.verticalMCErSpectrum,
    pgauh: data.underlyingData.pgauh,
    pga84th: data.underlyingData.pga84th,
    riskTargetedSpectrum: data.underlyingData.riskTargetedSpectrum,
    eightyFourthSpectrum: data.underlyingData.eightyFourthSpectrum,
    vs30: usgs.response.metadata.vs30,
    spatialInterpolationMethod: usgs.response.metadata.spatialInterpolationMethod,
    pgadFloor: usgs.response.metadata.pgadFloor
  });
  applyNotes(context, usgs);
  renderResult("#asce7-22", context);
  renderSpectrumCharts(usgs);
}
function display_asce7_nehrp_ibc_info(lat, lng, formatted_address, usgs){
  var data = usgs.response.data;
  var context = buildBaseContext(lat, lng, formatted_address, usgs);
  $.extend(context, {
    ss: data.ss,
    s1: data.s1,
    s1rt: data.s1rt,
    s1uh: data.s1uh,
    s1d: data.s1d,
    pgad: data.pgad,
    pga: data.pga,
    sds: data.sds,
    sd1: data.sd1,
    sms: data.sms,
    sm1: data.sm1,
    crs: data.crs,
    cr1: data.cr1,
    sdc: data.sdc,
    fa: data.fa,
    fv: data.fv,
    fpga: data.fpga,
    pgauh: data.pgauh,
    cv: data.cv,
    pgam: data.pgam,
    ssrt: data.ssrt,
    tsubl: data['t-sub-l'],
    ssuh: data.ssuh,
    ssd: data.ssd
  });
  applyNotes(context, usgs);
  renderResult("#asce7-nehrp-ibc-result-template", context);
  renderSpectrumCharts(usgs);
}
function display_asce41_info(lat, lng, formatted_address, usgs){
  var view_data = usgs.response.data;
  var view_model = {
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

  for(var arrItem in view_data){
    var hzl = view_data[arrItem]["hazardLevel"].toLowerCase().replace(/\s+/,'-');
    view_model[hzl]["display"] = true;
    for(var attr in view_model[hzl]){
      // "display" is a boolean flag, not a descriptor object; skip it (writing
      // to a property of a boolean throws under strict mode).
      if(attr === "display"){ continue; }
      view_model[hzl][attr]["value"] = view_data[arrItem][attr];
    }
  }

  var context = buildBaseContext(lat, lng, formatted_address, usgs);
  context.customProbability = requestParams(usgs).customProbability;
  context.data = view_model;
  applyNotes(context, usgs);
  renderResult("#asce41-result-template", context);

  // Chart the per-hazard-level response spectra (periods differ per level).
  var spectra = view_data
    .filter(function(h){ return h && h.horizontalSpectrum; })
    .map(function(h){ return { label: h.hazardLevel, points: h.horizontalSpectrum }; });
  drawPairSpectraChart('asce41_chart', 'ASCE 41 Response Spectra', spectra);
}

// ASCE 41-23 (beta). Different response shape from ASCE 41-17/13: four hazard
// levels (BSE-2N/1N/2E/1E) each with Sxs, Sx1 and a multi-period spectrum.
function display_asce41_23_info(lat, lng, formatted_address, usgs){
  var data = usgs.response.data;
  var context = buildBaseContext(lat, lng, formatted_address, usgs);
  // Always shown; when the user didn't request a custom return period the beta
  // service uses the standard BSE hazard levels.
  context.customReturnPeriod = requestParams(usgs).customReturnPeriod || "Default (standard BSE hazard levels)";
  context.hazardLevels = [
    { level: 'BSE-2N', sxs: data.sxsBSE2N, sx1: data.sx1BSE2N },
    { level: 'BSE-1N', sxs: data.sxsBSE1N, sx1: data.sx1BSE1N },
    { level: 'BSE-2E', sxs: data.sxsBSE2E, sx1: data.sx1BSE2E },
    { level: 'BSE-1E', sxs: data.sxsBSE1E, sx1: data.sx1BSE1E }
  ];
  // Multi-period spectra for the tabular view (all share the same periods).
  context.bse2n = data.multiPeriodBSE2Nspectrum;
  context.bse1n = data.multiPeriodBSE1Nspectrum;
  context.bse2e = data.multiPeriodBSE2Espectrum;
  context.bse1e = data.multiPeriodBSE1Espectrum;
  context.rp975 = data.underlyingData ? data.underlyingData.multiPeriod975yrSpectrum : null;
  context.rp224 = data.underlyingData ? data.underlyingData.multiPeriod224yrSpectrum : null;
  renderResult("#asce41-23-result-template", context);

  drawMultiPeriodChart('asce41_23_chart', 'ASCE 41-23 Response Spectra', [
    { label: 'BSE-2N', spectrum: data.multiPeriodBSE2Nspectrum },
    { label: 'BSE-1N', spectrum: data.multiPeriodBSE1Nspectrum },
    { label: 'BSE-2E', spectrum: data.multiPeriodBSE2Espectrum },
    { label: 'BSE-1E', spectrum: data.multiPeriodBSE1Espectrum }
  ]);
}

// Draw several {label, spectrum:{periods, ordinates}} series that share a
// common period axis onto one Google line chart in the given element id.
function drawMultiPeriodChart(elementId, title, series){
  series = series.filter(function(s){ return s.spectrum && s.spectrum.periods; });
  if(series.length === 0){ return; }
  var periods = series[0].spectrum.periods;
  google.charts.load('current', {'packages':['corechart','line']});
  google.charts.setOnLoadCallback(function(){
    var dt = new google.visualization.DataTable();
    dt.addColumn('number', 'Period, T(sec)');
    series.forEach(function(s){ dt.addColumn('number', s.label); });
    for(var i = 0; i < periods.length; i++){
      // Formatted domain value so the combined tooltip is labelled, e.g.
      // "T = 0.2 s", while the numeric value still drives the axis.
      var row = [{ v: periods[i], f: 'T = ' + periods[i] + ' s' }];
      series.forEach(function(s){ row.push(s.spectrum.ordinates[i]); });
      dt.addRow(row);
    }
    registerAndDraw(elementId, dt, {
      title: title,
      vAxis: { title: 'Sa(g)' },
      hAxis: { title: 'Period, T (sec)' },
      legend: { position: 'bottom' },
      // Highlight every series at the hovered period and show all values in one
      // combined tooltip bubble.
      focusTarget: 'category',
      tooltip: { trigger: 'focus' },
      crosshair: { trigger: 'both', orientation: 'vertical', color: '#bbb' }
    });
  });
}

// Draw several {label, points:[[T, Sa], ...]} spectra whose period axes do NOT
// align (e.g. ASCE 41-17/13 constructed two-period spectra) onto one line
// chart. Each series is resampled onto the union of all periods by linear
// interpolation so every line has a value at every period — this lets the
// combined ('category') tooltip highlight all lines at once.
function drawPairSpectraChart(elementId, title, series){
  series = series.filter(function(s){ return s.points && s.points.length; });
  if(series.length === 0){ return; }

  // Linear interpolation of a sorted [[T, Sa], ...] curve at period t.
  function interpAt(points, t){
    var n = points.length;
    if(t <= points[0][0]) return points[0][1];
    if(t >= points[n-1][0]) return points[n-1][1];
    for(var i = 1; i < n; i++){
      if(points[i][0] >= t){
        var t0 = points[i-1][0], s0 = points[i-1][1], t1 = points[i][0], s1 = points[i][1];
        return t1 === t0 ? s0 : s0 + (s1 - s0) * (t - t0) / (t1 - t0);
      }
    }
    return points[n-1][1];
  }

  google.charts.load('current', {'packages':['corechart','line']});
  google.charts.setOnLoadCallback(function(){
    var periodSet = {};
    series.forEach(function(s){ s.points.forEach(function(p){ periodSet[p[0]] = true; }); });
    var periods = Object.keys(periodSet).map(parseFloat).sort(function(a,b){ return a - b; });
    var dt = new google.visualization.DataTable();
    dt.addColumn('number', 'Period, T(sec)');
    series.forEach(function(s){ dt.addColumn('number', s.label); });
    periods.forEach(function(t){
      var row = [{ v: t, f: 'T = ' + t + ' s' }];
      series.forEach(function(s){ row.push(Math.round(interpAt(s.points, t) * 1000) / 1000); });
      dt.addRow(row);
    });
    registerAndDraw(elementId, dt, {
      title: title,
      vAxis: { title: 'Sa(g)' },
      hAxis: { title: 'Period, T (sec)' },
      legend: { position: 'bottom' },
      focusTarget: 'category',
      tooltip: { trigger: 'focus' },
      crosshair: { trigger: 'both', orientation: 'vertical', color: '#bbb' }
    });
  });
}

function copy_table_data(elementId){
  var range = document.createRange();
  range.selectNode(document.getElementById(elementId));
  window.getSelection().removeAllRanges(); // clear current selection
  window.getSelection().addRange(range); // to select text
  document.execCommand("copy");
  window.getSelection().removeAllRanges();// to deselect
}

function makecharts(){
  google.charts.load('current', {'packages':['corechart','line']});
  google.charts.setOnLoadCallback(drawChart);
}

// Draw a chart and remember how to redraw it (used to reflow charts for print).
function registerAndDraw(target, dataTable, options){
  var chart = new google.visualization.LineChart(document.getElementById(target));
  var redraw = function(){ chart.draw(dataTable, options); };
  redraw();
  printChartRedraws[target] = redraw;
}

// Google Charts render at a fixed pixel width; redraw them so they fit the page
// when the print layout (narrower columns) takes effect, and again afterwards.
function redrawAllCharts(){
  for(var id in printChartRedraws){
    if(document.getElementById(id)){ try { printChartRedraws[id](); } catch(e){} }
  }
}
window.addEventListener('beforeprint', redrawAllCharts);
window.addEventListener('afterprint', redrawAllCharts);

function drawChart() {
  for(var d in charts_config){
    var data = google.visualization.arrayToDataTable(charts_config[d].data);
    var options = {
      title: charts_config[d].title,
      vAxis: { title: 'Sa(g)'},
      hAxis : {title: 'Period, T (sec)'},
      legend: {'position': 'bottom' }
    };
    registerAndDraw(charts_config[d].target, data, options);
    //chart_print = new google.visualization.LineChart(document.getElementById(charts_config[d].target+"_print"));
    //chart_print.draw(data, options);
  }
}

function print_map(){
    window.print();
}
