const fs = require('fs-extra')
const ytmp3dl = require('youtube-mp3-downloader')
const ytdl = require('ytdl-core')
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


    validateURL(url, urlType){
        return new Promise(async (resolve, reject) => {
            if (urlType === 'video'){
                var videoID = url.split('v=')[1]
                try {
                    await ytdl.getInfo(videoID, {})
                    resolve()
                }
                catch(err) {
                    reject()
                }
            }

            if (urlType === 'playlist'){
                var fixURL = url + '&tmp=0'
                var playlistID = fixURL.split('list=')[1]
                playlistID = playlistID.split('&')[0]
                try {
                    var res =  await ytlist(fixURL, 'url')
                    resolve()
                } catch(err) {
                    reject()
                }
            }
        })
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

        var ytID = this.url.split('=')[1]

        var isWin     = process.platform === 'win32'
        var binaryExt = (isWin ? '.exe' : '')

        var ffmpegPath = 'c:/ffmpeg/bin/ffmpeg' + binaryExt

        var outPath = super_ytdl.outputPath
        fs.ensureDirSync(outPath)

        var YD = new ytmp3dl({
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