module.exports = class SK_Action extends SK_RootAction {
    async exec(opt, res, view, _v, srcOpt, validationRes){
        super_ytdl.queue_manager.addLinks(opt.links, true)
        res.resolve({})
    }
}