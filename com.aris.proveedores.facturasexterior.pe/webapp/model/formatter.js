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
				var fechaf = this.getYYYYMMDDSlash(fecha);
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
		getYYYYMMDDSlash: function (e) {
			var t = e.getDate();
			var n = e.getMonth() + 1;
			var r = e.getFullYear();
			if (t < 10) { t = "0" + t; }
			if (n < 10) { n = "0" + n; }
			var o = r + "/" + n + "/" + t;
			return o
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
		toODataDateFromDDMMYYYY: function (sDDMMYYYY) {
			if (!sDDMMYYYY) return null;
			const [dd, mm, yyyy] = sDDMMYYYY.split("/").map(Number);
			const ms = Date.UTC(yyyy, mm - 1, dd); // evita desfase por TZ
			return `/Date(${ms})/`;
		},
		formatNumberForOData: function (v) {
			if (v === null || v === undefined) return "0.00";
			let s = String(v).trim();
			s = s.replace(/\s/g, "");
			const hasComma = s.includes(",");
			const hasDot = s.includes(".");
			if (hasComma && hasDot) {
				s = s.replace(/,/g, "");
			} else if (hasComma && !hasDot) {
				s = s.replace(",", ".");
			} else {
			}
			s = s.replace(/[^0-9.\-]/g, "");
			const n = Number(s);
			if (Number.isNaN(n)) return "0.00";
			return n.toFixed(2);
		},
		formatDDMMYYYY: function (oDate) {
			const dd = String(oDate.getDate()).padStart(2, "0");
			const mm = String(oDate.getMonth() + 1).padStart(2, "0");
			const yyyy = oDate.getFullYear();
			return `${dd}/${mm}/${yyyy}`;
		},
		toDDMMYYYYFromOData: function (sODataDate) {
			if (!sODataDate) return "";
			const m = /\/Date\(([-\d]+)\)\//.exec(String(sODataDate));
			if (!m) return "";
			const ms = parseInt(m[1], 10);
			if (!isFinite(ms) || ms <= 0) return "";
			const d = new Date(ms);
			const y = d.getUTCFullYear();
			if (y < 1970) return "";
			const dd = String(d.getUTCDate()).padStart(2, "0");
			const MM = String(d.getUTCMonth() + 1).padStart(2, "0");

			return `${dd}/${MM}/${y}`;
		},

		// Modifica el formato del estado 		
		_normalizeStatusCode: function (s) {
			const raw = String(s || "").trim();
			if (!raw) return "";
			// si viene "1" => "01", si viene "01" queda "01"
			if (/^\d+$/.test(raw) && raw.length === 1) return raw.padStart(2, "0");
			return raw;
		},
		normalizeToDDMMYYYY: function (vDate) {
			if (vDate === null || vDate === undefined) return "";
			if (vDate instanceof Date && !isNaN(vDate.getTime())) {
				const dd = String(vDate.getDate()).padStart(2, "0");
				const mm = String(vDate.getMonth() + 1).padStart(2, "0");
				const yyyy = vDate.getFullYear();
				return `${dd}/${mm}/${yyyy}`;
			}
			const s = String(vDate).trim();
			if (!s) return "";

			let dd, mm, yyyy;
			let m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
			if (m) {
				dd = Number(m[1]); mm = Number(m[2]); yyyy = Number(m[3]);
			} else {
				m = /^(\d{4})\/(\d{2})\/(\d{2})$/.exec(s);
				if (m) {
					yyyy = Number(m[1]); mm = Number(m[2]); dd = Number(m[3]);
				} else {
					m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
					if (m) {
						yyyy = Number(m[1]); mm = Number(m[2]); dd = Number(m[3]);
					} else {
						return "";
					}
				}
			}
			if (!Number.isFinite(dd) || !Number.isFinite(mm) || !Number.isFinite(yyyy)) return "";
			if (yyyy < 1970 || yyyy > 2100) return "";
			if (mm < 1 || mm > 12) return "";
			if (dd < 1 || dd > 31) return "";
			const d = new Date(Date.UTC(yyyy, mm - 1, dd));
			if (d.getUTCFullYear() !== yyyy || (d.getUTCMonth() + 1) !== mm || d.getUTCDate() !== dd) return "";

			return `${String(dd).padStart(2, "0")}/${String(mm).padStart(2, "0")}/${yyyy}`;
		},
		toODataDateSafe: function (vDate) {
			const sDDMMYYYY = this.normalizeToDDMMYYYY(vDate);
			if (!sDDMMYYYY) return null;
			// Reusa tu función existente (la tuya ya hace Date.UTC)
			return this.toODataDateFromDDMMYYYY(sDDMMYYYY);
		},

		_round2: function (n) {
			n = parseFloat(n) || 0;
			return Math.round((n + Number.EPSILON) * 100) / 100;
		},

		_toNumUI: function (v) {
			if (v === null || v === undefined) return 0;
			let s = String(v).trim();
			if (!s) return 0;
			const hasComma = s.includes(",");
			const hasDot = s.includes(".");
			if (hasComma && hasDot) s = s.replace(/,/g, "");
			else if (hasComma && !hasDot) s = s.replace(/,/g, ".");

			s = s.replace(/\s/g, "").replace(/[^0-9.\-]/g, "");
			const n = parseFloat(s);
			return isNaN(n) ? 0 : n;
		},
		formatDDMMYYYYDateAbapDateSlash: function (e) {
			if (!this.isEmpty(e)) {
				var ms = parseInt(String(e).replace("/Date(", "").replace(")/", ""), 10);
				if (isNaN(ms)) { return ""; }

				var fecha = new Date(ms);
				return this.getDDMMYYYSlashPeru(fecha);
			} else {
				return "";
			}
		},

		formatDDMMYYYYDateAbapDateHourSlash: function (e) {
			if (!this.isEmpty(e)) {
				var ms = parseInt(String(e).replace("/Date(", "").replace(")/", ""), 10);
				if (isNaN(ms)) { return ""; }

				return this.getDDMMYYYYHHMMSSSlashPeru(new Date(ms));
			} else {
				return "";
			}
		},

		getDDMMYYYSlashUTC: function (d) {
			var dd = d.getUTCDate();
			var mm = d.getUTCMonth() + 1;
			var yyyy = d.getUTCFullYear();

			if (dd < 10) { dd = "0" + dd; }
			if (mm < 10) { mm = "0" + mm; }

			return dd + "/" + mm + "/" + yyyy;
		},

		getDDMMYYYYHHMMSSSlashUTC: function (d) {
			var dd = d.getUTCDate();
			var mm = d.getUTCMonth() + 1;
			var yyyy = d.getUTCFullYear();
			var hh = d.getUTCHours();
			var mi = d.getUTCMinutes();
			var ss = d.getUTCSeconds();

			if (dd < 10) { dd = "0" + dd; }
			if (mm < 10) { mm = "0" + mm; }
			if (hh < 10) { hh = "0" + hh; }
			if (mi < 10) { mi = "0" + mi; }
			if (ss < 10) { ss = "0" + ss; }

			return dd + "/" + mm + "/" + yyyy + " " + hh + ":" + mi + ":" + ss;
		},
		getDDMMYYYYPeru: function () {
			const oParts = new Intl.DateTimeFormat("es-PE", {
				timeZone: "America/Lima",
				day: "2-digit",
				month: "2-digit",
				year: "numeric"
			}).formatToParts(new Date());

			const dd = oParts.find(p => p.type === "day")?.value || "";
			const mm = oParts.find(p => p.type === "month")?.value || "";
			const yyyy = oParts.find(p => p.type === "year")?.value || "";

			return `${dd}/${mm}/${yyyy}`;
		},
		getDDMMYYYSlashPeru: function (d) {
			const oParts = new Intl.DateTimeFormat("es-PE", {
				timeZone: "America/Lima",
				day: "2-digit",
				month: "2-digit",
				year: "numeric"
			}).formatToParts(d);

			const dd = oParts.find(p => p.type === "day")?.value || "";
			const mm = oParts.find(p => p.type === "month")?.value || "";
			const yyyy = oParts.find(p => p.type === "year")?.value || "";

			return `${dd}/${mm}/${yyyy}`;
		},
		getDDMMYYYYHHMMSSSlashPeru: function (d) {
			const oParts = new Intl.DateTimeFormat("es-PE", {
				timeZone: "America/Lima",
				day: "2-digit",
				month: "2-digit",
				year: "numeric",
				hour: "2-digit",
				minute: "2-digit",
				second: "2-digit",
				hour12: false
			}).formatToParts(d);

			const dd = oParts.find(p => p.type === "day")?.value || "";
			const mm = oParts.find(p => p.type === "month")?.value || "";
			const yyyy = oParts.find(p => p.type === "year")?.value || "";
			const hh = oParts.find(p => p.type === "hour")?.value || "00";
			const mi = oParts.find(p => p.type === "minute")?.value || "00";
			const ss = oParts.find(p => p.type === "second")?.value || "00";

			return `${dd}/${mm}/${yyyy} ${hh}:${mi}:${ss}`;
		},
	};
});