
/* ************************************************************************
************************************************************************ */
qx.Class.define('tvproui.utils.Duration',
{
  extend : qx.core.Object,

  /* 为了效率，请不要直接构造本对象，使用tvproui.utils.Duration.fromStartEnd或者tvproui.utils.Duration.fromStartDuration来构造本对象 */
  construct : function() {
    this.base(arguments);
  },
  statics :
  {


    /**
     * TODOC
     *
     * @param start {var} TODOC
     * @param end {var} TODOC
     * @return {var} TODOC
     */
    fromStartEnd : function(start, end)
    {
      var newDuration = new tvproui.utils.Duration();
      newDuration.initStartTime(tvproui.utils.Time.from(start));
      newDuration.initDuration(tvproui.utils.Time.from(end).sub(newDuration.getStartTime()));
      return newDuration;
    },


    /**
     * TODOC
     *
     * @param start {var} TODOC
     * @param duration {var} TODOC
     * @return {var} TODOC
     */
    fromStartDuration : function(start, duration)
    {
      var newDuration = new tvproui.utils.Duration();
      newDuration.initStartTime(tvproui.utils.Time.from(start));
      newDuration.initDuration(tvproui.utils.Time.from(duration));
      return newDuration;
    },

    /* 测试用例 */

    /**
     * TODOC
     *
     * @return {boolean} TODOC
     */
    test : function()
    {

      /* 1:00 -> 1:30 */
      var a = tvproui.utils.Duration.fromStartDuration("02:00:00 - 01:00:00", "30:00");

      /* 2:00 -> 2:30 */
      var b = tvproui.utils.Duration.fromStartEnd("02:00:00", "02:30:00");
      if (a.intersection(b)) {
        return false;
      }
      if (b.intersection(a)) {
        return false;
      }

      /* 00:00 -> 2:00 */
      b = tvproui.utils.Duration.fromStartEnd("00:00:00", "02:00:00");
      var result1 = a.intersection(b);
      var result2 = b.intersection(a);
      if (!result1.equal(result2)) {
        return false;
      }
      dialog.Dialog.error(result1.toString());

      /* 00:45 -> 1:10 */
      b = tvproui.utils.Duration.fromStartEnd("00:45:00", "01:10:00");
      var result1 = a.intersection(b);
      var result2 = b.intersection(a);
      if (!result1.equal(result2)) {
        return false;
      }
      dialog.Dialog.error(result1.toString());
      return true;
    }
  },
  members :
  {
    _startTime : null,
    _endTime : null,
    _duration : null,


    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    toString : function() {
      return this.getStartTime().toString() + "(" + this.getDuration().toString() + ")";
    },

    /* 开始时间 */

    /**
     * TODOC
     *
     * @param startTime {var} TODOC
     */
    setStartTime : function(startTime)
    {
      startTime = tvproui.utils.Time.from(startTime);
      if (this._endTime) {
        this._endTime = startTime.add(this._duration);
      }
      this._startTime = startTime;
    },


    /**
     * TODOC
     *
     * @param startTime {var} TODOC
     */
    initStartTime : function(startTime) {
      this._startTime = startTime;
    },


    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    getStartTime : function()
    {
      if (!this._startTime)
      {
        dialog.Dialog.error("没有有效的起始时间!");
        return;
      }
      return this._startTime.clone();
    },

    /* 时间间隔 */

    /**
     * TODOC
     *
     * @param duration {var} TODOC
     */
    setDuration : function(duration)
    {
      duration = tvproui.utils.Time.from(duration);
      if (this._endTime) {
        this._endTime = this._startTime.add(duration);
      }
      this._duration = duration;
    },


    /**
     * TODOC
     *
     * @param duration {var} TODOC
     */
    initDuration : function(duration) {
      this._duration = duration;
    },


    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    getDuration : function() {
      return this._duration.clone();
    },

    /* 结束时间 */

    /**
     * TODOC
     *
     * @param endTime {var} TODOC
     */
    setEndTime : function(endTime)
    {
      endTime = tvproui.utils.Time.from(endTime);
      this._start = endTime.sub(this._duration);
      this._endTime = endTime;
    },

    /* 结束时间 */

    /**
     * TODOC
     *
     * @param endTime {var} TODOC
     */
    extendTo : function(endTime)
    {
      this._endTime = tvproui.utils.Time.from(endTime);
      this._duration = this._endTime.sub(this._startTime);
    },


    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    getEndTime : function()
    {
      if (!this._endTime) {
        this._endTime = this._startTime.add(this._duration);
      }
      return this._endTime.clone();
    },

    /* 求与另一个时间段的交集 */

    /**
     * TODOC
     *
     * @param that {var} TODOC
     * @return {null | var} TODOC
     */
    intersection : function(that)
    {
      var frontStart = this.getStartTime().getTime();
      var frontDuration = this.getDuration().getTime();
      var backStart = that.getStartTime().getTime();
      var backDuration = that.getDuration().getTime();

      /* 确保顺序先后 */
      if (frontStart > backStart)
      {
        var temp = backStart;
        backStart = frontStart;
        frontStart = temp;
        temp = backDuration;
        backDuration = frontDuration;
        frontDuration = temp;
      }

      /* 判断是否相交 */
      var result = frontStart + frontDuration - backStart;

      /* 情况一, 根本不相交 */
      if (result <= 0) {
        return null;
      }

      /* 情况二、完全包含 */
      if (result >= backDuration) {
        return tvproui.utils.Duration.fromStartDuration(backStart, backDuration);
      }

      /* 情况三，部分相交 */
      return tvproui.utils.Duration.fromStartDuration(backStart, result);
    },

    /* 求两个时间段是否相等 */

    /**
     * TODOC
     *
     * @param that {var} TODOC
     * @return {boolean} TODOC
     */
    equal : function(that)
    {
      if (!this.getStartTime().equal(this.getStartTime())) {
        return false;
      }
      if (!this.getDuration().equal(this.getDuration())) {
        return false;
      }
      return true;
    }
  },

  // 界面之外的内容释放
  destruct : function()
  {

    // 释放非显示层级对象
    this._startTime = null;
    this._endTime = null;
    this._duration = null;
  }
});
