class sk_ui_navbar extends sk_ui_component {
    constructor(opt){
        super(opt)

        this.vertical = false

        this.add.button(_c => {
            _c.icon = 'plus'
            _c.text = 'Add links'
            _c.hint({text: 'Add links to queue'})

            _c.onClick = ()=>{
                this.showAddLinks()
            }
        })

        this.add.button(_c => {
            _c.icon = 'sync'
            _c.text = 'Retry failed'
            _c.hint({text: 'Retry failed links'})

            _c.onClick = ()=>{
                sk.actions.retryFailedLinks()
            }
        })

        this.add.spacer()

        this.add.button(_c => {
            _c.icon = 'play'
            _c.label.moveBefore(_c._icon)
            _c.text = 'Start'
            _c.hint({text: 'Start ripping'})

            _c.onClick = ()=>{
                sk.actions.startRipping()
            }
        })
    }

    showAddLinks(){
        sk.app.add.prompter(_c => {
            _c.closers = ['close', 'escape']
            _c.header.text = 'Add links to queue'
            _c.message.remove()
            _c.promptContent.styling += ' fullwidth'
            _c.promptContent.height = 256
            _c.actionBtn.disabled = true
            var actionBtn = _c.actionBtn
            var urlInput = _c.promptContent.add.textarea(_c => {
                _c.styling += ' fullwidth fullheight'
                _c.style.overflowWrap = 'unset'
                _c.style.textWrap = 'nowrap'
                _c.onChanged = val => {
                    var validLinks = this.parseLinks(val)
                    actionBtn.text = 'Add ' + validLinks.length + ' links'
                    actionBtn.disabled = validLinks.length === 0
                }
            })

            _c.actionBtn.primary = true
            _c.actionBtn.text = 'Add'
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