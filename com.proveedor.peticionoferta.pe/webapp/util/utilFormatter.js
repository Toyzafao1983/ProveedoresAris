jQuery.sap.require("sap.ui.core.format.DateFormat");
sap.ui.define([
    
], function() {
    "use strict";
    return {
        FechaHoraToString: function(date) {
            var oFormat = sap.ui.core.format.DateFormat.getInstance({
				pattern: "dd/MM/yyyy HH:mm:ss"
			});
			return oFormat.format(date);
        },
        FechaToString: function(date) {
            var oFormat = sap.ui.core.format.DateFormat.getInstance({
				pattern: "dd/MM/yyyy"
			});
			return oFormat.format(date);
        }
    };
});