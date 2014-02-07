
/**
 * @author 张未波
 * 删除命令
 */
qx.Class.define("tvproui.control.ui.table.command.DeleteCommand",
{
  extend : tvproui.control.ui.command.Command,
  construct : function(model, rowStart, rowEnd)
  {
    this.base(arguments, model);

    /* 保存所有需要删除的数据 */
    var rows = [];
    var rowsPosition = [];
    rows.length = rowEnd - rowStart + 1;
    rowsPosition.length = rows.length;
    var pos = 0;
    for (var i = rowStart; i <= rowEnd; i++)
    {
      rowsPosition[pos] = i;
      rows[pos++] = model.getRowDataAsMap(i);
    }
    this._rowsPosition = rowsPosition;
    this._rows = rows;
  },
  members :
  {
    _rowsPosition : null,
    _rows : null,
    _rowStart : null,

    /* 服务器端执行命令 */

    /**
     * TODOC
     *
     * @return {boolean} TODOC
     */
    executeServer : function()
    {
      this.base(arguments);
      var model = this._target;
      var rows = this._rows;
      var IDColName = model.getIDColName();
      for (var i = 0, l = rows.length; i < l; i++)
      {
        var rowData = rows[i];
        var ID = tvproui.utils.IDManager.getNewID(rowData[IDColName]);

        /* 新增数据，没必要真正从服务器删除 */
        if (ID < 0) {
          continue;
        }
        if (!this._executeServer(ID)) {
          return false;
        }
      }
      return true;
    },

    /* 服务器端执行, 请覆盖本函数 */
    /* @arg Integer ID 要删除的对象ID */
    /* @return true/false */

    /**
     * TODOC
     *
     * @param ID {var} TODOC
     * @return {boolean} TODOC
     */
    _executeServer : function(ID) {
      return false;
    },

    // 执行撤销命令

    /**
     * TODOC
     *
     * @return {boolean} TODOC
     */
    cancelServer : function()
    {
      this.base(arguments);
      var model = this._target;
      var rowsPosition = this._rowsPosition;
      var rows = this._rows;

      /* 在服务器端插入数据 */
      var IDColName = model.getIDColName();
      for (var i = 0, l = rows.length; i < l; i++)
      {
        var rowData = rows[i];
        var row = rowsPosition[i];
        var oldID = tvproui.utils.IDManager.getNewID(rowData[IDColName]);
        var newID = this._cancelServer(rowData, row);
        if (null == newID) {
          return false;
        }
        tvproui.utils.IDManager.setNewID(oldID, newID);
        rowData[IDColName] = newID;
      }
      return true;
    },

    // 在服务器端执行取消, 请覆盖本函数 , 本函数仅提供测试使用*/

    /**
     * TODOC
     *
     * @param item {var} TODOC
     * @param row {var} TODOC
     * @return {var} TODOC
     */
    _cancelServer : function(item, row) {
      return tvproui.utils.IDManager.getLocalTempID();
    },

    /* 客户端执行命令 */

    /**
     * TODOC
     *
     * @return {boolean} TODOC
     */
    executeClient : function()
    {
      this.base(arguments);
      var model = this._target;
      var rows = this._rows;

      /* 查找第一行的位置 */
      var IDColName = model.getIDColName();
      var ID = tvproui.utils.IDManager.getNewID(rows[0][IDColName]);
      this._rowStart = model.getRowOfID(ID);

      /* 删除第一行开始的N行 */
      model.removeRows(this._rowStart, rows.length);
      return true;
    },

    /* 取消命令 */

    /**
     * TODOC
     *
     * @return {boolean} TODOC
     */
    cancelClient : function()
    {
      this.base(arguments);
      var model = this._target;
      var rows = this._rows;
      model.addRowsAsMapArray(rows.concat(), this._rowStart);
      return true;
    }
  },
  destruct : function()
  {
    this._rows = null;
    this._rowStart = null;
  }
});
