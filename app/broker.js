let source;
let host;
let eventHandlers = {};

function queryBuilder(obj) {
    const urlparams = new URLSearchParams();
    for (let key in obj) {
        const value = obj[key];
        if (typeof value === 'obj') {
            value = JSON.stringify(value);
        }
        urlparams.append(key, value);
    }
    return urlparams.toString();
}

module.exports = {
    setup(_host) {
        if (source) {
            source.close();
        }

        host = _host.split('?')[0];
        source = new EventSource(_host);

        source.addEventListener('message', (e) => {
            const id = e.lastEventId;
            const data = e.data;

            this.trigger(id, data);
        });

        source.addEventListener('open', (e) => {
            this.trigger('connection', true);
        }, false);

        source.addEventListener('error', (e) => {
            if (e.target.readyState == EventSource.CLOSED) {
                this.trigger('connection', false);
            } else if (e.target.readyState == EventSource.CONNECTING) {
                this.trigger('connection', 'connecting');
            }
        }, false)
    },

    send(id, data) {
        if (typeof data === 'object') {
            data = JSON.stringify(data);
        }

        const query = queryBuilder({ id, data });
        return fetch(`${host}?${query}`);
    },

    on(id, handler) {
        const handlers = eventHandlers[id] || [];
        handlers.push(handler);
        eventHandlers[id] = handlers;
    },

    trigger(id, ...args) {
        const handlers = eventHandlers[id] || [];
        for (let handler of handlers) {
            handler(...args);
        }
    }
}
