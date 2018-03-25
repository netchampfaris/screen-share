const express = require('express');
const app = express();
const port = 4545;

const events = {};
const shareData = {};
const sseConnections = [];

// Server Side Events Middleware
const sse = require('./sse');
app.use(sse);

app.get('/broker', (req, res) => {
    if (!('id' in req.query)) {
        console.log('Invalid broker request');
        res.status(404).send('Not found');
    }
    const id = req.query.id;
    const data = JSON.parse(req.query.data || '{}');
    const handler = events[id];

    if (handler) {
        handler(data, res);
    } else {
        res.send('no handler');
    }
});

events['sseConnect'] = function(data, res) {
    res.sseSetHeaders();
    res.sseSend('connected');
    sseConnections.push(res);
}

events['initShare'] = function(data, res) {
    const { roomName, shareSDP } = data;
    shareData[roomName] = {
        shareSDP
    }

    res.status(200).send('Share created on room ' + roomName);
}

events['connectShare'] = function(data, res) {
    const { roomName } = data;
    const shareInfo = shareData[roomName];

    if (!shareInfo) {
        res.status(404).send('Invalid room name');
    }
    res.send(JSON.stringify({
        shareInfo
    }));
}

events['joinSDP'] = function(data, res) {
    const { roomName, joinSDP } = data;

    const shareInfo = shareData[roomName];
    shareInfo.joinSDP = joinSDP;

    sseConnections.forEach(conn => {
        conn.sseSend('joinSDP:' + roomName, joinSDP);
    });

    res.sendStatus(200);
}

events['joinCandidate'] = function(data, res) {
    const { roomName, joinCandidate } = data;

    sseConnections.forEach(conn => {
        conn.sseSend('joinCandidate:' + roomName, joinCandidate);
    });

    res.sendStatus(200);
}

app.listen(port, () => console.log('Listening on', port));
