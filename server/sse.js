module.exports = function (req, res, next) {
    res.sseSetHeaders = () => {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });
    }

    res.sseSend = (id, data) => {
        if (!data) {
            data = id;
        }

        if (typeof data === 'object') {
            data = JSON.stringify(data);
        }

        const payload = `

id: ${id}
data: ${data}

        `.trim() + '\n\n';

        console.log(payload)

        res.write(payload);
    }

    next();
}
