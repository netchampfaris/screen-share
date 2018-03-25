const { clipboard } = require('electron');

module.exports = {
    random() {
        return Math.random().toString().split('.')[1].slice(1, 5);
    },

    copyToClipboard(text) {
        clipboard.writeText(text + '');
    }
}
