global.fs = require('fs')
var __superkraft = require(__dirname + '/superkraft/sk_superkraft.js')

global.super_ytdl = {
    outputRootPath: 'c:/super_ytdl/',
    listPath: 'c:/super_ytdl/list.json',
    outputPath: 'c:/super_ytdl/downloaded/'
}

super_ytdl.queue_manager = new (require(__dirname + '/modules/queue_manager.js'))()

var opt = {
    type: 'wapp',
    root: __dirname,

    projectRoot    : __dirname + '/sk_project',
    postsRoot      : __dirname + '/sk_posts/',
    templates      : __dirname + '/sk_templates/',
    globalActions  : __dirname + '/sk_globalActions/',
    globalFrontend : __dirname + '/sk_globalFrontend/',

    config: __dirname + '/config.json', //won't work in SSC

    database : {},
    auth     : {},

    l10n     : new (require(__dirname + '/modules/l10n/l10n.js'))(),

    //useComplexity: true

    icons: {
        app: __dirname + '/assets/logo.png',
        view: __dirname + '/sk_project/frontend/img/logo.png',
    },
    
    dapp: {
        deeplink: {
            scheme: 'kia-sportage-plus'
        }
    },


    csp: {
        connectSrc: [
            'blob:', 
            
        ],
        frameSrc:   [
        ],
        scriptSrc:  [
            "'unsafe-eval'",


            'blob:', "'unsafe-inline'", '*.s3.amazonaws.com', '*.google.com', '*.google.com/*', '*.cdn-apple.com', 'Cross-Origin-Resource-Policy: cross-origin',
            
        ],
        scriptSrcAttr: [
            "'unsafe-inline'",
        ],
        imgSrc: [

           '*.s3.amazonaws.com',

            '*.jsdelivr.net',
        ],
        fontSrc:    [
            'Cross-Origin-Resource-Policy: cross-origin',

            

            'fonts.googleapis.com', 'fonts.gstatic.com',

            'data:',

            //vanilla fe
        ],
        styleSrc:   [
            "'unsafe-inline'", '*.googleapis.com', '*.gstatic.com', '*.s3.amazonaws.com', '*.google.com', '*.google.com/*',
        
            '*.jsdelivr.net',

            //vanilla fe
        ],
        mediaSrc:   ['blob:', '*.s3.amazonaws.com']
    },

    onPreStart: ()=>{
        
    },

    onReady: async ()=>{
        
    }
}


var sk = new __superkraft(opt)