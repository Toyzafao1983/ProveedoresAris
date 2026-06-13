jQuery.sap.require("sap.ui.core.format.DateFormat");
sap.ui.define([
    "./util"
], function(util) {
    "use strict";
    return {
        moldearListaOrdenesCompras:function(datos){
        var serDatos = datos;
        var listDatos = [];
        for(var i in serDatos) {
                var modDatos ={ 	
    					"EstadoPago" : serDatos[i].EstadoPago,
						"Orden_Compra" : serDatos[i].Ebeln,
						"Posicion" : parseInt(serDatos[i].Ebelp),
						"FechaDoc" : serDatos[i].Bedat,
						"Fecha_Documento" : serDatos[i].Budat,
						"Unidad_Medida" : serDatos[i].Meins,
						"Tipo_Documento" : serDatos[i].Pstyp,
						"Descripcion_Articulo" : serDatos[i].Txz01,
						"Cantidad_Solicitada" : serDatos[i].CantidadS,
						"Cantidad_Entregada" : serDatos[i].CantidadE,
						"Cantidad_Facturada" : serDatos[i].CantidadF,
						"Estado_OC" : serDatos[i].Frgke,
						"Importe" : serDatos[i].Netpr,
						"Moneda" : serDatos[i].Waers
            	};
                listDatos.push(modDatos);
            }
    		
           return listDatos;
        },
        parseUndefined:function(data){
        	return data ===undefined || data ===null ? "":data;
        },
        parseUndefinedNumero:function(data){
        	return data ===undefined || data ===null ? "0":data;
        },
        actualizarUsuario:function(datos){
        var usuInfo = datos;
        	if(usuInfo.checkEstado){
        		datos.IdEstado = 23;
        	}else{
        		//datos.IdEstado = 25;//Eliminado
        		datos.IdEstado = 24;//Desactivo
        	}
    		var modDatos ={ 	
    			oResults:{
    			"sId":datos.Id,
            	"sUsuario":datos.Email,
				"sNumIdentificacion":datos.NumIdentificacion,
				"sNombre": datos.Nombre,
				"sApellido": datos.Apellido,
				"sEmail":datos.Email,
				//"dFechaNacimiento": datos.FechaNacimiento.getDate()+"/"+(datos.FechaNacimiento.getMonth()+1)+"/"+"2012",//datos.FechaNacimiento.getFullYear(),
				"iIdTipoUsuario":datos.IdTipoUsuario,
				"iIdEstado":datos.IdEstado
            	}
    		};
            
           return modDatos;
        },
        eliminarUsuario:function(usuarios){
        	var usuInfo = usuarios;
        	var modDatos ={
    			oResults:{
    			aItems:[]
    			}
        	};
        	for(var i=0;i<usuInfo.length;i++){
    			modDatos.oResults.aItems.push({"iId":usuInfo[i].Id, "sEmail": usuInfo[i].Email});
    		}
           return modDatos;
        }
    };
});