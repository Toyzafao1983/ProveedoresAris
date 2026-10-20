const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const apps = ['arisprovmiscomprobantes', 'com.aris.proveedores.facturasexterior.pe',
    'com.aris.proveedores.pe.misdatos', 'com.aris.proveedores.pe.pedidocompra', 'com.proveedor.peticionoferta.pe'];
const root = '/app/S4HANA/sap/opu/odata/sap/ZMMB_PORTALPROVEEDORES/';
const host = 'https://portal.example';
function load(app, file, dependencies = {}, ajax = () => {}) {
    let exported;
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', app, 'webapp', file), 'utf8'), {
        sap: { ui: { define: (names, factory) => { exported = factory(...names.map(name => dependencies[name])); } } },
        document: { baseURI: host + '/site/index.html' },
        window: { location: { origin: host, href: host + '/launchpad' } }, URL, Map, Set, Promise,
        $: { ajax }, jQuery: { sap: { getModulePath: route => "/" + route } }, navigator: {}, console
    });
    return exported;
}
function runRead(app, url, pages, asynchronous = false, raw = false) {
    const calls = [];
    let callbacks = 0;
    let syncResult;
    let resolve;
    const promise = new Promise(done => { resolve = done; });
    const reader = load(app, 'util/ODataRead.js', {}, options => {
        calls.push(options);
        const respond = () => {
            const page = pages(options.url, calls.length);
            if (page.error) options.error({}, 'error', page.error);
            else options.success(JSON.parse(JSON.stringify(page)));
        };
        if (options.async) queueMicrotask(respond);
        else respond();
    });
    reader.read(url, asynchronous, raw, value => { callbacks++; syncResult = value; resolve(value); });
    return { calls, promise, get result() { return syncResult; }, get callbacks() { return callbacks; } };
}

for (const app of apps) {
    test(`${app}: relative application routes use the document base`, () => {
        const run = runRead(app, 'S4HANA/sap/opu/odata/sap/ZMMB_PORTALPROVEEDORES/Supplier?$top=3000', requested => {
            assert.equal(new URL(requested).pathname, '/site/S4HANA/sap/opu/odata/sap/ZMMB_PORTALPROVEEDORES/Supplier');
            return { d: { results: [] } };
        });
        assert.equal(run.result.iCode, 1);
    });
    test(`${app}: completes >5000 rows, keeps top/filter/skiptoken and proxy`, () => {
        const filter = "SupplierCode eq '000001'";
        const url = root + 'Supplier?$top=8000&$filter=' + encodeURIComponent(filter);
        const run = runRead(app, url, (requested, count) => {
            const parsed = new URL(requested);
            assert.equal(parsed.origin, host);
            assert.equal(parsed.searchParams.get('$top'), '8000');
            assert.equal(parsed.searchParams.get('$filter'), filter);
            if (count === 1) return { d: { results: Array.from({ length: 5000 }, (_, id) => ({ id, __metadata: {} })),
                __next: 'https://internal.sap:44300/sap/opu/odata/sap/ZMMB_PORTALPROVEEDORES/Supplier?$skiptoken=A%2BB' } };
            assert.equal(parsed.searchParams.get('$skiptoken'), 'A+B');
            return { d: { results: [{ id: 5000 }] } };
        });
        assert.equal(run.result.iCode, 1);
        assert.equal(run.result.data.length, 5001);
        assert.equal(run.result.data[0].__metadata, undefined);
        assert.equal(run.callbacks, 1);
        assert.ok(run.calls.every(call => call.async === false));
    });
    test(`${app}: async root and expanded continuations, preserving raw shape`, async () => {
        const run = runRead(app, root + 'Supplier?$top=3000', (url, count) => {
            assert.equal(new URL(url).searchParams.get('$top'), '3000');
            if (count === 1) return { d: { results: [{ SupplierCode: '1', to_Contacts: {
                results: [{ id: 1 }], __next: "https://internal.sap:44300/sap/opu/odata/sap/ZMMB_PORTALPROVEEDORES/Supplier('1')/to_Contacts?$skiptoken=contacts" } }],
                __next: root + 'Supplier?$skiptoken=root' } };
            if (url.includes('to_Contacts')) return { d: { results: [{ id: 2 }] } };
            return { d: { results: [{ SupplierCode: '2' }] } };
        }, true, true);
        assert.equal(run.result, undefined);
        const result = await run.promise;
        assert.equal(result.data.results.length, 2);
        assert.equal(result.data.results[0].to_Contacts.results.length, 2);
        assert.equal(result.data.__next, undefined);
        assert.equal(result.data.results[0].to_Contacts.__next, undefined);
        assert.equal(run.callbacks, 1);
        assert.ok(run.calls.every(call => call.async === true));
    });
    test(`${app}: continuation errors never return partial success`, () => {
        const run = runRead(app, root + 'Supplier?$top=10000', (_, count) => count === 1 ?
            { d: { results: [{ id: 1 }], __next: '?$skiptoken=next' } } : { error: 'SAP unavailable' });
        assert.equal(run.result.iCode, -1);
        assert.equal(run.result.complete, undefined);
        assert.equal(run.callbacks, 1);
    });
    test(`${app}: rejects repeated and out-of-service continuations`, () => {
        for (const next of ['?$top=8000', 'https://internal.sap:44300/sap/opu/odata/sap/OTHER/Items?$skip=1']) {
            const run = runRead(app, root + 'Supplier?$top=8000', () => ({ d: { results: [], __next: next } }));
            assert.equal(run.result.iCode, -1);
            assert.equal(run.calls.length, 1);
        }
    });
    test(`${app}: default large top, explicit small top, empty lists and single entity`, () => {
        for (const top of ['', '?$top=100']) {
            const run = runRead(app, root + 'Supplier' + top, requested => {
                assert.equal(new URL(requested).searchParams.get('$top'), top ? '100' : '2147483647');
                return { d: { results: [] } };
            });
            assert.equal(run.result.iCode, 1);
            assert.equal(run.result.data.length, 0);
        }
        const run = runRead(app, root + "Supplier('1')", requested => {
            assert.equal(new URL(requested).searchParams.has('$top'), false);
            return { d: { SupplierCode: '1', __metadata: {} } };
        }, false, true);
        assert.equal(run.result.data.SupplierCode, '1');
        assert.equal(run.result.data.__metadata, undefined);
    });
    test(`${app}: catalogs share pending reads and copies; operational reads stay fresh`, () => {
        const pending = [];
        const transport = { ERPGetAsync: (url, cb) => pending.push(cb) };
        const services = load(app, 'services/Services.js', { '../util/utilHttp': transport });
        const component = {};
        let user = 'user1';
        const context = { getOwnerComponent: () => component, getUserLoged: () => user };
        const catalog = root + 'Status?$format=json';
        const received = [];
        const read = url => services.getoDataERPAsync(context, url, value => received.push(value));
        read(catalog); read(catalog);
        assert.equal(pending.length, 1);
        pending[0]({ iCode: 1, complete: true, data: [{ Status: '01' }] });
        received[0].data[0].Status = 'changed';
        assert.equal(received[1].data[0].Status, '01');
        read(catalog);
        assert.equal(pending.length, 1);
        read(root + 'Supplier'); read(root + 'Supplier');
        assert.equal(pending.length, 3);
        read(catalog + '&sap-language=EN');
        assert.equal(pending.length, 4);
        user = 'user2'; read(catalog);
        assert.equal(pending.length, 5);
    });
    test(`${app}: failed/incomplete catalogs are retried`, () => {
        for (const result of [{ iCode: -1 }, { iCode: 1, next: '?$skip=1' }]) {
            let calls = 0;
            const services = load(app, 'services/Services.js', { '../util/utilHttp': {
                ERPGetSync: (url, cb) => { calls++; cb(result); }
            } });
            const component = {};
            const context = { getOwnerComponent: () => component, getUserLoged: () => 'u' };
            services.getoDataERPSync(context, root + 'Status', () => {});
            services.getoDataERPSync(context, root + 'Status', () => {});
            assert.equal(calls, 2);
        }
    });
    test(`${app}: identity shares requests across screens, copies, scopes and retries`, async () => {
        const base = load(app, 'controller/BaseController.js', {
            'sap/ui/core/mvc/Controller': { extend: (name, definition) => definition }
        });
        const component = {};
        let calls = 0;
        let user = 'user1';
        const context = {
            getOwnerComponent: () => component, getUserLoged: () => user,
            _loadUsers: async () => { calls++; return { Resources: [{ name: 'original' }] }; }
        };
        const [first, second] = await Promise.all([
            base._getUsers.call(context), base._getUsers.call(context)
        ]);
        assert.equal(calls, 1);
        first.Resources[0].name = 'changed';
        assert.equal(second.Resources[0].name, 'original');
        user = 'user2'; await base._getUsers.call(context);
        assert.equal(calls, 2);
        context._loadUsers = async () => { calls++; throw Error('offline'); };
        user = 'user3';
        await assert.rejects(base._getUsers.call(context));
        await assert.rejects(base._getUsers.call(context));
        assert.equal(calls, 4);
    });
}

test('synchronous continuation queue handles many pages without recursion', () => {
    const run = runRead(apps[0], root + 'Supplier?$top=8000', (_, count) => ({ d: {
        results: [{ id: count }], ...(count < 1500 ? { __next: '?$skiptoken=' + count } : {})
    } }));
    assert.equal(run.result.iCode, 1);
    assert.equal(run.result.data.length, 1500);
});

// Main starts identity and invoice filters in the same Promise.all. The legacy
// filter reads BaseController's module context before the identity request resolves.
test('Mis comprobantes initializes the legacy context before concurrent startup reads', async () => {
    const calls = [];
    const base = load(apps[0], 'controller/BaseController.js', {
        'sap/ui/core/mvc/Controller': { extend: (name, definition) => definition },
        'arisprovmiscomprobantes/services/Services': {
            getoDataERPSync: (context, url, callback) => {
                calls.push({ context, url });
                callback({ iCode: -1 });
            }
        },
        'arisprovmiscomprobantes/util/util': {
            response: { validateAjaxGetERPNotMessage: (result, handlers) => handlers.error() }
        }
    });
    const component = {};
    const controller = {
        local: false, route: 'arisprovmiscomprobantes',
        getOwnerComponent: () => component, getUserLoged: () => 'user',
        _loadUsers: async () => ({ Resources: [{ name: 'original' }] })
    };
    const results = await Promise.all([
        base._getUsers.call(controller),
        base._getMisComprobantesFilter.call(controller)
    ]);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].context, controller);
    assert.ok(calls[0].url.includes('/S4HANA/sap/opu/odata/sap/'));
    assert.equal(results[0].Resources[0].name, 'original');
    // Repeat on a cached identity with a new screen/controller.
    const second = { ...controller };
    await Promise.all([base._getUsers.call(second), base._getMisComprobantesFilter.call(second)]);
    assert.equal(calls[1].context, second);
});

test('SAP continuation preserves remaining top: 8000 requested, 5000 + 3000 returned', () => {
    const run = runRead(apps[0], root + 'Supplier?$top=8000', (url, count) => {
        const parsed = new URL(url);
        assert.equal(parsed.searchParams.get('$top'), count === 1 ? '8000' : '3000');
        assert.equal(parsed.origin, host);
        if (count === 1) return { d: {
            results: Array.from({ length: 5000 }, (_, id) => ({ id })),
            __next: 'https://internal.sap:44300/sap/opu/odata/sap/ZMMB_PORTALPROVEEDORES/Supplier?$top=3000&$skiptoken=5000'
        } };
        assert.equal(parsed.searchParams.get('$skiptoken'), '5000');
        return { d: { results: Array.from({ length: 3000 }, (_, id) => ({ id: id + 5000 })) } };
    });
    assert.equal(run.calls.length, 2);
    assert.equal(run.result.data.length, 8000);
    assert.equal(run.result.data[7999].id, 7999);
});

test('continuations use the exact application origin, including protocol and port', () => {
    for (const appOrigin of [host, host + ':8443']) {
        const run = runRead(apps[0], appOrigin + root + 'Supplier?$top=8000', (_, count) => ({ d: {
            results: [{ id: count }], ...(count === 1 ? {
                __next: 'http://internal.sap:8000/sap/opu/odata/sap/ZMMB_PORTALPROVEEDORES/Supplier?$top=3000&$skiptoken=5000'
            } : {})
        } }));
        assert.equal(run.result.iCode, 1);
        assert.equal(run.calls.length, 2);
        assert.equal(new URL(run.calls[1].url).origin, appOrigin);
        assert.equal(new URL(run.calls[1].url).searchParams.get('$top'), '3000');
    }
});

test('Mis datos consumes completed supplier results with the actual UI5 size-limit API', async () => {
    for (const count of [3, 8001]) {
        const rows = Array.from({ length: count }, (_, index) => ({
            SupplierCode: String(index), TaxID1: '123', TaxID2: '',
            to_Emails: { results: [] }
        }));
        const view = load(apps[2], 'controller/View.controller.js', {
            'com/aris/proveedores/pe/misdatos/controller/BaseController': {
                extend: (name, definition) => definition
            },
            'com/aris/proveedores/pe/misdatos/services/Services': {
                getoDataERPSync: (context, url, callback) => callback({ data: rows })
            },
            'com/aris/proveedores/pe/misdatos/util/util': {
                response: { validateAjaxGetERPNotMessage: (result, handlers) => handlers.success(result) }
            }
        });
        // sap.ui.model.Model exposes setSizeLimit but no getSizeLimit.
        const models = [{ setSizeLimit(value) { this.limit = value; } },
            { setSizeLimit(value) { this.limit = value; } }];
        const controller = {
            local: false, route: 'com.aris.proveedores.pe.misdatos',
            getModel: name => models[name === 'oModelProyect' ? 0 : 1],
            isEmpty: value => !value || (Array.isArray(value) && !value.length),
            maskTaxId: value => value,
            _dedupeSuppliersByBP: values => values,
            _byId: () => ({ getItems: () => [] })
        };
        // The existing detail loader initializes the module's controller context.
        await view._getDataDetalle.call(controller, '1');
        const response = await view._getData.call(controller, {});
        assert.equal(response.sEstado, 'S');
        assert.equal(response.oResults.length, count);
        assert.equal(models[0].limit, Math.max(8000, count));
        assert.equal(models[1].limit, Math.max(8000, count));
    }
});
