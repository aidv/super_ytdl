var fs = require('fs-extra')
var youtube = require('youtube-mp3-downloader')

module.exports = class Super_YTDL_Queue_Manager {
    constructor(){
        this.list = []

        this.loadList()
        this.start()
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
            var item = this.addLink(queuedItem.url)
        }

        for (var i in data.completed){
            var completedItem = data.completed[i]
            var item = this.addLink(completedItem.url)
            item.status = 'completed'
            item.progress = 100
        }

        for (var i in data.failed){
            var failedItem = data.failed[i]
            var item = this.addLink(failedItem.url)
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
            var info = {url: item.originalURL, status: item.status, errorMsg: item.errorMsg}
            if (item.status === 'queued') data.queued[item.originalURL] = info
            else if (item.status === 'completed') data.completed[item.originalURL] = info
            else if (item.status === 'failed') data.failed[item.originalURL] = info
        }

        fs.writeJSONSync(super_ytdl.listPath, data)
    }

    /***************/

    addLinks(links, save = false){
        for (var i in links) this.addLink(links[i])
        if (save) this.saveList()
    }

    addLink(url, save = false){
        var item = new Super_YTDL_Queue_Item({url: url})
        this.list.push(item)

        if (save) this.saveList()

        return item
    }

    start(){
        this.timer = setInterval(()=>{
            this.tryNext()
        }, 1000)
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
            list[item.originalURL] = {status: item.status, progress: item.progress, errorMsg: item.errorMsg}
        }

        return list
    }

    resetFailed(){
        for (var i in this.list){
            var item = this.list[i]
            if (item.status !== 'failed') continue
            item.status = 'queued'
            delete item.errorMsg
        }
    }
}

class Super_YTDL_Queue_Item {
    constructor(opt){
        this.originalURL = opt.url
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

        var ytID = this.url.split('=')[1]

        var isWin     = process.platform === 'win32'
        var binaryExt = (isWin ? '.exe' : '')

        var ffmpegPath = 'c:/ffmpeg/bin/ffmpeg' + binaryExt

        var outPath = super_ytdl.outputPath
        fs.ensureDirSync(outPath)

        var YD = new youtube({
            ffmpegPath: ffmpegPath,                 // FFmpeg binary location
            outputPath: outPath,                    // Output file location (default: the home directory)
            youtubeVideoQuality: 'highestaudio',    // Desired video quality (default: highestaudio)
            queueParallelism: 1,                    // Download parallelism (default: 1)
            progressTimeout: 10,                  // Interval in ms for the progress reports (default: 1000)
            allowWebm: false                        // Enable download from WebM sources (default: false)
        })

        

        YD.on('finished', (err, data)=>{
            if (err){
                this.status = 'failed'
                this.errorMsg = JSON.stringify(error)
                return
            }
            
            this.status = 'completed'
        })
        
        YD.on('error', error => {
            this.status = 'failed'
            this.errorMsg = JSON.stringify(error)
        })
        
        YD.on('progress', res => {
            this.progress = res.progress.percentage.toFixed(2)
        })

        
        YD.download(ytID)
    }
}