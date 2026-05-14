const fs = require('fs-extra')
const ytdlp = require('yt-dlp-exec')
//const ytlist = require('youtube-playlist');

module.exports = class Super_YTDL_Queue_Manager {
    constructor(){
        this.list = []

        this.loadList()
    }
    

    loadList(){
        var data = {queued: {}, failed: {}, completed: {}}
        try {
            data = fs.readJSONSync(super_ytdl.listPath)
        } catch(err) {
            fs.writeJSONSync(super_ytdl.listPath, data)
        }

        for (var i in data.queued){
            var queuedItem = data.queued[i]
            var item = this.addLink(queuedItem.url).added
        }

        for (var i in data.completed){
            var completedItem = data.completed[i]
            var item = this.addLink(completedItem.url).added
            item.status = 'completed'
            item.progress = 100
        }

        for (var i in data.failed){
            var failedItem = data.failed[i]
            var item = this.addLink(failedItem.url).added
            item.progress = failedItem.progress
            item.status = 'failed'
            item.errorMsg = failedItem.errorMsg
        }
    }

    saveList(){
        fs.ensureDirSync(super_ytdl.outputRootPath)

        var data = {queued: {}, failed: {}, completed: {}}

        for (var i in this.list){
            var item = this.list[i]
            var info = {url: item.id, status: item.status, errorMsg: item.errorMsg}
            if (item.status === 'queued') data.queued[item.id] = info
            else if (item.status === 'completed') data.completed[item.id] = info
            else if (item.status === 'failed') data.failed[item.id] = info
        }

        fs.writeJSONSync(super_ytdl.listPath, data)
    }

    /***************/

    addLinks(links, save = false){
        var added = {}

        for (var i in links){
            var url = links[i]
            var res = this.addLink(url)
            if (res.added) added[url] = true
        }

        if (save) this.saveList()

        return added
    }

    addLink(url, save = false){
        if (this.findByID(url)) return {existing: item}
        
        var item = new Super_YTDL_Queue_Item({url: url})
        this.list.push(item)

        if (save) this.saveList()

        return {added: item}
    }

    findByID(id){
        for (var i in this.list){
            var item = this.list[i]
            if (item.id === id) return item
        }
    }

    start(){
        if (this.timer) return

        this.timer = setInterval(()=>{
            this.tryNext()
        }, 1000)
    }

    stop(){
        clearInterval(this.timer)
        delete this.timer
    }

    tryNext(){
        if (this.findBusy()) return
        var next = this.findAvailable()
        if (!next) return
        next.download()
        this.saveList()
    }

    findAvailable(){
        for (var i in this.list){
            var item = this.list[i]
            if (item.status === 'queued') return item
        }
    }

    findBusy(){
        for (var i in this.list){
            var item = this.list[i]
            if (item.status === 'busy') return item
        }
    }

    getStatuses(){
        var list = {}

        for (var i in this.list){
            var item = this.list[i]
            list[item.id] = {status: item.status, progress: item.progress, errorMsg: item.errorMsg}
        }

        return list
    }

    resetFailed(){
        for (var i in this.list){
            var item = this.list[i]
            if (item.status !== 'failed') continue
            item.status = 'queued'
            item.progress = 0
            delete item.errorMsg
        }
    }

    clearCompleted(){
        this.list = this.list.filter(item => item.status !== 'completed')
        this.saveList()
    }


    async validateURL(url, urlType){
        try {
            await ytdlp(url, { dumpSingleJson: true, noWarnings: true, simulate: true })
        } catch(err) {
            throw err
        }
    }

    
}

class Super_YTDL_Queue_Item {
    constructor(opt){
        this.id = opt.url
        this.url = this.fixURL(opt.url)

        this.status = 'queued'
        this.progress = 0
    }

    fixURL(url){
        if (url.indexOf('https://') === -1) url = 'https://' + url
        return url
    }

    download(){
        this.status = 'busy'

        const isWin     = process.platform === 'win32'
        const binaryExt = (isWin ? '.exe' : '')
        const ffmpegPath = 'c:/ffmpeg/bin/ffmpeg' + binaryExt

        const outPath = super_ytdl.outputPath
        const tmpPath = super_ytdl.outputRootPath + 'tmp/'
        fs.ensureDirSync(outPath)
        fs.ensureDirSync(tmpPath)

        // Step 1: download raw stream into tmp
        const downloadTemplate = tmpPath + '%(title)s.%(ext)s'

        const proc = ytdlp.exec(this.url, {
            format: 'bestaudio',
            ffmpegLocation: ffmpegPath,
            output: downloadTemplate,
            noPlaylist: true,
            progress: true,
            newline: true
        })

        let downloadedFile = null

        proc.stdout.on('data', (data) => {
            const line = data.toString().trim()
            const match = line.match(/\[download\]\s+(\d+\.?\d*)%/)
            if (match) {
                this.progress = (parseFloat(match[1]) / 2).toFixed(2) // 0-50% for download
                return
            }
            const destMatch = line.match(/\[download\] Destination:\s+(.+)/)
            if (destMatch) downloadedFile = destMatch[1].trim()
        })

        proc.on('close', (code) => {
            if (code !== 0) {
                this.status = 'failed'
                this.errorMsg = 'yt-dlp download exited with code ' + code
                return
            }

            if (!downloadedFile) {
                // fallback: find the file we just downloaded in tmp
                const files = fs.readdirSync(tmpPath)
                if (files.length === 0) {
                    this.status = 'failed'
                    this.errorMsg = 'Downloaded file not found in tmp'
                    return
                }
                downloadedFile = tmpPath + files[files.length - 1]
            }

            // Step 2: extract audio into tmp
            const baseName = require('path').basename(downloadedFile, require('path').extname(downloadedFile))
            const tmpMp3 = tmpPath + baseName + '.mp3'

            // Use ffmpeg directly to convert the already-downloaded file
            const { execFile } = require('child_process')
            execFile(ffmpegPath, ['-y', '-i', downloadedFile, '-vn', '-acodec', 'libmp3lame', '-q:a', '0', tmpMp3], (err) => {
                if (err) {
                    this.status = 'failed'
                    this.errorMsg = err.message
                    fs.remove(downloadedFile).catch(() => {})
                    return
                }

                this.progress = 75

                // Step 3: move mp3 from tmp to output folder
                const finalPath = outPath + baseName + '.mp3'
                fs.move(tmpMp3, finalPath, { overwrite: true }).then(() => {
                    fs.remove(downloadedFile).catch(() => {})
                    this.status = 'completed'
                    this.progress = 100
                }).catch((moveErr) => {
                    this.status = 'failed'
                    this.errorMsg = moveErr.message
                })
            })
        })

        proc.on('error', (err) => {
            this.status = 'failed'
            this.errorMsg = err.message
        })
    }
}