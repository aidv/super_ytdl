class sk_ui_queue_list extends sk_ui_list {
    constructor(opt){
        super(opt)

        this.styling += ' fill'

        this.header.setup(_c => {
            _c.padding = 8
            this.info = _c.add.fromNew(sk_ui_queue_list_info)
        })

        this.startStatusMonitor()
    }

    addLinksToQueue(links){
        var res = sk.actions.addLinksToQueue({links: links})
        
        for (var id in res.added){
            this.addItem({label: id, url: id})
        }
    }

    addItem(opt){
        return this.items.add(opt)
    }

    onNewItem(item){
        item.paddingRight = 16
        item.progressLabel = item.add.label(_c => {
            _c.text = '🕒'
        })
        item.element.addEventListener('dblclick', _e => {
            sk.toast.success('Coped URL to clipboard')
            navigator.clipboard.writeText(item.info.url);
        })
    }

    findItemByURL(url){
        for (var i in this.list){
            var item = this.list[i]
            if (item.info.label === url) return item
        }
    }


    startStatusMonitor(){
        this.timer = setInterval(()=>{
            this.refreshStatuses()
        }, 100)
    }

    async refreshStatuses(){
        var res = await sk.actions.getQueueItemsStatuses()

        var stats = {
            count: 0,
            iterated: 0,
            queued: 0,
            completed: 0,
            failed: 0
        }

        for (var url in res.list){
            stats.count++
            var item = this.findItemByURL(url)
            if (item) this.setItemStatus({item: item, url: url, info: res.list[url]})
            else item = this.addItem({label: url, url: url})

            var status = res.list[url].status
            stats[status] += 1

            if (status !== 'queued') stats.iterated++
        }

        this.info.setStats(stats.count, stats.iterated, stats.queued, stats.completed, stats.failed)
    }

    setItemStatus(opt){
        if (opt.info.errorMsg){
            opt.item.style.backgroundColor = 'rgb(75,0,0)'
            opt.item.progressLabel.text = 'ERROR: ' + opt.info.errorMsg
            return
        }
        
        opt.item.style.backgroundColor = ''
        if (opt.info.status === 'busy'){
            opt.item.style.backgroundColor = 'blue'
            opt.item.scrollTo()
        }
        if (opt.info.status === 'queued'){
            opt.item.progressLabel.text = '🕒'
            return
        }

    
        opt.item.progressLabel.text = opt.info.progress + '%'
    }
}


class sk_ui_queue_list_info extends sk_ui_component {
    constructor(opt){
        super(opt)

        this.styling += ' fullwidth'

        this.add.fromNew(sk_ui_queue_list_info_outputPath)

        this.counterLabel = this.add.label(_c => {
        })

        this.setStats(0, 0, 0, 0, 0)
    }

    setStats(total, iterated, queued, completed, failed){
        this.counterLabel.text = `📜 ${iterated} of ${total}  |  🕒 ${queued}  |  ✅ ${completed}  |  ⛔ ${failed}`
    }
}


class sk_ui_queue_list_info_outputPath extends sk_ui_component {
    constructor(opt){
        super(opt)

        this.styling += ' fullwidth'
        this.vertical = false

        this.pathLabel = this.add.input(_c => {
            _c.styling += ' fullwidth'
            _c.onChanged = res => {
                this.setPath()
            }
        })

        this.add.iconButton(_c => {
            _c.icon = 'folder'
        })

        this.getPath()
    }

    async getPath(){
        var res = await sk.actions.outputPath({action: 'get'})
        this.pathLabel.value = res.path
    }
    
    async setPath(){
        var res = await sk.actions.outputPath({action: 'set', path: this.pathLabel.value})

        this.pathLabel.color = 'green'
        if (res.error) this.pathLabel.color = 'red'
    }
}