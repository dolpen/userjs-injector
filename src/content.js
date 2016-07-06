import {Datum,ProxyStorage} from "./storage.js";

(function (d, w, f) {
    if (d.readyState !== 'loading') {
        f();
    } else {
        d.addEventListener('DOMContentLoaded', f);
    }
})(document, window, function () {
    const storage = new ProxyStorage();
    const url = location.host;
    storage.get(url, (datum) => {
        if(!(datum.value && datum.value.length > 0))return;
        const parent = document.getElementsByTagName('body')[0];
        const script = document.createElement('script');
        script.setAttribute('type', 'text/javascript');
        script.textContent = datum.value;
        return parent.appendChild(script);
    });
});

