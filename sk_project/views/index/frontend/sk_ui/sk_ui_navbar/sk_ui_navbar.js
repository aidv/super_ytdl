class sk_ui_navbar extends sk_ui_component {
    constructor(opt){
        super(opt)

        this.vertical = false

        this.add.button(_c => {
            _c.icon = 'plus'
            _c.text = 'Add videos'
            _c.hint({text: 'Add videos to queue'})

            _c.onClick = ()=>{
                this.showAddLinks('video')
            }
        })

        /*
        this.add.button(_c => {
            _c.icon = 'plus'
            _c.text = 'Add playlists'
            _c.hint({text: 'Add playlists to queue'})

            _c.onClick = ()=>{
                this.showAddLinks('playlist')
            }
        })
        */

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

    showAddLinks(urlType){
        sk.app.add.prompter(_c => {
            _c.closers = ['close', 'escape']
            _c.header.text = `Add ${urlType} to queue`
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
                    var parsedURLs = this.parseURLs(val)
                    actionBtn.text = 'Add ' + parsedURLs.length + ' ' + urlType + (parsedURLs.length > 1 ? 's' : '')
                    actionBtn.disabled = parsedURLs.length === 0
                }
            })

            var performValidationChkBox = _c.promptContent.add.checkbox(_c => {
                _c.height = 32
                _c.text = 'Validate URLs (much slower, but safer)'
            })

            _c.actionBtn.primary = true
            _c.actionBtn.text = 'Add'
            _c.actionBtn.onClick = async ()=>{
                var parsedURLs = this.parseURLs(urlInput.value)

                if (performValidationChkBox.checked) var validURLs = await this.validateURLs(parsedURLs, urlType)
                else var validURLs = parsedURLs

                if (validURLs === 'cancel') return

                sk.toast.success(`Added ${validURLs.length} ${urlType}s`)
                _c.hide()

                super_ytdl.queueList.addLinksToQueue(validURLs)
            }

            _c.prompt()
        })
    }

    parseURLs(data){
        var lines = data.split('\n')
        var valid = []
        
        for (var i in lines){
            var line = lines[i]
            if (line.trim().length > 0) valid.push(line)
        }

        return valid
    }

    async validateURLs(urls, urlType){
        var results = {valid: [], invalid: []}

        var progressBar = undefined
        var modal = sk.app.add.prompter(_c => {
            _c.closers = []
            _c.header.text = `Validating links`
            _c.promptContent.styling += ' fullwidth'
            _c.promptContent.height = 8
            _c.actionBtn.text = 'Cancel'
            var actionBtn = _c.actionBtn

            progressBar = _c.promptContent.add.progressBar(_c => {
                _c.as.bar()

            })

            actionBtn.onClick = ()=>{
                results = 'cancel'
                modal.hide()
            }

            _c.prompt()
        })

        for (var i = 0; i < urls.length; i++){
            if (results === 'cancel') break

            var url = urls[i]

            modal.header.text = `Validating links (${i} of ${urls.length}) (${results.valid.length} valid) (${results.invalid.length} invalid)`
            modal.message.text = url

            var validationRes = await sk.actions.validateURL({url: url, urlType: urlType})
            
            if (results === 'cancel') break

            if (validationRes.isValid) results.valid.push(url)
            else res.invalid.push(url)

            progressBar.progress = sk.utils.map(i, 0, urls.length, 0, 100)
        }

        return results
    }
} 