sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	'sap/m/Button',
	'sap/m/Dialog',
	'sap/m/Text',
	"sap/ui/layout/VerticalLayout",
	"sap/ui/core/routing/History",
	'sap/ui/model/Filter',
	"./utilController"
], function (JSONModel, MessageBox, MessageToast, Button, Dialog, Text, VerticalLayout, History, Filter, utilController) {
	"use strict";
	return {
		createView: function () {
			//this.destruirViews();
			var app = $.Home.getView().byId("SplitApp");
			var oDetailPage = sap.ui.xmlview({id:"Detail", viewName:"saasa.rampaAsignacion.view.Detail.Detail"});
				app.addDetailPage(oDetailPage);
				//app.placeAt("content");	
			
				/*var MyController = sap.ui.core.mvc.Controller.extend("saasa.rampaAsignacion.controller.Detail.Detail", {});
				var oView = sap.ui.xmlview(sViewId, {
					viewContent: sViewContent,
					controller: new MyController()
				});*/
			
		},
		destruirViews:function(self){
                var view = this.viewCreate();
            for (var i = 0; i < view.length; i++) {
                if (self[view[i].idFrag]) {
                    try{sap.ui.getCore().byId(view[i].idFrag).destroy();
                    }
                    catch(ex){self[view[i].idFrag].destroy();}
                    delete self[view[i].idFrag];
                }
            }
        },
        viewCreate:function(){
        	var modData = [
        		{ruta:"saasa.rampaAsignacion.controller.Detail.Detail",
            	idFrag: "Detail"
            	},
        		{ruta:"saasa.rampaAsignacion.controller.Detail.Add",
            	idFrag: "Add"
            	},
            	{ruta:"saasa.rampaAsignacion.controller.Detail.Edit",
            	idFrag: "Edit"
            	}
        		];
        		return modData;
        }

	};
});