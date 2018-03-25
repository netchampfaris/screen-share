// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const {
    desktopCapturer,
    clipboard
} = require('electron');
const { random } = require('../utils');

window.broker = require('./broker');

document.getElementById('share').addEventListener('click', () => {
    const roomName = random();
    clipboard.writeText(roomName);

    document.querySelector('#shareMessage').innerHTML = `
        Your share code is ${roomName} and is copied to the clipboard
    `

    // getScreenStream()
    //     .then(stream => {
    //         const video = document.querySelector('video');
    //         video.srcObject = stream;
    //     });
});



