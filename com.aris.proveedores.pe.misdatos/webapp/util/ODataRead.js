sap.ui.define([], function () {
    "use strict";

    // Keep the caller's page size and transport mode. Never cache operational reads.
    return {
        read: function (url, asynchronous, raw, callback) {
            const initial = new URL(url, document.baseURI);
            // Default SAP reads to 800000 records; preserve explicit limits and continuations.
            const pageSize = initial.searchParams.get("$top") || "800000";
            if (!raw && !initial.searchParams.has("$top")) initial.searchParams.set("$top", pageSize);
            const serviceMatch = initial.pathname.match(/^(.*\/sap\/opu\/odata\/sap\/[^/]+\/)/);
            const serviceRoot = serviceMatch && serviceMatch[1];
            let body;
            let finished = false;
            let draining = false;
            let pending = false;
            const tasks = [];
            const nextOf = value => value && (value.__next || value._next || value["@odata.nextLink"]);
            const clearNext = value => {
                delete value.__next;
                delete value._next;
                delete value["@odata.nextLink"];
            };
            const fail = error => {
                if (finished) return;
                finished = true;
                callback({ iCode: -1, c: "ex", u: url, m: "Error HTTP - GET", data: error });
            };
            const continuation = (next, base) => {
                let resolved = new URL(String(next), base);
                if (!serviceRoot) throw new Error("No se pudo resolver el servicio OData");
                const marker = "/sap/opu/odata/sap/";
                const rootTail = serviceRoot.slice(serviceRoot.indexOf(marker));
                const offset = resolved.pathname.indexOf(rootTail);
                if (offset >= 0) resolved.pathname = serviceRoot + resolved.pathname.slice(offset + rootTail.length);
                else if (!resolved.pathname.startsWith(serviceRoot)) throw new Error("Continuación fuera del servicio OData");
                // Rebuild from the original origin. Assigning URL.host alone can retain
                // SAP's internal port (e.g. 44300) when the proxy uses the default port.
                resolved = new URL(resolved.pathname + resolved.search, initial.origin);
                const previous = new URL(base);
                // Preserve omitted filters/projections on the same collection. An expanded
                // child only inherits language/client/format, never its parent's filters.
                previous.searchParams.forEach((value, key) => {
                    const paging = ["$top", "$skip", "$skiptoken"].includes(key);
                    const shared = ["sap-language", "sap-ui-language", "sap-client", "$format"].includes(key);
                    if (!paging && (resolved.pathname === previous.pathname || shared) && !resolved.searchParams.has(key)) {
                        resolved.searchParams.set(key, value);
                    }
                });
                if (!resolved.searchParams.has("$top")) resolved.searchParams.set("$top", pageSize);
                return resolved.href;
            };
            const scan = (value, base) => {
                if (!value || typeof value !== "object") return;
                if (Array.isArray(value.results) && nextOf(value)) {
                    tasks.push({ target: value, next: continuation(nextOf(value), base), visited: new Set([base]) });
                    clearNext(value);
                }
                Object.keys(value).forEach(key => {
                    if (key !== "__metadata") {
                        const child = value[key];
                        if (Array.isArray(child)) child.forEach(row => scan(row, base));
                        else if (child && typeof child === "object") scan(child, base);
                    }
                });
            };
            const succeed = () => {
                finished = true;
                let data = raw ? body : body.results;
                if (Array.isArray(data)) data = data.map(({ __metadata, ...rest }) => rest);
                else if (data && typeof data === "object") delete data.__metadata;
                callback({ iCode: 1, c: "suc", u: url, m: "Exito HTTP - GET", data: data, complete: true });
            };
            // A queue avoids stack growth for synchronous requests with many pages.
            const drain = () => {
                if (draining || pending || finished) return;
                draining = true;
                while (!pending && !finished) {
                    const task = tasks.shift();
                    if (!task) { succeed(); break; }
                    if (task.visited.has(task.next)) { fail(new Error("Continuación OData repetida")); break; }
                    task.visited.add(task.next);
                    pending = true;
                    $.ajax({
                        url: task.next, method: "GET", async: asynchronous,
                        contentType: "application/json", dataType: "json",
                        success: result => {
                            pending = false;
                            try {
                                const page = result.d;
                                if (task.target) {
                                    if (!page || !Array.isArray(page.results)) throw new Error("Página OData inválida");
                                    page.results.forEach(row => task.target.results.push(row));
                                    page.results.forEach(row => scan(row, task.next));
                                    if (nextOf(page)) {
                                        task.next = continuation(nextOf(page), task.next);
                                        tasks.unshift(task);
                                    }
                                } else {
                                    if (!page || typeof page !== "object") throw new Error("Respuesta OData inválida");
                                    body = page;
                                    scan(body, task.next);
                                }
                            } catch (error) { fail(error); }
                            drain();
                        },
                        error: (xhr, status, error) => { pending = false; fail(error || status); }
                    });
                }
                draining = false;
            };
            tasks.push({ next: initial.href, visited: new Set() });
            drain();
        }
    };
});
