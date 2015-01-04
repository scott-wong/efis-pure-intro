fis.config.set('project.name', 'efis');

//modules下html不发布
fis.config.get('roadmap.path').unshift({
    reg: /^\/modules\/(.*)\.(html)$/i,
    release: false
});
//公共js打包在一起
fis.config.set('pack', {
    'pkg/lib.js': [
        '/static/mod/mod.js',
        '/static/jquery/jquery.js',
        '/modules/avalon/avalon.js'
    ]
});