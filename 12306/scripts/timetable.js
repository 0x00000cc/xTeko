var station = $file.read('assets/station_name.json')
var train_C = $file.read('assets/C.json')
var train_D = $file.read('assets/D.json')
var train_G = $file.read('assets/G.json')
var train_K = $file.read('assets/K.json')
var train_O = $file.read('assets/O.json')
var train_T = $file.read('assets/T.json')
var train_Z = $file.read('assets/Z.json')

var stationObject = JSON.parse(station.string)
var tool = require('scripts/tool')

var searchIndex = 0

function showTimeTable() {
    $ui.push({
        props: {
            id: "superView",
            title: "时刻表"
        },
        views: [{
            type: "input",
            props: {
                id: "year",
                align: $align.center,
                placeholder: "年",
                type: $kbType.number
            },
            layout: function (make) {
                make.top.inset(10)
                make.left.inset(10)
                make.height.equalTo(40)
            },
            events: {
                ready: function (sender) {
                    sender.text = tool.currentYear
                }
            }
        },
        {
            type: "input",
            props: {
                id: "month",
                align: $align.center,
                placeholder: "月",
                type: $kbType.number
            },
            layout: function (make) {
                make.top.inset(10)
                make.left.equalTo($("year").right).offset(10)
                make.height.equalTo(40)
                make.width.equalTo($("year").width)
            },
            events: {
                ready: function (sender) {
                    sender.text = tool.currentMonth
                }
            }
        },
        {
            type: "input",
            props: {
                id: "day",
                align: $align.center,
                placeholder: "日",
                type: $kbType.number
            },
            layout: function (make) {
                make.top.inset(10)
                make.left.equalTo($("month").right).offset(10)
                make.right.inset(10)
                make.height.equalTo(40)
                make.width.equalTo($("month").width)
            },
            events: {
                ready: function (sender) {
                    sender.text = tool.currentDay
                }
            }
        }, {
            type: "input",
            props: {
                placeholder: "列车编号",
                type: $kbType.ascii
            },
            layout: function (make) {
                make.top.equalTo($("year").bottom).offset(10)
                make.left.inset(10)
                make.height.equalTo(32)
            },
            events: {
                ready: function (sender) {
                    if ($cache.get("oldCode")) {
                        sender.text = $cache.get("oldCode")
                    }
                },
                returned: function (sender) {
                    collapseKeyboard()
                    var firstWord = sender.text.slice(0, 1).toUpperCase()
                    search(objectSetting(firstWord))
                    $cache.set("oldCode", $("input").text)
                }
            }
        },
        {
            type: "button",
            props: {
                title: "查询"
            },
            layout: function (make) {
                make.top.equalTo($("input"))
                make.right.inset(10)
                make.height.equalTo($("input").height);
                make.width.equalTo($("input").width).multipliedBy(0.6)
                make.left.equalTo($("input").right).offset(5)
            },
            events: {
                tapped: function (sender) {
                    collapseKeyboard()
                    var firstWord = $("input").text.slice(0, 1).toUpperCase()
                    getTrain_no(objectSetting(firstWord))
                    $cache.set("oldCode", $("input").text)
                }
            }
        }, {
            type: "label",
            props: {
                text: "到达站名",
                id: "station_name_text",
                align: $align.center,
                font: $font(15)
            },
            layout: function (make, view) {
                make.top.equalTo($("input").bottom)
                make.left.equalTo(0)
                make.height.equalTo(44)
                make.width.equalTo(view.super.width).multipliedBy(0.25)
            }
        }, {
            type: "label",
            props: {
                text: "到站时间",
                id: "arrive_time_text",
                align: $align.center,
                font: $font(15)
            },
            layout: function (make, view) {
                make.top.equalTo($("station_name_text"))
                make.left.equalTo($("station_name_text").right)
                make.height.equalTo($("station_name_text"))
                make.width.equalTo($("station_name_text").width)
            }
        }, {
            type: "label",
            props: {
                text: "出站时间",
                id: "start_time_text",
                align: $align.center,
                font: $font(15)
            },
            layout: function (make, view) {
                make.top.equalTo($("station_name_text"))
                make.left.equalTo($("arrive_time_text").right)
                make.height.equalTo($("station_name_text"))
                make.width.equalTo($("station_name_text").width)
            }
        }, {
            type: "label",
            props: {
                text: "停靠时长",
                id: "stopover_time_text",
                align: $align.center,
                font: $font(15)
            },
            layout: function (make, view) {
                make.top.equalTo($("station_name_text"))
                make.left.equalTo($("start_time_text").right)
                make.height.equalTo($("station_name_text"))
                make.width.equalTo($("station_name_text").width)
            }
        }, {
            type: "list",
            props: {
                id: "list",
                rowHeight: 44,
                template: [{
                    type: "label",
                    props: {
                        id: "station_name", // 站名
                        align: $align.center,
                    },
                    layout: function (make, view) {
                        make.left.top.bottom.inset(0)
                        make.width.equalTo(view.super.width).multipliedBy(0.25)
                    }
                }, {
                    type: "label",
                    props: {
                        id: "arrive_time", // 到站时间,
                        align: $align.center,
                    },
                    layout: function (make, view) {
                        make.top.bottom.inset(0)
                        make.left.equalTo($("station_name").right)
                        make.width.equalTo($("station_name").width)
                    }
                }, {
                    type: "label",
                    props: {
                        id: "start_time", // 出发时间
                        align: $align.center,
                    },
                    layout: function (make, view) {
                        make.top.bottom.inset(0)
                        make.left.equalTo($("arrive_time").right)
                        make.width.equalTo($("station_name").width)
                    }
                }, {
                    type: "label",
                    props: {
                        id: "stopover_time", // 停靠时长
                        align: $align.center,
                    },
                    layout: function (make, view) {
                        make.top.bottom.inset(0)
                        make.left.equalTo($("start_time").right)
                        make.width.equalTo($("station_name").width)
                    }
                }]
            },
            layout: function (make, view) {
                make.top.equalTo($("station_name_text").bottom)
                make.left.right.bottom.inset(0)
            }
        }
        ]
    })
}

module.exports = {
    showTimeTable: showTimeTable
}

function collapseKeyboard() {
    $("input").blur()
    $("year").blur()
    $("month").blur()
    $("day").blur()
}

function getTrain_no(object) {
    $ui.loading(true)
    var train_Code = $("input").text.toUpperCase()
    var url = "https://search.12306.cn/search/v1/train/search?keyword=" + train_Code + "&date=" + tool.currentYear + tool.currentMonth + tool.currentDay
    $console.info(url)
    $http.get({
        url: url,
        handler: function (resp) {
            $ui.loading(false)
            var data = resp.data;
            $console.info(data.data);
            if (isEmpty(data.data) == true) {
                getTrain_no(object)
            } else {
                search(object, data.data[0].train_no)
            }
        }
    });
}

function search(object, train_no) {
    var train_Code = $("input").text.toUpperCase()
    $console.info(train_Code)
    var departureStation = stationObject[object[train_Code].departureStation]
    $console.info(departureStation)
    var terminalStation = stationObject[object[train_Code].terminalStation]
    $console.info(terminalStation)
    // let otherTrainNoGroup = object[train_Code].otherTrainNoGroup
    // searchIndex = (searchIndex > otherTrainNoGroup.length - 1 ? 0 : searchIndex)
    // var train_no = otherTrainNoGroup[searchIndex]
    $console.info(train_no)


    var year = ($("year").text.length > 1) ? $("year").text : ("0" + $("year").text)
    var month = ($("month").text.length > 1) ? $("month").text : ("0" + $("month").text)
    var day = ($("day").text.length > 1) ? $("day").text : ("0" + $("day").text)
    let depart_date = year + "-" + month + "-" + day
    cyclicSearch(train_no, departureStation, terminalStation, depart_date, train_Code, object)

}

function cyclicSearch(train_no, from_station_telecode, to_station_telecode, depart_date, train_Code, object) {
    var url = "https://kyfw.12306.cn/otn/czxx/queryByTrainNo?train_no=" + train_no + "&from_station_telecode=" + from_station_telecode + "&to_station_telecode=" + to_station_telecode + "&depart_date=" + depart_date
    $console.info(url)

    $ui.loading(true)
    $http.request({
        method: "GET",
        url: url,
        handler: function (resp) {
            $ui.loading(false)
            $console.info(resp.data);
            if (isEmpty(resp.data.data.data) == true) {
                searchIndex++
                search(object)
            } else {
                format(resp.data.data.data, object[train_Code].departureStation + "-" + object[train_Code].terminalStation)
            }
        }
    })
}


function isEmpty(value) {
    return (Array.isArray(value) && value.length === 0) || (Object.prototype.isPrototypeOf(value) && Object.keys(value).length === 0);
}

function format(data, title) {
    $ui.title = title
    var dataTuple = data.map(function (item) {
        var start_station_name = item.station_name
        var arrive_time = item.arrive_time
        var start_time = item.start_time
        var stopover_time = item.stopover_time
        var station_no = item.station_no
        if (station_no == "01") {
            arrive_time = "始发站"
            stopover_time = "始发站"
        }
        if (stopover_time == "----") {
            start_time = "终点站"
            stopover_time = "终点站"
        }

        return { station_name: { text: start_station_name }, arrive_time: { text: arrive_time }, start_time: { text: start_time }, stopover_time: { text: stopover_time } }
    })
    $("list").data = dataTuple
}

function objectSetting(word) {
    $console.info(word)
    var train_Object
    if (word == "C") { train_Object = JSON.parse(train_C.string) }
    else if (word == "D") { train_Object = JSON.parse(train_D.string) }
    else if (word == "G") { train_Object = JSON.parse(train_G.string) }
    else if (word == "K") { train_Object = JSON.parse(train_K.string) }
    else if (word == "T") { train_Object = JSON.parse(train_T.string) }
    else if (word == "Z") { train_Object = JSON.parse(train_Z.string) }
    else { train_Object = JSON.parse(train_O.string) }
    return train_Object
}