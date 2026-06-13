sap.ui.define([
    "sap/ui/core/UIComponent",
    "com/aris/proveedores/facturaexterior/pe/model/models"
], (UIComponent, models) => {
    "use strict";

    return UIComponent.extend("com.aris.proveedores.facturaexterior.pe.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init() {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // set the device model
            this.setModel(models.createDeviceModel(), "oModelDevice");

            // enable routing
            this.getRouter().initialize();
        }
    });
});