
module.exports = {
  addItem: addItem,
  deleteItem: deleteItem,
  clearList: clearList,
  getListData: getListData,
  getBackListData: getBackListData,
  diffTime: diffTime,
  changeItem: changeItem,
  getNumberDaysInMonth: getNumberDaysInMonth,
  getFutureDates: getFutureDates,
  calculateDateDifference: calculateDateDifference,
  changeItemSort: changeItemSort
}

dbStr = "CREATE TABLE TimeList(id text, time text, name text, description text, type integer, customImage integer, image BLOB, nameColor text, descriptionColor text, bgColor text, dateColor text, dateUnitColor text)"

pathHeder = "shared://Time-mmmmmmm"
path = `${pathHeder}/timeList.db`
if (!$file.exists(pathHeder)) {
  $file.mkdir(pathHeder)
}

let newWordGroup = [
  "dayNumber text",
  "isCycle integer",
  "cycleType text",
  "sequenceNumber integer"
]

function addNewWord() {
  var db = $sqlite.open(path);
  db.update(dbStr)
  var object = db.query("SELECT * FROM TimeList");
  var result = object.result;
  newWordGroup.forEach(function (item) {
    var columnIndex = result.indexForName(item.split(" ")[0]);
    if (columnIndex == -1) {
      db.update(`ALTER TABLE TimeList ADD COLUMN ${item}`);
    }
  })
  $sqlite.close(db);
}
addNewWord()

function addItem(item) {
  var db = $sqlite.open(path)
  db.update(dbStr)
  db.update({
    sql: "INSERT INTO TimeList values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    args: [
      item.id,
      item.time,
      item.name,
      item.description,
      item.type,
      item.customImage,
      item.image,
      item.nameColor,
      item.descriptionColor,
      item.bgColor,
      item.dateColor,
      item.dateUnitColor,
      item.dayNumber,
      item.isCycle,
      item.cycleType,
      item.sequenceNumber
    ]
  });
  $sqlite.close(db);
  backup()
}

function changeItem(item) {
  var db = $sqlite.open(path)
  db.update(dbStr)
  db.update({
    sql: "UPDATE TimeList SET time = ?, name = ?, description = ?, type = ?, customImage = ?, image = ?, nameColor = ?, descriptionColor = ?, bgColor = ?, dateColor = ?, dateUnitColor = ?, dayNumber = ?, isCycle = ?, cycleType = ? WHERE id = ?",
    args: [
      item.time,
      item.name,
      item.description,
      item.type,
      item.customImage,
      item.image,
      item.nameColor,
      item.descriptionColor,
      item.bgColor,
      item.dateColor,
      item.dateUnitColor,
      item.dayNumber,
      item.isCycle,
      item.cycleType,
      item.id
    ]
  });
  $sqlite.close(db);
  backup()
}

function changeItemSort(sequenceNumber, id) {
  var db = $sqlite.open(path)
  db.update(dbStr)
  db.update({
    sql: "UPDATE TimeList SET sequenceNumber = ? WHERE id = ?",
    args: [
      sequenceNumber,
      id
    ]
  });
  $sqlite.close(db);
}

function deleteItem(id) {
  backup()
  var db = $sqlite.open(path);
  db.update({
    sql: "DELETE FROM TimeList where id = ?",
    args: [id]
  });
  $sqlite.close(db);
}

function clearList() {
  backup()
  var db = $sqlite.open(path);
  db.update("DELETE FROM TimeList");
  $sqlite.close(db);
}

function getListData() {
  var db = $sqlite.open(path);
  db.update(dbStr)
  var object = db.query("SELECT * FROM TimeList");
  var result = object.result;
  var error = object.error;
  var dataTuple = []

  while (result.next()) {
    let todayDate = new Date()
    todayDate.setHours(0)
    todayDate.setMinutes(0)
    todayDate.setSeconds(0)
    todayDate.setMilliseconds(0)

    var values = result.values;
    var valueDate = new Date(parseInt(values.time))
    valueDate.setHours(0)
    valueDate.setMinutes(0)
    valueDate.setSeconds(0)
    valueDate.setMilliseconds(0)

    let diff = diffTime(valueDate.getTime(), todayDate.getTime())
    // return
    if (diff[3] > 0 && (values.cycleType == "month" || values.cycleType == "year")) {
      var cycleJudge = 1
      var nextMonthNumber = 0
      var incrementNumber = 1
      if (values.cycleType == "year") {
        incrementNumber = 12
      }
      while (cycleJudge == 1) {
        nextMonthNumber += incrementNumber
        let newDate = getFutureDates(new Date(valueDate.getTime()), nextMonthNumber, values.dayNumber)
        diff = diffTime(newDate.getTime(), todayDate.getTime())
        if (diff[3] <= 0) {
          cycleJudge = -1
        }
      }
    }
    let hidden = false
    if (values.customImage == 0) {
      hidden = true
    }
    let imageData = values.image.image.resized($size(200, 200 * (values.image.image.size.height / values.image.image.size.width))).png
    let data = {
      listImage: { data: imageData },
      listName: { text: values.name, textColor: $color(values.nameColor) },
      listDescription: { text: values.description, textColor: $color(values.descriptionColor) },
      listTime: { text: diff[0], textColor: $color(values.dateColor) },
      listUnit: { text: diff[1], textColor: $color(values.dateUnitColor) },
      noListName: { text: values.name, textColor: $color(values.nameColor) },
      noListDescription: { text: values.description, textColor: $color(values.descriptionColor) },
      noListTime: { text: diff[0], textColor: $color(values.dateColor) },
      noListUnit: { text: diff[1], textColor: $color(values.dateUnitColor) },
      listType: values.type,
      listID: values.id,
      time: `${valueDate.getTime()}`,
      customImage: values.customImage,
      bigImage: values.image,
      imageView: { hidden: hidden, bgcolor: $color(values.bgColor) },
      noImageView: { hidden: !hidden, bgcolor: $color(values.bgColor) },
      type: { text: diff[2], textColor: $color(values.dateUnitColor) },
      noType: { text: diff[2], textColor: $color(values.dateUnitColor) },
      dayNumber: { text: diff[2], textColor: $color(values.dateUnitColor) },
      cycleType: values.cycleType,
      sequenceNumber: values.sequenceNumber,
    }
    dataTuple.unshift(data)
  }
  result.close();

  if ($cache.get("sort") == 2) { // 日期排序

    var len = dataTuple.length;

    var positiveTimingGroup = []
    var countdownGroup = []
    var todayGroup = []
    for (var i = 0; i < len; i++) {
      let item = dataTuple[i]
      let number = item.listTime.text
      let type = item.type.text
      if (number == "今天") {
        todayGroup.push(item)
      } else if (type == "还有") {
        countdownGroup.push(item)
      } else if (type == "已过") {
        positiveTimingGroup.push(item)
      }
    }
    positiveTimingGroup = sortHandler(positiveTimingGroup)
    countdownGroup = sortHandler(countdownGroup)

    dataTuple = []
    todayGroup.forEach(function (item) {
      dataTuple.push(item)
    })
    countdownGroup.forEach(function (item) {
      dataTuple.push(item)
    })
    positiveTimingGroup.forEach(function (item) {
      dataTuple.push(item)
    })
  } else if ($cache.get("sort") == 1) { // 默认排序
    dataTuple = defaultSortHandler(dataTuple)
  }

  return dataTuple
}

function sortHandler(arr) {
  var len = arr.length;
  for (var i = 0; i < len; i++) {
    for (var j = 0; j < len - 1 - i; j++) {
      if (arr[j].listTime.text > arr[j + 1].listTime.text) {        //相邻元素两两对比
        var temp = arr[j + 1];        //元素交换
        arr[j + 1] = arr[j];
        arr[j] = temp;
      }
    }
  }
  return arr;
}

function defaultSortHandler(arr) {
  var len = arr.length;
  for (var i = 0; i < len; i++) {
    for (var j = 0; j < len - 1 - i; j++) {
      if (arr[j].sequenceNumber > arr[j + 1].sequenceNumber) {        //相邻元素两两对比
        var temp = arr[j + 1];        //元素交换
        arr[j + 1] = arr[j];
        arr[j] = temp;
      }
    }
  }
  return arr;
}

function diffTime(startDate, endDate) {

  var diff = endDate - startDate
  //计算出相差天数
  var days = Math.floor(diff / (24 * 3600 * 1000));
  var dateType = "已过"

  if (days == 0) {
    unit = ""
    dateType = ""
    date = "今天"
  } else {
    unit = "天"
    date = Math.abs(days)
    if (days < 0) {
      dateType = "还有"
    }
  }
  return [date, unit, dateType, days];
}

// 获取当前月有几天
function getNumberDaysInMonth(aimsDate) {
  var date = new Date()
  if (aimsDate != undefined) {
    date = aimsDate
  }
  date.setDate(28)
  let nextMonth = date.getMonth() + 1
  let nextYear = date.getFullYear()
  if (nextMonth > 11) {
    nextMonth = 0
    nextYear = nextYear + 1
  }
  date.setFullYear(nextYear)
  date.setMonth(nextMonth)
  let lastDay = new Date(date.setDate(0))
  var lastMonth = lastDay.getMonth() + 1
  lastMonth = lastMonth > 12 ? 1 : lastMonth
}

Date.prototype.Format = function (fmt) { //author: meizz 
  var o = {
    "M+": this.getMonth() + 1, //月份 
    "d+": this.getDate(), //日 
    "h+": this.getHours(), //小时 
    "m+": this.getMinutes(), //分 
    "s+": this.getSeconds(), //秒 
    "q+": Math.floor((this.getMonth() + 3) / 3), //季度 
    "S": this.getMilliseconds() //毫秒 
  };
  if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
  for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
  return fmt;
}

// 获取 monthLength 月后的日期
function getFutureDates(originalDate, monthLength, dateDay) {
  var futureDate = originalDate
  futureDate.setHours(0)
  futureDate.setMinutes(0)
  futureDate.setSeconds(0)
  futureDate.setMilliseconds(0)
  futureDate.setDate(1)
  var nextMonth = futureDate.getMonth()
  var nextYear = futureDate.getFullYear()
  for (var i = 0; i < monthLength; i++) {
    nextMonth += 1
    if (nextMonth > 11) {
      nextMonth = 0
      nextYear = nextYear + 1
    }
  }
  futureDate.setFullYear(nextYear)
  futureDate.setMonth(nextMonth)

  var nextFutureDate = futureDate
  var nextFutureYear = nextFutureDate.getFullYear()
  var nextFutureMonth = nextFutureDate.getMonth() + 1
  if (nextFutureMonth > 11) {
    nextFutureMonth = 0
    nextFutureYear += 1
  }
  nextFutureDate.setFullYear(nextFutureYear)
  nextFutureDate.setMonth(nextFutureMonth)

  let futureDateDayNumber = new Date(nextFutureDate.setDate(0)).getDate()
  if (dateDay > futureDateDayNumber) {
    futureDate.setDate(futureDateDayNumber)
  } else {
    futureDate.setDate(dateDay)
  }
  return futureDate
}

function calculateDateDifference(time, type) {
  let todayDate = new Date()
  todayDate.setHours(0)
  todayDate.setMinutes(0)
  todayDate.setSeconds(0)
  todayDate.setMilliseconds(0)
  let valueDate = new Date(parseInt(time))
  valueDate.setHours(0)
  valueDate.setMinutes(0)
  valueDate.setSeconds(0)
  valueDate.setMilliseconds(0)
  let diff = diffTime(valueDate.getTime(), todayDate.getTime())
  // return
  if (diff[3] > 0 && (type == "month" || type == "year")) {
    var cycleJudge = 1
    var nextMonthNumber = 0
    var incrementNumber = 1
    if (type == "year") {
      incrementNumber = 12
    }
    while (cycleJudge == 1) {
      nextMonthNumber += incrementNumber
      let newDate = getFutureDates(new Date(valueDate.getTime()), nextMonthNumber, valueDate.getDate())
      diff = diffTime(newDate.getTime(), todayDate.getTime())
      if (diff[3] <= 0) {
        cycleJudge = -1
      }
    }
  }
  return diff
}

function backup() {
  if (!$drive.exists("Time-mmmmmmm")) {
    $drive.mkdir("Time-mmmmmmm")
  }
  var file = $file.read("shared://Time-mmmmmmm/timeList.db")
  var success = $drive.write({
    data: file,
    path: `Time-mmmmmmm/timeList.db ${new Date().getTime()}`
  })
  if (success) {
    $console.info("备份到 iCloud 成功");
    var contents = $drive.list("Time-mmmmmmm")
    if (contents.length > 10) {
      contents.sort(function (a, b) {
        var c = isFinite(a), // 如果 number 是有限数字（或可转换为有限数字），那么返回 true。否则，如果 number 是 NaN（非数字），或者是正、负无穷大的数，则返回 false。  
          d = isFinite(b);
        return (c != d && d - c) || a > b;
      })
      for (var i = 0, len = contents.length - 10; i < len; i++) {
        var success = $drive.delete(`Time-mmmmmmm/${contents[i]}`)
      }
    }
  } else {
    $console.info("备份到 iCloud 失败");
  }
}



function getBackListData(customPath) {

  var contents = $drive.list("Time-mmmmmmm")
  var db = $sqlite.open(`drive://Time-mmmmmmm/${contents[0]}`);
  var file = $file.read(`drive://Time-mmmmmmm/${contents[0]}`)
  $console.info(file);
  var object = db.query("SELECT * FROM TimeList");
  var result = object.result;
  var error = object.error;
  var dataTuple = []

  while (result.next()) {
    let todayDate = new Date()
    todayDate.setHours(0)
    todayDate.setMinutes(0)
    todayDate.setSeconds(0)
    todayDate.setMilliseconds(0)

    var values = result.values;
    var valueDate = new Date(parseInt(values.time))
    valueDate.setHours(0)
    valueDate.setMinutes(0)
    valueDate.setSeconds(0)
    valueDate.setMilliseconds(0)

    let diff = diffTime(valueDate.getTime(), todayDate.getTime())
    // return
    if (diff[3] > 0 && (values.cycleType == "month" || values.cycleType == "year")) {
      var cycleJudge = 1
      var nextMonthNumber = 0
      var incrementNumber = 1
      if (values.cycleType == "year") {
        incrementNumber = 12
      }
      while (cycleJudge == 1) {
        nextMonthNumber += incrementNumber
        let newDate = getFutureDates(new Date(valueDate.getTime()), nextMonthNumber, values.dayNumber)
        diff = diffTime(newDate.getTime(), todayDate.getTime())
        if (diff[3] <= 0) {
          cycleJudge = -1
        }
      }
    }
    let hidden = false
    if (values.customImage == 0) {
      hidden = true
    }
    let imageData = values.image.image.resized($size(200, 200 * (values.image.image.size.height / values.image.image.size.width))).png
    let data = {
      backlistImage: { data: imageData },
      backlistName: { text: values.name, textColor: $color(values.nameColor) },
      backlistDescription: { text: values.description, textColor: $color(values.descriptionColor) },
      backlistTime: { text: diff[0], textColor: $color(values.dateColor) },
      backlistUnit: { text: diff[1], textColor: $color(values.dateUnitColor) },
      backnoListName: { text: values.name, textColor: $color(values.nameColor) },
      backnoListDescription: { text: values.description, textColor: $color(values.descriptionColor) },
      backnoListTime: { text: diff[0], textColor: $color(values.dateColor) },
      backnoListUnit: { text: diff[1], textColor: $color(values.dateUnitColor) },
      backlistType: values.type,
      backlistID: values.id,
      backtime: `${valueDate.getTime()}`,
      backcustomImage: values.customImage,
      backbigImage: values.image,
      backimageView: { hidden: hidden, bgcolor: $color(values.bgColor) },
      backnoImageView: { hidden: !hidden, bgcolor: $color(values.bgColor) },
      backtype: { text: diff[2], textColor: $color(values.dateUnitColor) },
      backnoType: { text: diff[2], textColor: $color(values.dateUnitColor) },
      backdayNumber: { text: diff[2], textColor: $color(values.dateUnitColor) },
      backcycleType: values.cycleType,
      backsequenceNumber: values.sequenceNumber,
    }
    dataTuple.unshift(data)
  }
  result.close();

  if ($cache.get("sort") == 2) { // 日期排序

    var len = dataTuple.length;

    var positiveTimingGroup = []
    var countdownGroup = []
    var todayGroup = []
    for (var i = 0; i < len; i++) {
      let item = dataTuple[i]
      let number = item.backlistTime.text
      let type = item.backtype.text
      if (number == "今天") {
        todayGroup.push(item)
      } else if (type == "还有") {
        countdownGroup.push(item)
      } else if (type == "已过") {
        positiveTimingGroup.push(item)
      }
    }
    positiveTimingGroup = sortHandler(positiveTimingGroup)
    countdownGroup = sortHandler(countdownGroup)

    dataTuple = []
    todayGroup.forEach(function (item) {
      dataTuple.push(item)
    })
    countdownGroup.forEach(function (item) {
      dataTuple.push(item)
    })
    positiveTimingGroup.forEach(function (item) {
      dataTuple.push(item)
    })
  } else if ($cache.get("sort") == 1) { // 默认排序
    dataTuple = defaultSortHandler(dataTuple)
  }
  return dataTuple
}