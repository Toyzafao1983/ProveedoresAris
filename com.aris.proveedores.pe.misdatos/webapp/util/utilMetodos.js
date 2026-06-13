jQuery.sap.require("sap.ui.core.format.DateFormat");
sap.ui.define([
    "./util"
], function(util) {
    "use strict";
    return {
    	getObject:function(oEvent,model){
    	return oEvent.getSource().getBindingContext(model).getObject(); 	
    	},
    	getPath:function(oEvent,model){
    	return oEvent.getSource().getBindingContext(model).getPath();	
    	},
    	goDeselected: function(self,splitName)
		{
			/*var app = self.getView().byId(splitName);
 			app.setMode(sap.m.SplitAppMode.ShowHideMode);
			app.setMode(sap.m.SplitAppMode.HideMode);*/	
		},
		controllerFromView: function(controller,id){//Pasar Data utilController.controllerFromView(this,"viewProgramacionD").onLoadListaEntregas(data);
            var idController = this.byId(controller,id).getId();
            return sap.ui.getCore().byId(idController).getController();
        },
        createPage:function(self,splitId,viewId){
	        var viewDefault = self.getView().byId(viewId).getId();
	        self.getView().byId(splitId).to(self.createId(viewDefault));	
        },
        convertData:function(data,nomHoja){
        	var arrayObjeto = [];
        	for(var i=0;i<data.length;i++){
        		var servData = data[i];
        		var objeto = {
        			"CodigoSap":servData.__EMPTY,
        			"Descripcion":servData.__EMPTY_1,
					"Puntos":servData.__EMPTY_2,
					"Precio":servData.__EMPTY_3,
					"Jerarquia":servData.__EMPTY_4,
					"Imagen":servData.__EMPTY_5,
					"Imagen2":servData.__EMPTY_6,
					"Imagen3":servData.__EMPTY_7
        		};
        		arrayObjeto.push(objeto);
        	}
        	return arrayObjeto;
        },
        convertDate:function(fecha){
            var dia = fecha.split("/")[0];
            var mes = fecha.split("/")[1]-1;
            var anio = fecha.split("/")[2];
            var dt = new Date(anio,mes,dia);
            return dt;
        },
        sessionStorageUsuario: function(self){
            sessionStorage.setItem("Perfiles",JSON.stringify(this.convertirTiposUndefined(util.controller.property(self, "/Perfiles", "", false))));
            sessionStorage.setItem("Objeto",JSON.stringify(this.convertirTiposUndefined(util.controller.property(self, "/Perfiles", "", false))));
        },
        convertirTiposUndefined:function(dato){
            var datoModificado = "";
            datoModificado = dato;
            if(dato==undefined){
                datoModificado = "";
            }
            if(dato==null){
                datoModificado = "";
            }
            if(dato==NaN){
                datoModificado = "";
            }
            return datoModificado;
        },
        deepCopy: function (data){
        	return JSON.parse(JSON.stringify(data));
        }
        
    };
});