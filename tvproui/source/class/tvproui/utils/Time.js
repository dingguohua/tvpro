
/* ************************************************************************
************************************************************************ */
qx.Class.define('tvproui.utils.Time',
{
  extend : qx.core.Object,

  /* 为了效率，请不要直接构造本对象，使用tvproui.utils.Time.fromString来构造本对象 */
  construct : function() {
    this.base(arguments);
  },
  statics :
  {

    /* 用于匹配间隔的数字段 */
    _RegexTimePart : /[\d\.]+/g,
    _RegexDate : /[\d\:\.]+/g,
    _dictStringOffset : {

    },
    _dictComplexOffset : {

    },
    _dictObjectPool : {

    },
    _dictOffsetString : {

    },
    _dictOffsetString2 : {

    },
    _dictDayOffsetString : {

    },
    _arrayTimeMulitple : [24 * 60 * 60, 60 * 60, 60, 1],
    dateFormater : null,
    dateTimeFormater : null,
    zeroBegin: null,

    init: function()
    {
        tvproui.utils.Time.dateFormater = new qx.util.format.DateFormat("yyyy-MM-dd");
    },


    /**
     * TODOC
     *
     * @param date {var} TODOC
     * @return {var} TODOC
     */
    parseDate : function(date)
    {
      if(date == "0000-00-00")
      {
        return null;
      }

      return tvproui.utils.Time.dateFormater.parse(date);
    },


    /**
     * TODOC
     *
     * @param date {var} TODOC
     * @return {var} TODOC
     */
    formatDate : function(date)
    {
      if (!date) {
        return "0000-00-00";
      }
      
      return tvproui.utils.Time.dateFormater.format(date);
    },


    /**
     * TODOC
     *
     * @param date {var} TODOC
     * @return {var} TODOC
     */
    formatDateTime : function(date)
    {
      if (!tvproui.utils.Time.dateTimeFormater) {
        tvproui.utils.Time.dateTimeFormater = new qx.util.format.DateFormat("yyyy-MM-dd kk:mm:ss");
      }
      if (!date) {
        date = new Date();
      }
      return tvproui.utils.Time.dateTimeFormater.format(date);
    },

    /* 补0 */

    /**
     * TODOC
     *
     * @param content {var} TODOC
     * @param length {var} TODOC
     * @return {var} TODOC
     */
    plusZero : function(content, length)
    {
      for (var i = content.length; i < length; i++) {
        content = "0" + content;
      }
      return content;
    },

    /* 从xx:xx:xx格式字符串转换为int类型的秒偏移量 */

    /**
     * TODOC
     *
     * @param strDate {var} TODOC
     * @return {var | int} TODOC
     */
    fromStringToOffset : function(strDate)
    {

      /* 先从查找表里面查询是否已经有做过的结果，加速 */
      var _dictStringOffset = tvproui.utils.Time._dictStringOffset;
      if (_dictStringOffset[strDate]) {
        return _dictStringOffset[strDate];
      }

      /* 处理异常情况 */
      if (strDate == null || strDate.trim() == "") {
        return 0;
      }

      /* 用正则将数字分段放入数组 */
      var _RegexTimePart = tvproui.utils.Time._RegexTimePart;
      var contents = strDate.match(_RegexTimePart);
      var arrayTimeMulitple = tvproui.utils.Time._arrayTimeMulitple;
      var contentLength = contents.length;
      if (contentLength > arrayTimeMulitple.length + 1)
      {
        dialog.Dialog.error("Time.js错误的时间格式，仅支持天:时:分:秒!");
        return 0;
      }
      var offset = 0;
      if (contentLength > 0)
      {
        var multiOffset = arrayTimeMulitple.length - contentLength;

        /* 相加乘以基数得到偏移量 */
        for (var i = 0; i < contentLength; i++) {
          offset += (parseFloat(contents[i]) * arrayTimeMulitple[multiOffset + i]);
        }
      }

      /* 记录于缓冲表中 */
      _dictStringOffset[strDate] = offset;
      return offset;
    },


    /**
     * TODOC
     *
     * @param strDate {var} TODOC
     * @return {var | int} TODOC
     */
    fromComplexStringToOffset : function(strDate)
    {

      /* 先从查找表里面查询是否已经有做过的结果，加速 */
      var _dictComplexOffset = tvproui.utils.Time._dictComplexOffset;
      if (_dictComplexOffset[strDate]) {
        return _dictComplexOffset[strDate];
      }
      if ((null == strDate) || ("" == strDate)) {
        return 0;
      }
      var RegExDate = this._RegexDate;
      var fromStringToOffset = this.fromStringToOffset;
      var compiled = strDate.replace(RegExDate, fromStringToOffset);
      var offset = 0;
      try {
        offset = parseInt(qx.lang.Function.globalEval(compiled));
      }catch (err)
      {
        dialog.Dialog.error("您输入的时间表达式语法有错!<br/>仅支持+-*/()等表达式<br/>时间格式必须为 时:分:秒<br>如(00:30:00 + 30.0:0) * 2.0");
        return 0;
      }

      //alert(strDate + "\r\n" + compiled + "\r\n" + offset);
      /* 记录于缓冲表中 */
      _dictComplexOffset[strDate] = offset;
      return offset;
    },

    /* 从xx:xx:xx格式字符串转换为Time类型 */

    /**
     * TODOC
     *
     * @param strDate {var} TODOC
     * @return {var} TODOC
     */
    fromString : function(strDate)
    {

      /* 检查缓冲池 */
      var _dictObjectPool = tvproui.utils.Time._dictObjectPool;
      if (_dictObjectPool[strDate]) {
        return _dictObjectPool[strDate].clone();
      }

      /* 新生成对象,并将时间翻译后配入 */
      var offset = tvproui.utils.Time.fromStringToOffset(strDate);
      var time = new tvproui.utils.Time();
      time.setTime(offset);

      /* 加入缓冲池 */
      _dictObjectPool[strDate] = time;
      _dictObjectPool[offset] = time;

      /* 返回复制品 */
      return time.clone();
    },

    /* 从支持四则运算的表达式获取时间对象 */

    /**
     * TODOC
     *
     * @param strDate {var} TODOC
     * @return {var} TODOC
     */
    fromComplexString : function(strDate)
    {

      /* 检查缓冲池 */
      var _dictObjectPool = tvproui.utils.Time._dictObjectPool;
      if (_dictObjectPool[strDate]) {
        return _dictObjectPool[strDate].clone();
      }

      /* 新生成对象,并将时间翻译后配入 */
      var offset = tvproui.utils.Time.fromComplexStringToOffset(strDate);
      var time = new tvproui.utils.Time();
      time.setTime(offset);

      /* 加入缓冲池 */
      _dictObjectPool[strDate] = time;
      _dictObjectPool[offset] = time;

      /* 返回复制品 */
      return time.clone();
    },

    /* 从偏移量获得时间对象 */

    /**
     * TODOC
     *
     * @param offset {var} TODOC
     * @return {var} TODOC
     */
    fromOffset : function(offset)
    {

      /* 检查缓冲池 */
      var _dictObjectPool = tvproui.utils.Time._dictObjectPool;
      if (_dictObjectPool[offset]) {
        return _dictObjectPool[offset].clone();
      }

      /* 新生成对象,并将时间翻译后配入 */
      var time = new tvproui.utils.Time();
      time.setTime(offset);

      /* 获得文本格式 */
      var strDate = time.toString();

      /* 加入缓冲池 */
      _dictObjectPool[strDate] = time;
      _dictObjectPool[offset] = time;

      /* 返回复制品 */
      return time.clone();
    },


    /**
     * TODOC
     *
     * @param obj {Object} TODOC
     * @return {var | null} TODOC
     */
    from : function(obj)
    {
      var type = qx.lang.Type.getClass(obj);
      if ("Object" === type) {
        type = obj.classname;
      }
      switch (type)
      {
        case "tvproui.utils.Time":return obj.clone();
        case "String":return tvproui.utils.Time.fromComplexString(obj);
        case "Number":return tvproui.utils.Time.fromOffset(obj);
        default :dialog.Dialog.error("Timer.js 不支持的数据类型" + type);
        return null;
      }
    },

    /* 测试用例 */

    /**
     * TODOC
     *
     * @return {boolean} TODOC
     */
    test : function()
    {

      /* 字符串识别 */
      var t010101 = tvproui.utils.Time.from("01:01:01");
      var t005859 = tvproui.utils.Time.from("0:58:59");
      var t002000 = tvproui.utils.Time.from(2 * 60 * 60);
      t010101 = tvproui.utils.Time.from(t010101);

      /* 时间加法 */
      var added = t010101.add(t005859);
      if (!t002000.equal(added)) {
        return false;
      }

      /* 时间减法 */
      var subResult = t002000.sub(t005859);
      if (!subResult.equal(t010101)) {
        return false;
      }
      if (subResult.toString() != t010101.toString()) {
        return false;
      }
      if (!t005859.before(t010101)) {
        return false;
      }
      if (!t010101.after(t005859)) {
        return false;
      }
      var _t010101 = tvproui.utils.Time.fromOffset(0);
      _t010101.setHour(1);
      _t010101.setMinute(1);
      _t010101.setSecond(1);
      if (!_t010101.equal(t010101)) {
        return false;
      }
      var _t020000 = tvproui.utils.Time.fromOffset(0);
      _t020000.setTime(2 * 60 * 60);
      if (_t020000.getHour() != 2) {
        return false;
      }
      dialog.Dialog.error(_t010101);
      dialog.Dialog.error(tvproui.utils.Time.fromComplexStringToOffset("20:00:00 - 10:00:00"));
      return true;
    }
  },
  members :
  {
    _time : 0,
    _day : 0,
    _hour : 0,
    _minute : 0,
    _second : 0,

    /* 时长 */

    /**
     * TODOC
     *
     * @param time {var} TODOC
     * @return {boolean} TODOC
     */
    setTime : function(time)
    {


      /*
      if(parseInt(time) !== time)
      {
          alert("警告setTime调用时必须传入int类型");
      }
      */
      if (time < 0)
      {
        dialog.Dialog.error("Time.js 时间不能小于0");
        return false;
      }
      this._time = time;

      /* 计算余下多少秒 */
      var second = time % 60;
      time -= second;

      /* 计算除去了除不尽60的秒数以后还需要多少分钟 */
      var minute = time / 60;

      /* 将每六十分钟记为一小时 */
      var hour = Math.floor(minute / 60);

      /* 将分钟内的小时部分去除 */
      minute -= hour * 60;

      /* 将24小时记为一天 */
      var day = Math.floor(hour / 24);

      /* 将小时内的天部分去除 */
      hour -= day * 24;
      this._day = day;
      this._hour = hour;
      this._minute = minute;
      this._second = second;
      return true;
    },


    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    getTime : function() {
      return this._time;
    },


    /**
     * TODOC
     *
     * @param day {var} TODOC
     * @return {boolean} TODOC
     */
    setDay : function(day)
    {
      if (day < 0)
      {
        dialog.Dialog.error("Time.js 天不能小于0");
        return false;
      }
      this._time += (day - this._day) * 60 * 60;
      this._day = day;
    },


    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    getDay : function() {
      return this._day;
    },

    /* 小时 */

    /**
     * TODOC
     *
     * @param hour {var} TODOC
     * @return {boolean} TODOC
     */
    setHour : function(hour)
    {
      if (hour < 0)
      {
        dialog.Dialog.error("Time.js 小时不能小于0");
        return false;
      }
      this._time += (hour - this._hour) * 60 * 60;
      this._hour = hour;
    },


    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    getHour : function() {
      return this._hour;
    },

    /* 分钟 */

    /**
     * TODOC
     *
     * @param minute {var} TODOC
     * @return {boolean} TODOC
     */
    setMinute : function(minute)
    {
      if (minute < 0)
      {
        dialog.Dialog.error("Time.js 分钟不能小于0");
        return false;
      }
      this._time += (minute - this._minute) * 60;
      this._minute = minute;
    },


    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    getMinute : function() {
      return this._minute;
    },


    /**
     * TODOC
     *
     * @param second {var} TODOC
     * @return {boolean} TODOC
     */
    setSecond : function(second)
    {
      if (second < 0)
      {
        dialog.Dialog.error("Time.js 秒不能小于0");
        return false;
      }
      this._time += second - this._second;
      this._second = second;
    },


    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    getSecond : function() {
      return this._second;
    },


    /**
     * TODOC
     *
     * @param cloneTime {var} TODOC
     * @return {var} TODOC
     */
    clone : function(cloneTime)
    {
      if (!cloneTime) {
        cloneTime = new tvproui.utils.Time();
      }
      cloneTime._time = this._time;
      cloneTime._day = this._day;
      cloneTime._hour = this._hour;
      cloneTime._minute = this._minute;
      cloneTime._second = this._second;
      return cloneTime;
    },

    /* 将本时间转换为xx:xx:xx字符串格式 */

    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    toString : function()
    {

      /* 查询是否有缓冲，若有则不再生成 */
      var time = this.getTime();
      var _dictOffsetString = tvproui.utils.Time._dictOffsetString;
      if (_dictOffsetString[time]) {
        return _dictOffsetString[time];
      }

      /* 生成标准时间格式，并写入缓冲 */
      var plusZero = tvproui.utils.Time.plusZero;
      var strTime = plusZero((this.getDay() * 24 + this.getHour()).toString(), 2) + ":" + plusZero(this.getMinute().toString(), 2) + ":" + plusZero(this.getSecond().toString(), 2);
      _dictOffsetString[time] = strTime;
      return strTime;
    },


    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    toString2 : function()
    {

      /* 查询是否有缓冲，若有则不再生成 */
      var time = this.getTime();
      var _dictOffsetString2 = tvproui.utils.Time._dictOffsetString2;
      if (_dictOffsetString2[time]) {
        return _dictOffsetString2[time];
      }

      /* 生成标准时间格式，并写入缓冲 */
      var plusZero = tvproui.utils.Time.plusZero;
      var strTime = plusZero((this.getHour()).toString(), 2) + ":" + plusZero(this.getMinute().toString(), 2) + ":" + plusZero(this.getSecond().toString(), 2);
      _dictOffsetString2[time] = strTime;
      return strTime;
    },

    /* 将本时间转换为xx:xx:xx字符串格式 */

    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    toDayString : function()
    {

      /* 查询是否有缓冲，若有则不再生成 */
      var time = this.getTime();
      var _dictDayOffsetString = tvproui.utils.Time._dictDayOffsetString;
      if (_dictDayOffsetString[time]) {
        return _dictDayOffsetString[time];
      }

      /* 生成标准时间格式，并写入缓冲 */
      var plusZero = tvproui.utils.Time.plusZero;
      var strTime;
      if (this.getDay() == 0) {
        strTime = plusZero(this.getHour().toString(), 2) + ":" + plusZero(this.getMinute().toString(), 2) + ":" + plusZero(this.getSecond().toString(), 2);
      } else {
        strTime = this.getDay().toString() + ":" + plusZero(this.getHour().toString(), 2) + ":" + plusZero(this.getMinute().toString(), 2) + ":" + plusZero(this.getSecond().toString(), 2);
      }
      _dictDayOffsetString[time] = strTime;
      return strTime;
    },

    /* 两时间段相减 */

    /**
     * TODOC
     *
     * @param subtrahend {var} TODOC
     * @return {var} TODOC
     */
    sub : function(subtrahend)
    {
      var thisTime = this.getTime();
      var thatTime = subtrahend.getTime();

      /* 不允许负数时段出现，倒一倒 */
      if (thisTime < thatTime) {
        alert("异常的时段，时长为负数");
      }
      return tvproui.utils.Time.fromOffset(thisTime - thatTime);
    },

    /* 两时间段相加 */

    /**
     * TODOC
     *
     * @param addend {var} TODOC
     * @return {var} TODOC
     */
    add : function(addend)
    {
      var thisTime = this.getTime();
      var thatTime = addend.getTime();
      return tvproui.utils.Time.fromOffset(thisTime + thatTime);
    },

    /* 两对象时长是否相同 */

    /**
     * TODOC
     *
     * @param that {var} TODOC
     * @return {var} TODOC
     */
    equal : function(that)
    {
      var thisTime = this.getTime();
      var thatTime = that.getTime();
      return (thisTime - thatTime) == 0;
    },

    /* 在某个时刻之前 */

    /**
     * TODOC
     *
     * @param that {var} TODOC
     * @return {var} TODOC
     */
    before : function(that)
    {
      var thisTime = this.getTime();
      var thatTime = that.getTime();
      return (thisTime - thatTime) < 0;
    },

    /* 在某个时刻之后 */

    /**
     * TODOC
     *
     * @param that {var} TODOC
     * @return {var} TODOC
     */
    after : function(that)
    {
      var thisTime = this.getTime();
      var thatTime = that.getTime();
      return (thisTime - thatTime) > 0;
    }
  },

  // 界面之外的内容释放
  destruct : function()
  {

    // 释放非显示层级对象
    this._time = null;
    this._day = null;
    this._hour = null;
    this._minute = null;
    this._second = null;
  }
});
