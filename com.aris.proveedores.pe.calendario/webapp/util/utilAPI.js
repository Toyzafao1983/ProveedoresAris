sap.ui.define([

], function() {
	"use strict";
	return {
		getCurrentPosition: function(callback) {
			if (navigator.geolocation) {
				navigator.geolocation.getCurrentPosition(function(coords) {
					callback({
						c: "s",
						m: "Este navegador es algo antiguo, actualiza para usar el API de localización",
						data: coords
					});
				});
			} else {
				callback({
					c: "ex",
					m: "Este navegador es algo antiguo, actualiza para usar el API de localización",
					data: null
				});
			}
		}
	};
});