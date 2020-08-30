export default function getMediaBuffer(assetURL) {
    let mimeCodec = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"'
    if ('MediaSource' in window && MediaSource.isTypeSupported(mimeCodec)) {
        let mediaSource = new MediaSource()
        let src = URL.createObjectURL(mediaSource)
        mediaSource.addEventListener('sourceopen', function () {
            let mediaSource = this
            let sourceBuffer = mediaSource.addSourceBuffer(mimeCodec)
            fetchAB(assetURL, function (buf) {
                sourceBuffer.addEventListener('updateend', () => {
                    mediaSource.endOfStream()
                })
                sourceBuffer.appendBuffer(buf)
            })
        })
        return src
    } else {
        console.error('Unsupported MIME type or codec: ', mimeCodec)
    }
}
function fetchAB(url, cb) {
    var xhr = new XMLHttpRequest()
    xhr.open('get', url)
    xhr.responseType = 'arraybuffer'
    xhr.onload = function () {
        cb(xhr.response)
    }
    xhr.send()
}
