var isCapturing = false;
var pointList = new Array();
var userRoute = null;
if(OS_ANDROID) {
	// Location provider definitions - only work on Android
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

var handleLocation = function(e) {
	if(e.error) {
		if(e.error==="gps is disabled" && OS_ANDROID) {
			Ti.Geolocation.Android.removeLocationProvider(providerGps);
			Ti.Geolocation.Android.addLocationProvider(providerNetwork);
		} else if(e.error==="gps is disabled"){
			alert("Please turn on your GPS.");
		} else {
			alert("Unable to get your location. Please check your settings.");
		}
	} else {
		var latLongString = "Latitude: " + e.coords.latitude + "\nLongitude: " + e.coords.longitude;
		$.coordinates.text = latLongString;
		mapview.setLocation({
			latitude:e.coords.latitude, longitude:e.coords.longitude, animate:true,
			latitudeDelta:0.04, longitudeDelta:0.04
		});
		pointList.push({latitude:e.coords.latitude, longitude:e.coords.longitude});
		if(userRoute!=null) {
			mapview.removeRoute(userRoute);
		}
		var userRoute = MapModule.createRoute({
			points:pointList
		});
		mapview.addRoute(userRoute);
	}
};

function startGPS() {
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
			// Shut GPS off and turn it on when app loses/gains focus.
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
		alert("Geolocation is not turned on.  Please turn on your device's location services before using this application.");
	}
}

$.startstop.addEventListener("click", function() {
	if(isCapturing) {
		Ti.Geolocation.removeEventListener('location', handleLocation);
		$.startstop.title = "Start GPS Updates";
		pointList = new Array();
		if(userRoute!=null) {
			mapview.removeRoute(userRoute);
		}
	} else {
		startGPS();
		$.startstop.title = "Stop GPS Updates";
	}
	isCapturing = !isCapturing;
});

var MapModule = require("ti.map");
var mapview = MapModule.createView({mapType:MapModule.NORMAL_TYPE});
if(MapModule.isGooglePlayServicesAvailable()==MapModule.SUCCESS) {
	Ti.API.info("Play services are installed.");
}else {
	Ti.API.info("Play services not installed.");
}
mapview.setUserLocation(true);
//mapview.setUserLocationButton(true);
$.index.add(mapview);

$.index.open();
