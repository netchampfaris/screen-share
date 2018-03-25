const {
    desktopCapturer,
} = require('electron');

module.exports = function getStream() {
    const onlyVideo = source => ({
        audio: false,
        video: {
            mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: source.id,
                minWidth: 1280,
                maxWidth: 1280,
                minHeight: 720,
                maxHeight: 720
            }
        }
    });

    return new Promise((resolve, reject) => {
        desktopCapturer.getSources({
            types: ['screen']
        }, (err, sources) => {
            const source = sources[0];

            navigator.mediaDevices.getUserMedia(onlyVideo(source))
                .then((stream) => resolve(stream))
        })
    })
}