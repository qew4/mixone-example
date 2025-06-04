const WENJIAN = {
    read: function () {
        console.log('Electron version:', process.versions.electron);
        console.log('Node.js version:', process.versions.node);
        console.log('Chromium version:', process.versions.chrome);
        return 'hello world';
    },
    write: function (data) {
        console.log(data);
    }
}

module.exports = WENJIAN;