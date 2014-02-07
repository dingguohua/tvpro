
/**
 * @author 张未波
 * 添加命令
 */
qx.Class.define("tvproui.control.ui.table.command.AddCommand",
{
  extend : tvproui.control.ui.command.Command,
  construct : function(model, item, row)
  {
    this.base(arguments, model);
    this._item = item;
    this._row = row;
  },
  members :
  {
    _item : null,
    _row : null,
    _ID : null,

    /* 执行保存命令 */

    /**
     * TODOC
     *
     * @return {boolean | var} TODOC
     */
    executeServer : function()
    {
      this.base(arguments);
      var model = this._target;
      var item = this._item;
      var row = this._row;

      /* 在服务器端插入数据 */
      var IDColName = model.getIDColName();
      var oldID = tvproui.utils.IDManager.getNewID(item[IDColName]);
      var newID = this._executeServer(item, row);
      if (null == newID) {
        return false;
      }
      tvproui.utils.IDManager.setNewID(oldID, newID);
      item[IDColName] = newID;
      this._ID = newID;
      return newID;
    },

    /* 服务器端执行添加操作, 请覆盖本函数 */
    /* @arg Object Item传入item */
    /* @return true/false */

    /**
     * TODOC
     *
     * @param item {var} TODOC
     * @param row {var} TODOC
     * @return {var} TODOC
     */
    _executeServer : function(item, row)
    {
      var model = this._target;
      var IDColName = model.getIDColName();
      return item[IDColName];
    },

    // 执行撤销命令

    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    cancelServer : function()
    {
      this.base(arguments);
      var ID = tvproui.utils.IDManager.getNewID(this._ID);
      this._ID = ID;

      // 在服务器上撤销
      return this._cancelServer(ID);
    },

    // 在服务器端执行取消, 请覆盖本函数 , 本函数仅提供测试使用*/

    /**
     * TODOC
     *
     * @param ID {var} TODOC
     * @return {boolean} TODOC
     */
    _cancelServer : function(ID) {
      return true;
    },

    /* 客户端执行命令 */

    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    executeClient : function()
    {
      this.base(arguments);
      var model = this._target;
      var rowData = this._item;
      var row = this._row;
      var IDColName = model.getIDColName();
      rowData[IDColName] = this._ID;
      model.addRowsAsMapArray([rowData], row);
      return this._ID;
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
      var row = model.getRowOfID(this._ID);
      model.removeRows(row, 1);
      return true;
    }
  },
  destruct : function()
  {
    this._item = null;
    this._row = null;
  }
});
