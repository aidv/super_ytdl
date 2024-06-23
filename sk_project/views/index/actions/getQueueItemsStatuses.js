module.exports = class SK_Action extends SK_RootAction {
    async exec(opt, res, view, _v, srcOpt, validationRes){
        
        res.resolve({list: super_ytdl.queue_manager.getStatuses()})
    }
}