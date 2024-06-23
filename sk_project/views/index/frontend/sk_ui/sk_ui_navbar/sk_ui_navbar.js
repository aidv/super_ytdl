class sk_ui_navbar extends sk_ui_component {
    constructor(opt){
        super(opt)

        this.vertical = false

        this.add.iconButton(_c => {
            _c.icon = 'linkify'

            _c.hint({text: 'Add links to queue'})

            _c.onClick = ()=>{
                this.showAddLinks()
            }
        })

        this.add.simpleActionBtn(_c => {
            _c.text = 'Retry failed'
            _c.hint({text: 'Retry failed links'})

            _c.onClick = ()=>{
                sk.actions.retryFailedLinks()
            }
        })

        this.add.spacer()
    }

    showAddLinks(){
        sk.app.add.prompter(_c => {
            _c.header.text = 'Add links to queue'
            _c.message.remove()

            var urlInput = _c.promptContent.add.textarea(_c => {
            })


            _c.actionBtn.onClick = ()=>{
                var validLinks = this.parseLinks(urlInput.value)
                sk.toast.success(`Added ${validLinks.length} links`)
                _c.hide()

                super_ytdl.queueList.addLinksToQueue(validLinks)
            }

            _c.prompt()
        })
    }

    parseLinks(data){
        var lines = data.split('\n')
        var valid = []
        
        for (var i in lines){
            var line = lines[i]
            if (line.trim().length > 0) valid.push(line)
        }

        return valid
    }
} 