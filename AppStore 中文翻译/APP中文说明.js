var update = {"123":"123","123":"123","123":"123"}
// var tkkNumber = ""
// 更新内容 软件简介
var updateContent = "", descriptionContent = ""
// 更新内容翻译集合 软件简介翻译集合
var updateContentGroup = [], descriptionContentGroup = []

// 翻译步骤标识 
// 1 正在翻译更新内容 
// 2 正在翻译软件简介
var translationStep = 1

var link = $context.link
// var link = "https://itunes.apple.com/jp/app/%E3%83%AD%E3%83%BC%E3%83%89%E3%82%AA%E3%83%96%E3%83%8A%E3%82%A4%E3%83%84-%E6%88%A6%E7%95%A5-%E6%88%A6%E4%BA%89-%E3%82%B7%E3%83%9F%E3%83%A5%E3%83%AC%E3%83%BC%E3%82%B7%E3%83%A7%E3%83%B3/id477396335?l=en&mt=8"

// 记录震动反馈，如果已经震动则不重复震动，除非从非满足条件到满足条件
var VFBool = false

if (($app.env == $env.action) && link) {
  $ui.loading("正在获取内容...")
  // if (link) {
  // 获取 app id
  var regex = /.+id(\d+).*/
  var match = regex.exec(link)
  var appid = match[1]
  // 获取 app 区域
  var regexNew = /.com\/([a-z][A-z])\/app/
  var matchNew = regexNew.exec(link)
  var region = matchNew[1]
  if (appid) {
    lookup(appid, region)
  }
} else {
  $ui.alert({
    title: "环境错误",
    message: "请在 App Store 应用详情页分享打开此脚本",
  });
}

function lookup(appid, region) {
  $http.get({
    url: "https://itunes.apple.com/" + region + "/lookup?id=" + appid,
    handler: function (resp) {
      $ui.loading(false)
      if (resp.data) {
        $delay(0.5, function () {
          var result = resp.data.results[0]
          var description = result.description
          var releaseNotes = result.releaseNotes
          googleTran(releaseNotes, description)
        })
      } else {
        $ui.alert({
          title: "网络错误",
          message: "请检查网络，并重新尝试翻译，若还存在问题，请尝试打开科学上网，脚本依赖于 Google 翻译。",
          actions: [
            {
              title: "OK",
              disabled: false, // Optional
              handler: function () {
                $app.close()
              }
            }
          ]
        })
      }
    }
  })
}

//谷歌翻译
function googleTran(text, descriptionC) {
  if (translationStep == 1) {
    $ui.loading("翻译中...")
  }
  $http.request({
    method: "POST",
    url: "http://translate.google.cn/translate_a/single",
    timeout: 5,
    header: {
      "User-Agent": "iOSTranslate",
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: {
      "dt": "t",
      "q": text,
      "tl": "zh-CN",
      "ie": "UTF-8",
      "sl": "auto",
      "client": "ia",
      "dj": "1"
    },
    showsProgress: false,
    handler: function (resp) {
      if (resp.data) {
        if (translationStep == 1) {
          // 更新内容翻译完毕
          updateContentGroup = resp.data.sentences
          translationStep = 2
          googleTran(descriptionC, "")
        } else if (translationStep == 2) {
          $ui.loading(false)
          // 软件简介翻译完毕
          descriptionContentGroup = resp.data.sentences
          show(updateContentGroup, descriptionContentGroup)
          $delay(1, function () {

          })
        } else {

        }
      } else {
        // 翻译出错
        $ui.alert({
          title: "网络错误",
          message: "请检查网络，并重新尝试翻译，若还存在问题，请尝试打开科学上网，脚本依赖于 Google 翻译。",
          actions: [
            {
              title: "OK",
              disabled: false, // Optional
              handler: function () {
                $app.close()
              }
            }
          ]
        })
      }
    }
  })


  /* 暂停使用
  let url = encodeURI("https://translate.google.cn/translate_a/single?client=webapp&sl=auto&tl=zh-CN&hl=zh-CN&dt=at&dt=bd&dt=ex&dt=ld&dt=md&dt=qca&dt=rw&dt=rm&dt=ss&dt=t&source=bh&pc=1&otf=1&ssel=0&tsel=0&kc=1&tk=" + tk(text, tkkNumber) + "&q=" + text)
  $console.info(url);
  $http.get({
    url: url,
    handler: function (resp) {
      var data = resp.data
      $console.info(resp.error);
      var dataFirst = [];
      dataFirst = data[0]
      var sentences = ""
      for (var i = 0, l = dataFirst.length; i < l; i++) {
        let dataCurrent = dataFirst[i]
        let firstString = dataCurrent[0]
        sentences = sentences + firstString
        $console.info(sentences);
      }
      show(sentences)
    }
  })
  */
}



function show(updateSentences, descriptionSentences) {

  var updateText = "", descriptionText = ""
  var updateLength = updateSentences.length
  var descriptionLength = descriptionSentences.length
  for (var i = 0; i < updateLength; i++) {
    var trans = updateSentences[i].trans
    updateText += trans
  }
  for (var i = 0; i < descriptionLength; i++) {
    var trans = descriptionSentences[i].trans
    descriptionText += trans
  }
  $console.info(updateText)
  $console.info(descriptionText)

  $ui.render({
    views: [{
      type: "scroll",
      layout: $layout.fill,
      events: {
        didScroll: function (sender) {
          var pointOffsetY = sender.contentOffset.y * -1
          if (pointOffsetY >= 100 && VFBool == false) {
            VFBool = true
            $device.taptic(2)
          } else if (pointOffsetY < 100) {
            VFBool = false
          }
        },
        didEndDragging: function (sender) {
          var pointOffsetY = sender.contentOffset.y * -1
          if (pointOffsetY > 100) {
            $context.close()
          }
        }
      },
      views: [{
        type: "label",
        props: {
          text: "更新内容：",
          lines: 0,
          font: $font(20),
          textColor: $color("red"),
          id: "update-title"
        },
        layout: function (make, view) {
          make.top.left.inset(10)
          make.width.equalTo(view.super).offset(-20)
        }
      },
      {
        type: "label",
        props: {
          text: updateText,
          lines: 0,
          font: $font(16),
          id: "update-content"
        },
        layout: function (make, view) {
          make.top.equalTo($("update-title").bottom).offset(5)
          make.left.equalTo($("update-title"))
          make.width.equalTo($("update-title"))
        }
      },
      {
        type: "label",
        props: {
          text: "应用介绍：",
          lines: 0,
          font: $font(20),
          textColor: $color("red"),
          id: "introduction-title"
        },
        layout: function (make, view) {
          make.top.equalTo($("update-content").bottom).offset(50)
          make.left.equalTo($("update-content"))
          make.width.equalTo($("update-content"))
        }
      },
      {
        type: "label",
        props: {
          text: descriptionText,
          lines: 0,
          font: $font(16),
          id: "introduction-content"
        },
        layout: function (make, view) {
          make.top.equalTo($("introduction-title").bottom).offset(5)
          make.left.equalTo($("introduction-title"))
          make.width.equalTo($("introduction-title"))
          make.bottom.equalTo(view.super).offset(-10)
        }
      }]
    }]
  })
}



// function tkk() {
//   $ui.loading("正在获取翻译参数...");
//   $http.get({
//     url: "https://translate.google.cn",
//     handler: function (resp) {
//       $ui.loading(false);
//       var data = resp.data;
//       var regex = /tkk:'\d+.\d+'/;
//       var tkkString = data.match(regex)[0];
//       tkkNumber = tkkString.match(/\d+.\d+/)[0];
//       $console.info("原始 TKK:" + tkkNumber);
//       if (appid && tkkNumber) {
//         lookup(appid)
//       }
//     }
//   });
// }

// if (($app.env == $env.action) && appid) {
// tkk()
// } else {
//   $ui.alert({
//     title: "环境错误",
//     message: "请在 App Store 应用详情页分享打开此脚本",
//   });
// }

function b(a, b) {
  for (var d = 0; d < b.length - 2; d += 3) {
    var c = b.charAt(d + 2),
      c = "a" <= c ? c.charCodeAt(0) - 87 : Number(c),
      c = "+" == b.charAt(d + 1) ? a >>> c : a << c;
    a = "+" == b.charAt(d) ? a + c & 4294967295 : a ^ c
  }
  return a
}

function tk(a, TKK) {
  for (var e = TKK.split("."), h = Number(e[0]) || 0, g = [], d = 0, f = 0; f < a.length; f++) {
    var c = a.charCodeAt(f);
    128 > c ? g[d++] = c : (2048 > c ? g[d++] = c >> 6 | 192 : (55296 == (c & 64512) && f + 1 < a.length && 56320 == (a.charCodeAt(f + 1) & 64512) ? (c = 65536 + ((c & 1023) << 10) + (a.charCodeAt(++f) & 1023), g[d++] = c >> 18 | 240, g[d++] = c >> 12 & 63 | 128) : g[d++] = c >> 12 | 224, g[d++] = c >> 6 & 63 | 128), g[d++] = c & 63 | 128)
  }
  a = h;
  for (d = 0; d < g.length; d++) a += g[d], a = b(a, "+-a^+6");
  a = b(a, "+-3^+b+-f");
  a ^= Number(e[1]) || 0;
  0 > a && (a = (a & 2147483647) + 2147483648);
  a %= 1E6;
  var tkkkkkkk = a.toString() + "." + (a ^ h)
  $console.info("最终 tk:" + tkkkkkkk);
  return tkkkkkkk
}