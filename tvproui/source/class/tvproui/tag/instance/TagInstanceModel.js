
/* ************************************************************************
************************************************************************ */
qx.Class.define('tvproui.tag.instance.TagInstanceModel',
{
  extend : tvproui.control.ui.table.model.ActionModel,
  construct : function()
  {

    /* 初始化数据 */
    this.base(arguments);

    /* 初始化列信息 */
    this.setColumns(["ID", "类型ID", "类型", "描述", "用户名", "更新时间", "数据类型ID", "数据ID"], ["ID", "tagType", "path", "tag", "useralias", "recordtime", "dataType", "dataID"]);

    /* 禁止编辑ID与编辑状态，这两个字段仅供维护使用，默认不作为用户内容展现 */
    this.setColumnEditable(0, false);
    this.setColumnEditable(1, false);
    this.setColumnEditable(2, true);
    this.setColumnEditable(3, true);
    this.setColumnEditable(4, false);
    this.setColumnEditable(5, false);
    this.setColumnEditable(6, false);
    this.setColumnEditable(7, false);

    /* 图标一栏仅在客户端有效 */
    this.setClientOnlyCol(2);
  },
  statics : {


    /**
     * TODOC
     *
     * @param tags {var} TODOC
     * @param dataID {var} TODOC
     * @param dataType {var} TODOC
     */
    cloneTags : function(tags, dataID, dataType)
    {
      tags = tags.datas;
      if (null == tags) {
        return;
      }
      for (var i = 0, l = tags.length; i < l; i++)
      {
        var tag = tags[i];
        tag.dataID = dataID;

        //如果约定了数据类型
        if (dataType) {
          tag.dataType = dataType;
        }
        tag.ID = tvproui.tag.instance.command.AddCommand.executeServer(tag);
      }
    }
  },
  members :
  {
    _lastRows : null,
    _lastTempRows : null,

    /* 获取新的添加命令 */

    /**
     * TODOC
     *
     * @param item {var} TODOC
     * @param position {var} TODOC
     * @return {var} TODOC
     */
    _getNewAddCommand : function(item, position) {
      return new tvproui.tag.instance.command.AddCommand(this, item, position);
    },

    /* 获取新的添加命令 */

    /**
     * TODOC
     *
     * @param ID {var} TODOC
     * @param col {var} TODOC
     * @param value {var} TODOC
     * @param oldValue {var} TODOC
     * @return {var} TODOC
     */
    _getNewUpdateCommand : function(ID, col, value, oldValue) {
      return new tvproui.tag.instance.command.UpdateCommand(this, ID, col, value, oldValue);
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
      return new tvproui.tag.instance.command.DeleteCommand(this, rowStart, rowEnd);
    },

    /* 获取新的移动命令, 用以被重载使用 */

    /**
     * TODOC
     *
     * @param row {var} TODOC
     * @param position {var} TODOC
     * @return {var} TODOC
     */
    _getNewMoveCommand : function(row, position) {
      return new tvproui.tag.instance.command.MoveCommand(this, row, position);
    },

    /* 加载素材数据 */

    /**
     * TODOC
     *
     * @param table {var} TODOC
     * @param loadTempTag {var} TODOC
     * @return {int | var} TODOC
     */
    loadData : function(table, loadTempTag)
    {
      var row = table.getFocusedRow();
      var col = table.getFocusedColumn();
      var model = table.getTableModel();

      // 判断焦点行是否可行
      if ((row !== 0) && (!row || row >= model.getRowCount())) {
        return 0;
      }
      var data;
      if (model.getNodeFromRow) {
        data = model.getNodeFromRow(row).columnData[col];
      } else {
        data = model.getValue(col, row);
        if (null == data) {
          return 0;
        }
      }
      var tempRows = data.tempDatas;
      var rows = data.datas;
      if ((null == rows) && (null == tempRows)) {
        return 0;
      }
      if ((rows === this._lastRows) && (tempRows === this._lastTempRows))
      {
        if (!rows && !tempRows) {
          return 0;
        }
        return (rows ? rows.length : 0) + (tempRows ? tempRows.length : 0);
      }
      this._lastRows = rows;
      this._lastTempRows = tempRows;
      if ((null == rows) && (null == tempRows))
      {
        this.setDataAsMapArray([]);
        return 0;
      }
      var result;
      if (tempRows && loadTempTag) {
        if (rows) {
          result = tempRows.concat(rows);
        } else {
          result = tempRows;
        }
      } else {
        if (rows == null) {
          rows = [];
        }
        result = rows;
      }
      this.setDataAsMapArray(result);
      return result.length;
    },


    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    getTempDatas : function() {
      return this._lastTempRows;
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
        results[pos++] = rowData;
      }
      return results;
    },

    /* 放入复制标签数据 */

    /**
     * TODOC
     *
     * @param startPosition {var} TODOC
     * @param columnDatas {var} TODOC
     * @param dataType {var} TODOC
     * @param dataID {var} TODOC
     * @return {boolean | var} TODOC
     */
    putCopyData : function(startPosition, columnDatas, dataType, dataID)
    {

      /* 没有数据 */
      if (columnDatas.length == 0) {
        return true;
      }

      /* 循环所有数据条目 */
      for (var i = 0, l = columnDatas.length; i < l; i++)
      {
        var columnData = columnDatas[i];
        columnData.ID = tvproui.utils.IDManager.getLocalTempID();
        columnData.dataType = dataType;
        columnData.dataID = dataID;
      }
      return this.addItems(columnDatas, startPosition);
    }
  },

  // 界面之外的内容释放
  destruct : function()
  {

    // 释放锁
    // 释放非显示层级对象
    // 去除多余的引用
    this._lastRows = null;
    this._lastTempRows = null;
  }
});
