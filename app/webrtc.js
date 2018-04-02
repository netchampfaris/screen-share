module.exports = {
    createPeerConnection() {
        let peerConnectionConfig = {
            iceServers: [
                {
                    'urls': 'stun:stun.services.mozilla.com'
                },
                {
                    'urls': 'stun:stun.l.google.com:19302'
                }
            ]
        };
        return new RTCPeerConnection(peerConnectionConfig);
    }
}