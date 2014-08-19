// Static variables to keep track of the user's route and whether to capture information or not.
var isCapturing = false;
var pointList = new Array();
var userRoute = null;
if(OS_ANDROID) {
	// Location provider definitions - only work on Android
	// We want to primarily use GPS and fall back to network location if needed.
	var providerGps = Ti.Geolocation.Android.createLocationProvider({
		name: Ti.Geolocation.PROVIDER_GPS,
		minUpdateDistance: 0.0,
		minUpdateTime: 0
	});
	var providerNetwork = Ti.Geolocation.Android.createLocationProvider({
		name: Ti.Geolocation.PROVIDER_NETWORK,
		minUpdateDistance: 0.0,
		minUpdateTime: 0
	});
}
/**
 * Callback method to be executed when a new GPS point is obtained.
 * @param {Object} The coordinate object to be returned.
 */
var handleLocation = function(e) {
	if(e.error) {
		// Try to fall back to the network if the GPS is disabled on Android.
		if(e.error==="gps is disabled" && OS_ANDROID) {
			Ti.Geolocation.Android.removeLocationProvider(providerGps);
			Ti.Geolocation.Android.addLocationProvider(providerNetwork);
		} else if(e.error==="gps is disabled"){
			// If GPS is disabled, request that it be turned on.
			alert("Please turn on your GPS.");
		} else {
			// General error case.  Usually caused by location services being turned off or
			// poor cell phone signal.
			alert("Unable to get your location. Please check your settings.");
		}
	} else {
		var latLongString = "Latitude: " + e.coords.latitude + "\nLongitude: " + e.coords.longitude;
		$.coordinates.text = latLongString;
		// Zoom and pan the map to show the user's location and path.
		mapview.setLocation({
			latitude:e.coords.latitude, longitude:e.coords.longitude, animate:true,
			latitudeDelta:0.04, longitudeDelta:0.04
		});
		// Add the new point to the list and update the route object used by the map view.
		pointList.push({latitude:e.coords.latitude, longitude:e.coords.longitude});
		if(userRoute!=null) {
			mapview.removeRoute(userRoute);
		}
		// Updating a route isn't possible for some reason.  Recreate it after each point.
		var userRoute = MapModule.createRoute({
			points:pointList
		});
		mapview.addRoute(userRoute);
	}
};
/**
 * Function to start the GPS tracking.
 */
function startGPS() {
	// Check if location is available.
	if(Ti.Geolocation.locationServicesEnabled) {
		Ti.Geolocation.purpose = "Testing the GPS capabilities of Appcelerator";
		if(OS_IOS) {
			// iOS GPS is simpler to implement.  Doens't handle multiple providers well.
			Ti.Geolocation.accuracy = Ti.Geolocation.ACCURACY_BEST;
			Ti.Geolocation.preferredProvider = Ti.Geolocation.PROVIDER_GPS;
		}else if(OS_ANDROID) {
			// Implementation of Android manual mode.  Better control over Android's location providers.
			Ti.Geolocation.Android.addLocationProvider(providerGps);
			Ti.Geolocation.Android.addLocationProvider(providerNetwork);
			Ti.Geolocation.Android.manualMode = true;
			// Disconnect and reconnect to GPS data when app loses/gains focus.
			$.index.activity.addEventListener('pause', function(e){
				if(isCapturing) {
					Ti.Geolocation.removeEventListener('location', handleLocation);
				}
			});
			$.index.activity.addEventListener('resume', function(e) {
				if(isCapturing){
					Ti.Geolocation.addEventListener('location', handleLocation);
				}
			});
		}
		Ti.Geolocation.addEventListener('location', handleLocation);
	} else {
		// Error case.
		alert("Geolocation is not turned on.  Please turn on your device's location services before using this application.");
	}
}
// Set up the start and stop button.
$.startstop.addEventListener("click", function() {
	if(isCapturing) {
		// Remove any location providers.
		Ti.Geolocation.removeEventListener('location', handleLocation);
		// Change button title and remove route data from variables.
		$.startstop.title = "Start GPS Updates";
		pointList = new Array();
		// Clear the map.
		if(userRoute!=null) {
			mapview.removeRoute(userRoute);
		}
	} else {
		// Start the GPS and switch the button title.
		startGPS();
		$.startstop.title = "Stop GPS Updates";
	}
	isCapturing = !isCapturing;
});

// Create and put the map on the screen.
var MapModule = require("ti.map");
var mapview = MapModule.createView({mapType:MapModule.NORMAL_TYPE});
mapview.setUserLocation(true);
$.index.add(mapview);

$.index.open();
