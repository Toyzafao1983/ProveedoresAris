sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device"
], function (JSONModel, Device) {
	"use strict";
	return {
		igv: 1.18,
		sinigv: 0.82,

		formatInteger: function (num) {
			if (num) {
				var x = parseInt(num);
				x = isNaN(x) ? '0' : x;
				return x.toString();
			}
		},

		currencyFormat: function (value) {
			try {
				if (value) {
					if (typeof (value) === 'string') {
						var sNumberReplace = value.replaceAll(",", "");
						var iNumber = parseFloat(sNumberReplace);
					} else if (typeof (value) === 'number') {
						var iNumber = parseFloat(value);
					}
					return iNumber.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
				} else {
					return "0.00";
				}
			}
			catch (ex) {
				return "0.00";
			}
		},
		currencyFormatTreeDig: function (value) {
			try {
				if (value) {
					if (typeof (value) === 'string') {
						var sNumberReplace = value.replaceAll(",", "");
						var iNumber = parseFloat(sNumberReplace);
					} else if (typeof (value) === 'number') {
						var iNumber = parseFloat(value);
					}
					return iNumber.toFixed(3).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
				} else {
					return "0.000";
				}
			}
			catch (ex) {
				return "0.000";
			}
		},
		currencyFormatIGV: function (value) {
			try {
				if (value) {
					if (typeof (value) === 'string') {
						var sNumberReplace = value.replaceAll(",", "");
						var iNumber = parseFloat(sNumberReplace) * this.igv;
					} else if (typeof (value) === 'number') {
						var iNumber = parseFloat(value) * this.igv;
					}
					return iNumber.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
				} else {
					return "0.00";
				}
			}
			catch (ex) {
				return "0.00";
			}
		},
		currencyFormatIGVTreeDig: function (value) {
			try {
				if (value) {
					if (typeof (value) === 'string') {
						var sNumberReplace = value.replaceAll(",", "");
						var iNumber = parseFloat(sNumberReplace) * this.igv;
					} else if (typeof (value) === 'number') {
						var iNumber = parseFloat(value) * this.igv;
					}
					return iNumber.toFixed(3).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
				} else {
					return "0.000";
				}
			}
			catch (ex) {
				return "0.000";
			}
		},
		formatMay: function (value) {
			if (value) { return value.toUpperCase(); }
			else { return ""; }
		},
		formatHour: function (oDate) {
			var aDate = oDate.toLocaleString().split(" ")[1].split(":");
			var sValue = "";
			sValue = this.completeZero(aDate[0]) + ":" + this.completeZero(aDate[1]) + ":" + this.completeZero(aDate[2]);
			return sValue;
		},
		formatDate: function (oDate) {
			var aDate = [];
			aDate[2] = String(oDate.getDate());
			aDate[1] = String(oDate.getMonth() + 1);
			aDate[0] = String(oDate.getFullYear());
			var sValue = "";
			sValue = this.completeZero(aDate[0]) + "-" + this.completeZero(aDate[1]) + "-" + this.completeZero(aDate[2]);
			return sValue;
		},
		completeZero: function (sValue) {
			if (sValue.length === 1) {
				sValue = "0" + sValue;
			}
			return sValue;
		},
		formatHourForSap: function (sTime) {
			var aValue = [];
			var sValue = "";
			if (sTime !== null && sTime !== "") {
				aValue = sTime.split(":");
				sValue = "PT" + aValue[0] + "H" + aValue[1] + "M" + aValue[2] + "S";
			} else {
				sValue = "PT00H00M00S";
			}
			return sValue;
		},
		formatDateForSap: function (sDate) {
			var sValue = "";
			if (sDate !== null && sDate !== "") {
				sValue = sDate + "T00:00:00";
			} else {
				sValue = null;
			}
			return sValue;
		},
		minDate: function (sDate) {
			var oDateInitial = new Date(sDate);
			var oDateFinal = new Date(oDateInitial.getFullYear(), oDateInitial.getMonth(), oDateInitial.getDate() + 1);
			return oDateFinal;
		},
		formatYYYYMMDDDateAbapDateSlash: function (e) {
			if (!this.isEmpty(e)) {
				var fecha = new Date(parseInt(e.replace("/Date(", "").replace(")/", "")));
				var fechaf = this.getYYYYMMDDHHMMSSSlash(fecha);
				return fechaf;
			} else { return ""; }
		},
		formatYYYYMMDDDateAbapDateHourSlash: function (e) {
			if (!this.isEmpty(e)) {
				var fecha = new Date(parseInt(e.replace("/Date(", "").replace(")/", "")));
				var fechaf = this.getYYYYMMDDHHMMSSSlash(fecha);
				return fechaf;
			} else { return ""; }
		},
		getYYYYMMDDHHMMSSSlash: function (e) {
			var t = e.getDate();
			var n = e.getMonth() + 1;
			var r = e.getFullYear();
			if (t < 10) { t = "0" + t; }
			if (n < 10) { n = "0" + n; }
			var o = r + "/" + n + "/" + t;
			var i = e.getHours();
			var u = e.getMinutes();
			var a = e.getSeconds();
			o = o + " " + this.zfill(i, 2) + ":" + this.zfill(u, 2) + ":" + this.zfill(a, 2);
			return o
		},
		zfill: function (number, width) {
			var numberOutput = Math.abs(number); /* Valor absoluto del número */
			var length = number.toString().length; /* Largo del número */
			var zero = "0"; /* String de cero */

			if (width <= length) {
				if (number < 0) {
					return ("-" + numberOutput.toString());
				} else {
					return numberOutput.toString();
				}
			} else {
				if (number < 0) {
					return ("-" + (zero.repeat(width - length)) + numberOutput.toString());
				} else {
					return ((zero.repeat(width - length)) + numberOutput.toString());
				}
			}
		},
		formatDayDateHana: function (e) {
			if (e) {
				var split = e.split("T");
				var date = split[0].replaceAll("-", "/");
				var fechaf = this.reverseStringForParameter(date, "/");;
				return fechaf;
			}
		},
		formatYYYYMMDDAbap: function (e) {
			if (!this.isEmpty(e)) {
				var fecha = new Date(e.substr(0, 4) + "/" + e.substr(4, 2) + "/" + e.substr(6, 2));
				var fechaf = this.onGetFormatDate(fecha);
				return fechaf;
			} else { return ""; }
		},
		formatHHMMSSAbap: function (e) {
			if (!this.isEmpty(e)) {
				var sHourf = e.substr(0, 2) + ":" + e.substr(2, 2) + ":" + e.substr(4, 2);
				return sHourf;
			} else { return ""; }
		},
		getYYYYMMDDHHMMSS: function (e) {
			var t = e.getDate();
			var n = e.getMonth() + 1;
			var r = e.getFullYear();
			if (t < 10) {
				t = "0" + t
			}
			if (n < 10) {
				n = "0" + n
			}
			var o = r + "-" + n + "-" + t;
			var i = e.getHours();
			var u = e.getMinutes();
			var a = e.getSeconds();
			o = o + " " + this.zfill(i, 2) + ":" + this.zfill(u, 2) + ":" + this.zfill(a, 2);
			return o
		},
		convertformatDateTotalAbapInDateTotal: function (sValueDate, sValueHour) {
			if (sValueDate != null && sValueDate != "") {
				var hour = "";
				if (sValueHour != null && sValueHour != "") {
					hour = this.convertformatHourAbapInHour(sValueHour);
				}
				var fecha = "";
				if (hour) {
					fecha = new Date(sValueDate.substr(0, 4) + "/" + sValueDate.substr(4, 2) + "/" + sValueDate.substr(6, 2) + " " + hour);
				} else {
					fecha = new Date(sValueDate.substr(0, 4) + "/" + sValueDate.substr(4, 2) + "/" + sValueDate.substr(6, 2));
				}
				return fecha;
			} else {
				return sValue;
			}
		},
		convertformatDateAbapInDate: function (sValue) {
			if (sValue != null && sValue != "") {
				var fecha = new Date(sValue.substr(0, 4) + "/" + sValue.substr(4, 2) + "/" + sValue.substr(6, 2));
				return fecha;
			} else {
				return sValue;
			}
		},
		convertformatHourAbapInHour: function (sValue) {
			if (sValue != null && sValue != "") {
				var hour = sValue.substr(0, 2) + ":" + sValue.substr(2, 2) + ":" + sValue.substr(4, 2);
				return hour;
			} else {
				return sValue;
			}
		},
		convertformatDateInAbap: function (sValue) {
			if (sValue != null && sValue != "") {
				var t = (sValue.getDate()).toString();
				var n = (sValue.getMonth() + 1).toString();
				var r = (sValue.getFullYear()).toString();
				if (t < 10) {
					t = "0" + t
				}
				if (n < 10) {
					n = "0" + n
				}
				var o = r + n + t;
				return o;
			} else {
				return sValue;
			}
		},
		reformatDateString: function (s) {
			var b = s.split(/\D/);
			return b.reverse().join('/');
		},
		formatDayRayDateSl: function (value) {
			if (value) {
				var date = value.replaceAll("-", "/");
				return date;
			} else {
				return "";
			}
		},
		formatDaySlDateRay: function (value) {
			if (value) {
				var date = value.replaceAll("/", "-");
				return date;
			} else {
				return "";
			}
		},
		isEmpty: function (inputStr) {
			var flag = false;
			if (inputStr === '') { flag = true; }
			if (inputStr === null) { flag = true; }
			if (inputStr === undefined) { flag = true; }
			if (inputStr == null) { flag = true; }
			return flag;
		},

		formatODataDateOnly: function (e) {
			if (!this.isEmpty(e)) {
				var fecha = new Date(parseInt(e.replace("/Date(", "").replace(")/", "")));
				var d = fecha.getDate().toString().padStart(2, "0");
				var m = (fecha.getMonth() + 1).toString().padStart(2, "0");
				var y = fecha.getFullYear();
				return d + "/" + m + "/" + y;
			} else {
				return "";
			}
		},
		formatODataDate_ddmmyyyy: function (value) {
			if (!value) return "";

			try {
				if (typeof value === "string" && value.indexOf("/Date(") !== -1) {
					const match = value.match(/\/Date\((\-?\d+)\)\//);
					if (!match) return value;

					const timestamp = parseInt(match[1], 10);
					const date = new Date(timestamp);

					const day = String(date.getUTCDate()).padStart(2, "0");
					const month = String(date.getUTCMonth() + 1).padStart(2, "0");
					const year = date.getUTCFullYear();

					return `${day}/${month}/${year}`;
				}

				if (typeof value === "string" && value.indexOf("T") !== -1) {
					const date = new Date(value);

					const day = String(date.getUTCDate()).padStart(2, "0");
					const month = String(date.getUTCMonth() + 1).padStart(2, "0");
					const year = date.getUTCFullYear();

					return `${day}/${month}/${year}`;
				}

				if (typeof value === "string" && value.indexOf("-") !== -1) {
					const [year, month, day] = value.split("T")[0].split("-");
					return `${day}/${month}/${year}`;
				}

				return value;
			} catch (e) {
				console.error("Error en formatODataDate_ddmmyyyy:", e);
				return value;
			}
		},
		_formatDateForSAP: function (oDate) {
			if (!oDate) return null;
			try {
				if (oDate instanceof Date) {
					return "/Date(" + oDate.getTime() + ")/";
				}
				if (typeof oDate === "string" && oDate.includes("-")) {
					const [year, month, day] = oDate.split("-");
					const d = new Date(year, month - 1, day);
					return "/Date(" + d.getTime() + ")/";
				}
				if (typeof oDate === "string" && oDate.includes("/")) {
					const [day, month, year] = oDate.split("/");
					const d = new Date(year, month - 1, day);
					return "/Date(" + d.getTime() + ")/";
				}
				return null;
			} catch (e) {
				console.error("❌ Error formateando fecha SAP:", e);
				return null;
			}
		},
		_formatDateDDMMYYYY: function (sapDate) {
			if (sapDate === null || sapDate === undefined || sapDate === "") {
				return "";
			}

			try {
				if (typeof sapDate === "string" && sapDate.includes("/Date(")) {
					const timestamp = parseInt(sapDate.replace(/[^0-9]/g, ""), 10);
					const date = new Date(timestamp);
					const day = String(date.getUTCDate()).padStart(2, "0");
					const month = String(date.getUTCMonth() + 1).padStart(2, "0");
					const year = date.getUTCFullYear();

					return `${day}/${month}/${year}`;
				}

				if (typeof sapDate === "string" && sapDate.includes("-")) {
					const sOnlyDate = sapDate.split("T")[0];
					const [year, month, day] = sOnlyDate.split("-");
					if (year && month && day) {
						return `${day}/${month}/${year}`;
					}
				}

				if (sapDate instanceof Date && !isNaN(sapDate.getTime())) {
					const day = String(sapDate.getDate()).padStart(2, "0");
					const month = String(sapDate.getMonth() + 1).padStart(2, "0");
					const year = sapDate.getFullYear();
					return `${day}/${month}/${year}`;
				}

				return String(sapDate);
			} catch (e) {
				return String(sapDate || "");
			}
		},
	};
});