module.exports = class SK_Action extends SK_RootAction {
    async exec(opt, res, view, _v, srcOpt, validationRes){
        try {
            await super_ytdl.queue_manager.validateURL(opt.url, opt.urlType)
            res.resolve({isValid: true})
        } catch(err) {
            res.resolve({isValid: false})
        }
    }
}