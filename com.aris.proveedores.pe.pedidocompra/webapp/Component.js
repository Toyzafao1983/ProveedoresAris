sap.ui.define([
    "sap/ui/core/UIComponent",
    "com/aris/proveedores/pe/pedidocompra/model/models"
], (UIComponent, models) => {
    "use strict";

    return UIComponent.extend("com.aris.proveedores.pe.pedidocompra.Component", {
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
            this.setModel(models.createDeviceModel(), "device");

            this.setModel(models.createModelProyect(), "oModelProyect");
            this.setModel(new sap.ui.model.json.JSONModel({}), "oModelData");
            this.setModel(new sap.ui.model.json.JSONModel({}), "oModelUser");

            // enable routing
            this.getRouter().initialize();
        }
    });
});