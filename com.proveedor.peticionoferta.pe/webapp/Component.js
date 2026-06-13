sap.ui.define([
    "sap/ui/core/UIComponent",
    "com/proveedor/peticionoferta/pe/model/models"
], (UIComponent, models) => {
    "use strict";

    return UIComponent.extend("com.proveedor.peticionoferta.pe.Component", {
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