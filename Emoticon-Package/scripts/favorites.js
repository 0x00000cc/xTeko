
module.exports = {
    showFavorites: showFavorites,
    setPicData: setPicData
}

function showFavorites() {
    $ui.push({
        props: {
            id: "superView",
            title: "收藏夹"
        },
        views: [{
            type: "matrix",
            props: {
                id: "matrix-favorites",
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
                        longPressed: function (sender) {
                            $ui.menu({
                                items: ["分享", "保存到相册", "取消收藏"],
                                handler: function (title, idx) {
                                    switch (idx) {
                                        case 0: // 分享
                                            {

                                                var db = $sqlite.open("favorites.db");

                                                /// 查询
                                                var rs = db.query({
                                                    sql: "SELECT * FROM Favorites where url = ?",
                                                    args: [sender.sender.text]
                                                });
                                                var result = rs.result;
                                                var urlKey;
                                                if (result.next()) {
                                                    urlKey = result.get("image"); // Or result.get(0);
                                                }
                                                $share.sheet(resizedImage(urlKey.image))
                                            }
                                            break;
                                        case 1: // 保存到相册
                                            {
                                                var db = $sqlite.open("favorites.db");

                                                /// 查询
                                                var rs = db.query({
                                                    sql: "SELECT * FROM Favorites where url = ?",
                                                    args: [sender.sender.text]
                                                });
                                                var result = rs.result;
                                                var urlKey;
                                                if (result.next()) {
                                                    urlKey = result.get("image"); // Or result.get(0);
                                                }
                                                $photo.save({
                                                    data: urlKey,
                                                    handler: function (success) {
                                                        $ui.toast("已经保存到相册")
                                                    }
                                                })
                                            }
                                            break;
                                        case 2: // 收藏
                                            {
                                                var db = $sqlite.open("favorites.db");

                                                db.update({
                                                    sql: "DELETE FROM Favorites where url = ?",
                                                    args: [sender.sender.text]
                                                });
                                                $sqlite.close(db);
                                                setPicData()
                                            }
                                            break;
                                    }
                                }
                            })
                        }
                    }
                }]
            },
            layout: function (make) {
                make.top.left.bottom.right.equalTo(0)
            },
            events: {
                didSelect: function (sender, indexPath, object) {
                    $clipboard.image = resizedImage(object.image.data.image)
                    $ui.toast("已经复制到剪贴板")

                }
            }
        }, {
            type: "label",
            props: {
                id: "label-loading2",
                lines: 0,
                text: "没有收藏表情",
                bgcolor: $color("#FFFFFF"),
                align: $align.center
            },
            layout: function (make, view) {
                make.top.bottom.left.right.equalTo(0)
            }
        }
        ]
    })
}


function setPicData() {
    $console.info("12");
    var db = $sqlite.open("favorites.db");
    var object = db.query("SELECT * FROM Favorites");
    var result = object.result;
    var error = object.error;

    var dataTuple = [];

    while (result.next()) {
        $console.info(result);
        var values = result.values;
        dataTuple.push(values)
    }

    result.close();
    var sdfs = dataTuple.map(function (item) {
        return { image: { data: item.image }, label: { text: item.url } }
    })

    $console.info(sdfs);

    if (sdfs.length == 0) {
        $("label-loading2").hidden = false
        return
    } else {
        $("label-loading2").hidden = true
    }

    $("matrix-favorites").data = sdfs

}

function resizedImage(image) {
    var proportion = image.size.height / image.size.width
    var newImage = image.resized($size(200, 200 * proportion))
    return newImage
}