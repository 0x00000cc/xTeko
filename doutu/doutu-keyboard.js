scriptVersion = 2.1

/*  问题图片 url 集合 
    部分图片会造成本脚本崩溃，需要筛选出去
    只能自己排查问题图片 url
*/
var errorGroup = ["https://ws3.sinaimg.cn/bmiddle/9150e4e5ly1fllhhqjon9g206o06otfv.gif"]

/*  长按图片和点击图片  
    0 保存到剪贴板 
    1 保存到相册
*/
// 长按图片
var longTag = 1

// 点击图片
var tapTag = 0

// 当前页码
var page = 1

// 类型 0 全部 1 动图 2 静图
var mime = 0

// 是否还有下一页
var pageNext = true

$ui.render({
    props: {
        title: "斗图"
    },
    views: [{
            type: "button",
            props: {
                id: "button-static",
                title: "静图"
            },
            layout: function(make) {
                make.right.top.inset(10)
                make.size.equalTo($size(64, 32))
            },
            events: {
                tapped: function(sender) {
                    mime = 2
                    search()
                }
            }
        },
        {
            type: "button",
            props: {
                id: "button-move",
                title: "动图"
            },
            layout: function(make) {
                make.top.inset(10)
                make.right.equalTo($("button-static").left).inset(5)
                make.size.equalTo($size(64, 32))
            },
            events: {
                tapped: function(sender) {
                    mime = 1
                    search()
                }
            }
        },
        {
            type: "button",
            props: {
                id: "button-all",
                title: "全部"
            },
            layout: function(make) {
                make.top.inset(10)
                make.right.equalTo($("button-move").left).inset(5)
                make.size.equalTo($size(64, 32))
            },
            events: {
                tapped: function(sender) {
                    mime = 0
                    search()
                }
            }
        },
        {
            type: "input",
            props: {
                placeholder: "输入关键字"
            },
            layout: function(make) {
                make.top.left.inset(10)
                make.right.equalTo($("button-all").left).offset(-10)
                make.height.equalTo($("button-all"))
            },
            events: {
                ready: function(sender) {
                    // if ($clipboard.text) {
                    //     sender.text = $clipboard.text
                    //     $delay(0.5, function() {
                    //         search()
                    //     })
                    // }
                },
                returned: function(sender) {
                    mime = 0
                    page = 1
                    search()
                }
            }
        },
        {
            type: "button",
            props: {
                id: "button-delete",
                title: "删除"
            },
            layout: function(make, view) {
                make.top.equalTo($("input").bottom).offset(10)
                make.left.inset(10)
                make.height.equalTo(32)
                make.width.equalTo(view.super.width).multipliedBy(0.25).offset(-(35 / 4))
            },
            events: {
                tapped: function(sender) {
                    $photo.delete({
                        count: 1,
                        handler: function(success) {

                        }
                    })
                }
            }
        },
        {
            type: "button",
            props: {
                id: "button-paste",
                title: "粘贴"
            },
            layout: function(make, view) {
                make.top.equalTo($("input").bottom).offset(10)
                make.left.equalTo($("button-delete").right).offset(5)
                make.height.equalTo(32)
                make.width.equalTo($("button-delete").width)
            },
            events: {
                tapped: function(sender) {
                    if ($clipboard.text) {
                        $("input").text = $clipboard.text
                    }
                }
            }
        },
        {
            type: "button",
            props: {
                id: "button-before",
                title: "上一页"
            },
            layout: function(make, view) {
                make.top.equalTo($("input").bottom).offset(10)
                make.left.equalTo($("button-paste").right).offset(5)
                make.height.equalTo(32)
                make.width.equalTo($("button-paste").width)
            },
            events: {
                tapped: function(sender) {
                    if (page == 1) {
                        $ui.toast("已经是第一页了")
                        return
                    }
                    page--
                    search()
                }
            }
        },
        {
            type: "button",
            props: {
                id: "button-after",
                title: "下一页"
            },
            layout: function(make, view) {
                make.top.equalTo($("input").bottom).offset(10)
                make.left.equalTo($("button-before").right).offset(5)
                make.height.equalTo(32)
                make.width.equalTo($("button-before").width)
            },
            events: {
                tapped: function(sender) {
                    if (pageNext == false) {
                        $ui.toast("已经是最后一页")
                        return
                    }
                    page++
                    search()
                }
            }
        },
        {
            type: "matrix",
            props: {
                columns: 4,
                itemHeight: 88,
                spacing: 10,
                template: [{
                    type: "image",
                    props: {
                        id: "image",
                        align: $align.center,
                    },
                    layout: $layout.fill
                }, {
                    type: "label",
                    props: {
                        id: "label",
                        textColor: $color("clear"),
                        align: $align.center,
                    },
                    layout: $layout.fill,
                    events: {
                        longPressed: function(sender) {
                            $console.info(sender.sender.text)
                            $http.download({
                                url: sender.sender.text,
                                handler: function(resp) {
                                    save(resp.data, longTag)
                                }
                            })
                        }
                    }
                }]
            },
            layout: function(make) {
                make.left.bottom.right.equalTo(0)
                make.top.equalTo($("button-before").bottom).offset(10)
            },
            events: {
                didSelect: function(sender, indexPath, object) {
                    $http.download({
                        url: object.image.src,
                        handler: function(resp) {
                            save(resp.data, tapTag)
                        }
                    })
                }
            }
        },
        {
            type: "label",
            props: {
                id: "label-loading",
                lines: 0,
                text: "请粘贴剪贴板内容 or 输入关键字\n点击搜索",
                bgcolor: $color("#FFFFFF"),
                align: $align.center
            },
            layout: function(make, view) {
                make.top.equalTo(92)
                make.left.right.equalTo(0)
                make.bottom.equalTo(view.super.bottom).offset(-50)
            }
        }
    ]
})

function save(resp, tag) {
    if (tag == 0) {
        $clipboard.image = resp
        $ui.toast("已经复制到剪贴板")
    } else {
        $photo.save({
            data: resp,
            handler: function(success) {
                $ui.toast("已经保存到相册")
            }
        })
    }
}

function search() {
    var loadingView = $("label-loading")
    loadingView.text = "加载中..."
    loadingView.hidden = false
    var keyword = $("input").text
    $("input").blur()
    var url = "https://www.doutula.com/api/search?keyword=" + encodeURIComponent(keyword) + "&mime=" + mime + "&page=" + page
    $ui.loading(true)
    $http.get({
        url: url,
        handler: function(resp) {
            if (resp.error) {
                loadingView.text = "网络错误"
                return
            }
            $ui.loading(false)
            loadingView.hidden = true
            var data = resp.data.data.list
            pageNext = (resp.data.data.more == 1)
            setPicData(data)
        }
    })
}

function setPicData(data) {

    if (data.length == 0) {
        $("label-loading").text = "没有相关表情"
        $("label-loading").hidden = false
        return
    }
    var dataTuple = data.map(function(item) {
        var imageUrl = item.image_url
        return imageUrl
    })

    for (var i = 0, l = errorGroup.length; i < l; i++) {
        var errorString = errorGroup[i];
        for (var j = 0, len = dataTuple.length; j < len; j++) {
            if (dataTuple[j] == errorString) {
                dataTuple.splice(j, 1)
            }
        }
    }
    var sdfs = dataTuple.map(function(item) {
        return { image: { src: item }, label: { text: item } }
    })
    $console.info(sdfs)

    $("matrix").data = sdfs

    $("matrix").scrollTo({
        indexPath: $indexPath(0, 0),
        animated: false
    })
}

//检查版本
function checkupVersion() {
    $http.get({
        url: "https://raw.githubusercontent.com/0x00000cc/xTeko/master/doutu/UpdateInfo",
        handler: function(resp) {
            $console.info(resp.data)
            var version = resp.data.version;
            var message = resp.data.message;
            var updateUrl = resp.data.updateUrl;
            if (version > scriptVersion) {
                $ui.alert({
                    title: "发现新版本",
                    message: message,
                    actions: [{
                            title: "忽略",
                            handler: function() {}
                        },
                        {
                            title: "更新",
                            handler: function() {
                                $app.openURL(encodeURI(updateUrl))
                                $app.close()
                            }
                        }
                    ]
                })
            }
        }
    })
}

if ($app.env == $env.keyboard) {
    $delay(1, function() {
        // 检查更新
        checkupVersion()
    })
} else {
    checkupVersion()
}

function speech() {
    $("input").text = $keyboard.selectedText
}

$("input").focus()