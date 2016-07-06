// KVSのユーティリティクラス

export class Datum {
    constructor(...args) {
        const kv = arguments.length >= 2;
        this.key = kv ? arguments[0] : Object.keys(arguments[0])[0] || '';
        this.value = kv ? arguments[1] : arguments[0][this.key] || '';
    }

    toMap() {
        const ret = {};
        ret[this.key] = this.value;
        return ret;
    }
}

// localStorage / syncStorage(chrome) のラッパー

export class Storage {
    constructor(sync) {
        this.internal = sync ? chrome.storage.sync : chrome.storage.local;
    }

    get(key, callback) {
        this.internal.get(key, (kv) => {
            callback(new Datum(kv));
        });
    }

    set(datum, callback) {
        this.internal.set(datum.toMap(), callback);
    }

    connect() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.method === 'proxy_getStorage') {
                this.get(request.key, (datum) => {
                    sendResponse({key: datum.key, value: datum.value});
                });
            } else if (request.method === 'proxy_setStorage') {
                this.set(new Datum(request.datum.key,request.datum.value), () => sendResponse(request.datum));
            } else {
                sendResponse({}); // snub them.
            }
            return true;
        });
    }
}

export class ProxyStorage {
    constructor() {
    }

    get(key, callback) {
        chrome.runtime.sendMessage(
            {method: 'proxy_getStorage', key: key},
            (datum) => {
                callback(datum)
            }
        );
    }

    set(datum, callback) {
        chrome.runtime.sendMessage(
            {method: 'proxy_setStorage', datum: datum},
            (datum) => {
                callback(datum)
            }
        );
    }
}
