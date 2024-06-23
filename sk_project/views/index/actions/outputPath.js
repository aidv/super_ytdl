module.exports = class SK_Action extends SK_RootAction {
    async exec(opt, res, view, _v, srcOpt, validationRes){
        if (opt.action === 'get'){
            res.resolve({path: super_ytdl.outputPath})
        } else {
            super_ytdl.outputRootPath = opt.path,
            super_ytdl.listPath = opt.path + '/list.json',
            super_ytdl.outputPath = opt.path + '/downloaded/'
            res.resolve({error: true})
        }
    }
}