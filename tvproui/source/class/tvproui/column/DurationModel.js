
/* ************************************************************************
************************************************************************ */
qx.Class.define('tvproui.column.DurationModel',
{
  extend : tvproui.control.ui.table.model.TransModel,
  properties :
  {

    // 日节目预排表ID
    layoutVersionID : {
      check : "Integer"
    },

    // 锁定状态，锁定后不可编辑
    locked :
    {
      init : true,
      check : "Boolean"
    },

    // 正在编辑用户名
    editingAlias : {
      check : "String"
    }
  },
  construct : function()
  {

    /* 初始化数据 */
    this.base(arguments);

    /* 初始化列信息 */
    this.setColumns(["ID", "表编号", "起始", "结束", "时长", "栏目", "名称", "定时", "标签", "留白", "交叠", "变更"], ["ID", "layoutversionid", "beginTime", "endTime", "durationTime", "resourcetree_id", "name", "fixed", "tag", "spare", "intersection", "changed"]);

    /* 禁止编辑ID与编辑状态，这两个字段仅供维护使用，默认不作为用户内容展现 */
    this.setColumnEditable(0, false);
    this.setColumnEditable(1, false);
    this.setColumnEditable(2, true);
    this.setColumnEditable(3, true);
    this.setColumnEditable(4, true);
    this.setColumnEditable(5, true);
    this.setColumnEditable(6, true);
    this.setColumnEditable(7, false);
    this.setColumnEditable(8, true);
    this.setColumnEditable(9, false);
    this.setColumnEditable(10, false);
    this.setColumnEditable(11, false);

    /* 结束一栏仅在客户端有效 */
    this.setClientOnlyCol(4);
    this.setClientOnlyCol(9);
    this.setClientOnlyCol(10);
    this.setClientOnlyCol(11);
    this.setSortMethods(2, this._timeCompare);
    this.setSortMethods(3, this._timeCompare);
    this.setSortMethods(4, this._durationCompares);
  },
  members :
  {

    /* 获取新的添加命令 */

    /**
     * TODOC
     *
     * @param item {var} TODOC
     * @param position {var} TODOC
     * @return {var} TODOC
     */
    _getNewAddCommand : function(item, position) {
      return new tvproui.column.command.AddCommand(this, item, position);
    },

    /* 获取新的更新命令 */

    /**
     * TODOC
     *
     * @param oldMap {var} TODOC
     * @param newMap {var} TODOC
     * @return {var} TODOC
     */
    _getNewUpdateMapCommand : function(oldMap, newMap) {
      return new tvproui.column.command.UpdateMapCommand(this, oldMap, newMap);
    },

    /* 获取新的添加命令 */

    /**
     * TODOC
     *
     * @param rowStart {var} TODOC
     * @param rowEnd {var} TODOC
     * @return {var} TODOC
     */
    _getNewDeleteCommand : function(rowStart, rowEnd) {
      return new tvproui.column.command.DeleteCommand(this, rowStart, rowEnd);
    },


    /**
     * TODOC
     *
     * @param row1 {var} TODOC
     * @param row2 {var} TODOC
     * @return {int | var} TODOC
     */
    _durationCompares : function(row1, row2)
    {
      var duration1 = row1[4];
      var duration2 = row2[4];
      var offset = duration1.getTime() - duration2.getTime();
      if (offset > 0) {
        return 1;
      }
      if (offset < 0) {
        return -1;
      }
      return 0;
    },


    /**
     * TODOC
     *
     * @param row1 {var} TODOC
     * @param row2 {var} TODOC
     * @return {int | var} TODOC
     */
    _timeCompare : function(row1, row2)
    {
      var week1 = row1[1];
      var week2 = row2[1];
      var offset = week1 - week2;
      if (offset > 0) {
        return 1;
      }
      if (offset < 0) {
        return -1;
      }
      var startTime1 = row1[2];
      var startTime2 = row2[2];
      var offset = startTime1.getTime() - startTime2.getTime();
      if (offset > 0) {
        return 1;
      }
      if (offset < 0) {
        return -1;
      }
      var endTime1 = row1[3];
      var endTime2 = row1[3];
      offset = endTime1.getTime() - endTime2.getTime();
      if (offset > 0) {
        return 1;
      }
      if (offset < 0) {
        return -1;
      }
      return 0;
    },

    /* 修改数据 */

    /**
     * TODOC
     *
     * @param row {var} TODOC
     * @param col {var} TODOC
     * @param value {var} TODOC
     * @param oldValue {var} TODOC
     * @return {boolean | var} TODOC
     */
    updateItem : function(row, col, value, oldValue)
    {
      var rowData = this.getRowDataAsMap(row);
      var result = false;

      /* 验证数据合法性 ，不合法的保持原值放弃修改 */
      switch (col)
      {

        /* 开始时间  */
        case 2:/* 时间与旧值相比无变化，不产生变更 */
        if (value.equal(oldValue)) {
          return true;
        }
        result = this.updateItemCols(row, [2, 3, 11], [value, value.add(rowData.durationTime), true], [oldValue, rowData.endTime, rowData.changed]);
        break;

        /* 结束时间 */
        case 3:/* 时间与旧值相比无变化，不产生变更 */
        if (value.equal(oldValue)) {
          return true;
        }
        result = this.updateItemCols(row, [2, 3, 11], [value.sub(rowData.durationTime), value, true], [rowData.beginTime, oldValue, rowData.changed]);
        break;

        /* 时长 */
        case 4:if (value.equal(oldValue)) {
          return true;
        }
        result = this.updateItemCols(row, [3, 4, 11], [rowData.beginTime.add(value), value, true], [rowData.endTime, oldValue, rowData.changed]);
        break;
        case 8:case 9:case 10:case 11:result = true;
        break;
        default :result = this.base(arguments, row, col, value, oldValue);
        break;
      }
      return result;
    },

    /* 加载频道数据 */

    /**
     * TODOC
     *
     * @param layoutVersionID {var} TODOC
     * @return {null | Map} TODOC
     */
    loadData : function(layoutVersionID)
    {
      this.close();
      this.setLayoutVersionID(layoutVersionID);
      var rows = tvproui.AjaxPort.call("column/loadChannelDuration", {
        "layoutversionid" : layoutVersionID
      });
      if (null === rows)
      {
        dialog.Dialog.error("加载失败，服务器返回了异常的状态");
        this.setDataAsMapArray([]);
        return null;
      }
      var lock = (rows.lock != 1);
      this.setLocked(lock);
      var alias = (rows.alias == null) ? "" : rows.alias;
      this.setEditingAlias(alias);
      rows = rows.datas;
      if (null === rows)
      {
        this.setDataAsMapArray([]);
        return null;
      }
      if (false === rows)
      {
        dialog.Dialog.error("加载失败，服务器返回了异常的状态");
        this.setDataAsMapArray([]);
        return null;
      }
      for (var i = 0, l = rows.length; i < l; i++)
      {
        var row = rows[i];
        var duration = tvproui.utils.Duration.fromStartEnd(row.beginTime, row.endTime);
        row.beginTime = duration.getStartTime();
        row.endTime = duration.getEndTime();
        row.durationTime = duration.getDuration();
        row.ID = parseInt(row.ID);
        row.resourcetree_id = parseInt(row.resourcetree_id);

        //row.name = row.name
        row.layoutversionid = parseInt(row.layoutversionid);
        row.spare = "";
        row.intersection = "";
        row.changed = false;
        row.fixed = row.fixed == 1 ? true : false;
      }
      this.setDataAsMapArray(rows);
      this.check();
      return {
        alias : alias,
        lock : lock
      };
    },


    /**
     * TODOC
     *
     * @param spareList {var} TODOC
     * @param intersectionList {var} TODOC
     * @return {boolean} TODOC
     */
    check : function(spareList, intersectionList)
    {

      /* 读取数据进行交叠以及空闲 */
      var rows = this.getDataAsMapArray();
      if (2 > rows.length) {
        return true;
      }

      /* 将第一行标示为已经处理过的行 */
      var parsedStart = rows[0].beginTime;
      var parsedEnd = rows[0].endTime;
      var parseDuration = tvproui.utils.Duration.fromStartEnd(parsedStart, parsedEnd);
      for (var i = 1, l = rows.length; i < l; i++)
      {
        var row = rows[i];
        var currentStart = row.beginTime;
        var currentEnd = row.endTime;
        row.spare = "";
        row.intersection = "";
        var currentDuration = tvproui.utils.Duration.fromStartEnd(currentStart, currentEnd);
        var intersection = parseDuration.intersection(currentDuration);
        if (intersection != null)
        {
          row.intersection = "←";
          if (intersectionList) {
            intersectionList.push([i - 1, i, intersection]);
          }
        } else
        {

          /* 如果存在留白，那么肯定不相交 */
          var spare = currentStart.sub(parsedEnd);
          if (spare.getTime() > 0)
          {
            row.spare = "←";
            if (spareList) {
              spareList.push([i - 1, i, spare]);
            }
          }
        }
        parsedEnd = currentEnd;
        parseDuration.extendTo(parsedEnd);
        this.setRowsAsMapArray([row], i);
      }
      return true;
    },

    /* 修复时隙以及交叉问题 */

    /**
     * TODOC
     *
     * @return {void | boolean} TODOC
     */
    followFix : function()
    {
      var rowCount = this.getRowCount();

      // 仅有一行数据或者没有数据情况下不再处理
      if (rowCount <= 1) {
        return;
      }

      // 设定首行
      var parsedEnd = this.getValue(3, 0);

      /* 循环并且进行自动修正 */
      for (var i = 1; i < rowCount; i++)
      {
        var rowData = this.getRowDataAsMap(i);
        if (!rowData.beginTime.equal(parsedEnd) && !rowData.fixed)
        {

          //对改行进行标记，标记为自动修正
          this.updateItem(i, 2, parsedEnd.clone(), rowData.beginTime);
          parsedEnd = parsedEnd.add(rowData.durationTime);
          this.updateItem(i, 3, parsedEnd, rowData.endTime);
          if (!rowData.changed) {
            this.updateItem(i, 11, true, rowData.changed);
          }
        } else
        {
          parsedEnd = rowData.endTime;
          if (rowData.changed) {
            this.updateItem(i, 11, false, rowData.changed);
          }
        }
      }
      return true;
    },

    /* 获取拷贝的数组 */

    /**
     * TODOC
     *
     * @param minIndex {var} TODOC
     * @param maxIndex {var} TODOC
     * @return {var} TODOC
     */
    getCopyData : function(minIndex, maxIndex)
    {
      var results = [];
      results.length = maxIndex - minIndex + 1;
      var pos = 0;

      /* 取出数据 */
      for (var i = minIndex; i <= maxIndex; i++)
      {
        var rowData = this.getRowDataAsMap(i);
        delete rowData.spare;
        delete rowData.intersection;
        results[pos++] = rowData;
      }
      return results;
    },

    /* 放入复制频道数据 */

    /**
     * TODOC
     *
     * @param startPosition {var} TODOC
     * @param channelColumnDatas {var} TODOC
     * @param move {var} TODOC
     * @return {boolean | var} TODOC
     */
    putCopyChannelData : function(startPosition, channelColumnDatas, move)
    {

      /* 没有数据 */
      if (channelColumnDatas.length == 0) {
        return true;
      }

      /* 循环所有数据条目 */
      for (var i = 0, l = channelColumnDatas.length; i < l; i++)
      {
        var channelColumnData = channelColumnDatas[i];
        if (!move)
        {
          channelColumnData.ID = tvproui.utils.IDManager.getLocalTempID();
          channelColumnData.layoutversionid = this.getLayoutVersionID();
        }
        channelColumnData.spare = "";
        channelColumnData.intersection = "";
      }
      var result = this.addItems(channelColumnDatas, startPosition);
      return result;
    },

    // 清除所有的变更记录

    /**
     * TODOC
     *
     */
    cleanChanged : function()
    {

      /* 清除更新标记 */
      var rowCount = this.getRowCount();
      for (var i = 0, l = rowCount; i < l; i++)
      {
        this.setValue(9, i, "");
        this.setValue(10, i, "");
        this.setValue(11, i, false);
      }
    },

    /* 获取拷贝的数组 */

    /**
     * TODOC
     *
     * @param items {var} TODOC
     * @return {var} TODOC
     */
    sumDuration : function(items)
    {
      var duration = 0;

      /* 取出数据 */
      for (var i = 0, l = items.length; i < l; i++)
      {
        var item = items[i];
        for (var j = item.minIndex, k = item.maxIndex; j <= k; j++)
        {
          var rowData = this.getRowDataAsMap(j);
          duration += rowData.durationTime.getTime();
        }
      }
      return " 共计:" + tvproui.utils.Time.fromOffset(duration).toString();
    },


    /**
     * TODOC
     *
     */
    close : function()
    {

      // 锁定用户不需要关闭
      if (this.getLocked()) {
        return;
      }

      // 如果是可写模式，关闭引用的EPGVersion
      tvproui.AjaxPort.call("column/closeChannelDuration", {
        "layoutversionid" : this.getLayoutVersionID()
      });
    }
  },
  destruct : function() {

    // 釋放锁
    this.close();
  }
});
