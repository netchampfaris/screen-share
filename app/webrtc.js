module.exports = {
    createPeerConnection() {
        let peerConnectionConfig = {'iceServers': [{'url': 'stun:stun.services.mozilla.com'}, {'url': 'stun:stun.l.google.com:19302'}]};
        return new RTCPeerConnection(peerConnectionConfig);
    },

}
