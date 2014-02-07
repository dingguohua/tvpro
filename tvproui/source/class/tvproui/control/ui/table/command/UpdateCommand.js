
/**
 * @author 张未波
 * 命令基类
 */
qx.Class.define("tvproui.control.ui.table.command.UpdateCommand",
{
  extend : tvproui.control.ui.command.Command,
  construct : function(model, ID, col, value, oldValue)
  {
    this.base(arguments, model);
    this._ID = ID;
    this._col = col;
    this._columnName = model.getColumnId(col);
    this._value = value;
    this._oldValue = oldValue;
  },
  members :
  {
    _ID : null,
    _col : null,
    _columnName : null,
    _value : null,
    _oldValue : null,

    /* 执行命令 */

    /**
     * TODOC
     *
     * @return {boolean} TODOC
     */
    executeClient : function()
    {
      this.base(arguments);
      var model = this._target;
      var ID = tvproui.utils.IDManager.getNewID(this._ID);
      var row = model.getRowOfID(ID);
      var col = this._col;
      var value = this._value;
      model.setValue(col, row, value);
      return true;
    },

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
      if (model.getClientOnlyCol(this._col)) {
        return true;
      }
      var ID = tvproui.utils.IDManager.getNewID(this._ID);

      /* 新增数据，不需要提交修改 */
      if (ID < 0) {
        return true;
      }
      return this._executeServer(ID, this._columnName, this._value);
    },

    /* 服务器端执行添加操作, 请覆盖本函数 */
    /* @arg Integer ID 修改记录的ID */
    /* @arg String columnName 列名称 */
    /* @arg String value 修改记录的值 */
    /* @return true/false */

    /**
     * TODOC
     *
     * @param ID {var} TODOC
     * @param columnName {var} TODOC
     * @param value {var} TODOC
     * @return {boolean} TODOC
     */
    _executeServer : function(ID, columnName, value) {
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
      var ID = tvproui.utils.IDManager.getNewID(this._ID);
      var row = model.getRowOfID(ID);
      var col = this._col;
      var oldValue = this._oldValue;
      model.setValue(col, row, oldValue);
      return true;
    }
  },
  destruct : function()
  {
    this._ID = null;
    this._col = null;
    this._columnName = null;
    this._value = null;
    this._oldValue = null;
  }
});
