window.super_ytdl = {}

class SK_App_View extends sk_ui_component {
    constructor(opt){
        super(opt)

        this.add.navbar()
        super_ytdl.queueList = this.add.queue_list()
    }
}