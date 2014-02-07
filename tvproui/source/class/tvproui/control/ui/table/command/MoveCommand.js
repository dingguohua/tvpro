
/**
 * @author 张未波
 * 移动命令
 */
qx.Class.define("tvproui.control.ui.table.command.MoveCommand",
{
  extend : tvproui.control.ui.command.Command,
  construct : function(model, ID, position)
  {
    this.base(arguments, model);
    var row = model.getRowOfID(ID);
    this._rowStart = row;
    this._rowData = model.getRowData(row);
    this._rowID = ID;
    if (row <= position) {
      this._targetRow = position - 1;
    } else {
      this._targetRow = position;
    }
  },
  members :
  {
    _rowID : null,
    _rowStart : null,
    _rowData : null,
    _targetRow : null,

    /* 执行保存命令 */

    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    executeServer : function()
    {
      this.base(arguments);
      return this._executeServer(this._rowID, this._targetRow);
    },


    /**
     * TODOC
     *
     * @param ID {var} TODOC
     * @param position {var} TODOC
     * @return {boolean} TODOC
     */
    _executeServer : function(ID, position) {
      return true;
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
      return this._executeServer(this._rowID, this._rowStart);
    },

    /* 执行命令 */

    /**
     * TODOC
     *
     * @return {boolean} TODOC
     */
    executeClient : function()
    {
      this.base(arguments);

      // 查找位置
      var model = this._target;
      model.removeRows(this._rowStart, 1);
      model.addRows([this._rowData], this._targetRow);
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
      model.removeRows(this._targetRow, 1);
      model.addRows([this._rowData], this._rowStart);
      return true;
    }
  },
  destruct : function()
  {
    this._rowID = null;
    this._rowStart = null;
    this._rowData = null;
    this._targetRow = null;
  }
});
