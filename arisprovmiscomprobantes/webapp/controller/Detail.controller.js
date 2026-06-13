sap.ui.define([
    "arisprovmiscomprobantes/controller/BaseController",
    "sap/ui/core/mvc/Controller",
    "arisprovmiscomprobantes/model/models",
    "arisprovmiscomprobantes/model/formatter",
    "arisprovmiscomprobantes/services/Services",
	"arisprovmiscomprobantes/util/util",
    'arisprovmiscomprobantes/util/utilUI'
], (Controller) => {
    "use strict";
    var that;

    return Controller.extend("arisprovmiscomprobantes.controller.Detail", {
        onInit() {
            that = this;
            this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            this.oRouter.getTarget("Detail").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));
        },
        handleRouteMatched: function(bInit){
            sap.ui.core.BusyIndicator.show(0)
            Promise.all([ this._getPrueba()
            ]).then((values) => {
                sap.ui.core.BusyIndicator.hide(0);
            }).catch(function (oError) {
                that.getMessageBox("error", that.getI18nText("errorUserData"));
				sap.ui.core.BusyIndicator.hide(0);
			});
        },
        _onPressNavButtonDetail: function () {
            this.oRouter.navTo("Main");
        },
    });
});