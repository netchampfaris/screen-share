const { remote } = require('electron');
const getStream = require('./stream');
const webrtc = require('./webrtc');
const utils = require('../utils');
const broker = require('./broker');
const localhost = 'http://localhost:4545';

const originalDimensions = [400, 600];
const screenShareDimensions = [1280, 720];

module.exports = class ScreenShareUI {
    constructor(mountPoint) {
        this.prepareDOM(mountPoint);
        this.bindEvents();
        this.$brokerHost.value = 'http://farisansari.in:4545';
        this.setupBroker();
    }

    async startShare() {
        const stream = await getStream();
        this.stream = stream;

        const peerConnection = webrtc.createPeerConnection();
        this.peerConnection = peerConnection;
        peerConnection.addStream(stream);

        const description = await peerConnection.createOffer()
        peerConnection.setLocalDescription(description);

        const shareID = utils.random();
        utils.copyToClipboard(shareID);

        broker.send('initShare', {
            roomName: shareID,
            shareSDP: description
        })
        .then(response => response.text())
        .then(message => {
            console.log(message);
            this.$shareStatus.innerHTML = `Send the code ${shareID.bold()} to share your screen. It is copied to your clipboard`;
        })
        .catch(err => {
            this.$shareStatus.innerHTML = err;
        });

        broker.on('joinSDP:' + shareID, (data) => {
            const description = JSON.parse(data);
            peerConnection.setRemoteDescription(new RTCSessionDescription(description));
        });

        broker.on('joinCandidate:' + shareID, (candidate) => {
            if (candidate) {
                peerConnection.addIceCandidate(JSON.parse(candidate));
            }
        });
    }

    stopShare() {
        this.stream.getTracks().forEach(track => track.stop());
        this.peerConnection.close();

        // broker.send('stopShare', {
        //     roomName
        // });
    }

    joinShare() {
        const shareID = this.$shareID.value;

        if (!shareID) {
            return;
        }

        const peerConnection = webrtc.createPeerConnection();
        peerConnection.onaddstream = (e) => {
            const [width, height] = screenShareDimensions;
            remote.getCurrentWindow().setSize(width, height, true);
            this.$video.srcObject = e.stream;
        }

        peerConnection.onicecandidate = (e) => {
            if (!e.candidate) return;

            broker.send('joinCandidate', {
                roomName: shareID,
                joinCandidate: e.candidate
            });

            this.$video.classList.add('fullscreen');
        }

        peerConnection.oniceconnectionstatechange = (e) => {
            console.log(e, peerConnection.iceConnectionState);

            if (peerConnection.iceConnectionState === 'disconnected') {
                this.$video.srcObject = null;
                this.$video.classList.remove('fullscreen');

                const [width, height] = originalDimensions;
                remote.getCurrentWindow().setSize(width, height, true);
            }
        }

        broker.on('shareInfo', (data) => {
            console.log(data,);
        });

        broker.send('connectShare', {
            roomName: shareID
        })
        .then(res => res.json())
        .then(async res => {
            console.log(res.shareInfo.shareSDP);
            await peerConnection.setRemoteDescription(new RTCSessionDescription(res.shareInfo.shareSDP));
            const description = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(description);

            broker.send('joinSDP', {
                roomName: shareID,
                joinSDP: description
            });
        })
        .catch(err => {
            console.log(err);
            this.$joinStatus.innerHTML = err;
        });


        console.log(shareID);
    }

    setupBroker() {
        const host = this.$brokerHost.value;

        if (!host) {
            return;
        }

        broker.setup(host + '/broker?id=sseConnect');
        broker.on('connection', (connectionStatus) => {
            this.$footerStatus.innerHTML = `connectionStatus: ${connectionStatus}`;
        });
    }

    prepareDOM(mountPoint) {
        mountPoint.innerHTML = this.html();
        this.$wrapper = mountPoint.querySelector('.wrapper');

        this.$startShare = this.$wrapper.querySelector('.start-share');
        this.$stopShare = this.$wrapper.querySelector('.stop-share');
        this.$shareStatus = this.$wrapper.querySelector('.share-status');

        this.$joinShare = this.$wrapper.querySelector('.join-share');
        this.$joinStatus = this.$wrapper.querySelector('.join-status');

        this.$shareID = this.$wrapper.querySelector('.share-id');
        this.$video = this.$wrapper.querySelector('.video');

        this.$footerStatus = this.$wrapper.querySelector('.footer-status');

        this.$brokerHost = this.$wrapper.querySelector('.broker-host');
        this.$brokerConnect = this.$wrapper.querySelector('.broker-connect');
    }

    bindEvents() {
        this.$startShare.addEventListener('click', this.startShare.bind(this));
        this.$joinShare.addEventListener('click', this.joinShare.bind(this));
        this.$stopShare.addEventListener('click', this.stopShare.bind(this));

        this.$brokerConnect.addEventListener('click', this.setupBroker.bind(this));
    }

    html() {
        return `
            <div class="wrapper">
                <section class="section">
                    <h2>Screen Share</h2>
                    <button class="btn start-share">Start Screen Sharing</button>
                    <button class="btn stop-share">Stop Screen Sharing</button>
                    <p class="share-status">
                    </p>
                </section>
                <section class="section">
                    <h2>Join Share</h2>
                    <input class="share-id" type="text" placeholder="12345" />
                    <button class="btn join-share">Join Screen</button>
                    <p class="join-status">
                    </p>
                </section>
                <section class="section">
                    <video class="video" autoplay></video>
                </section>
                <footer class="section">
                    <input class="broker-host" type="text" /> <button class="btn broker-connect">Connect</button>
                    <p class="footer-status">
                    </p>
                </footer>
            </div>
        `
    }
}