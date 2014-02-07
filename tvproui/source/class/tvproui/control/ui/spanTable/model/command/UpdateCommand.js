
/**
 * @author 张未波
 * 更新命令
 */
qx.Class.define("tvproui.control.ui.spanTable.model.command.UpdateCommand",
{
  extend : tvproui.control.ui.command.Command,
  construct : function(model, nodeID, columnID, newValue, oldValue)
  {
    this.base(arguments, model);
    this._nodeID = nodeID;
    this._columnID = columnID;
    this._oldValue = oldValue;
    this._newValue = newValue;
  },
  members :
  {
    _nodeID: null,
    _columnID: null,
    _oldValue : null,
    _newValue : null,

    /* 执行命令 */

    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    executeClient : function()
    {
      var model = this._target;
      return model.setColumnData(this._nodeID, this._columnID, this._newValue);
    },

    /* 取消命令 */

    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    cancelClient : function()
    {
      var model = this._target;
      return model.setColumnData(this._nodeID, this._columnID, this._oldValue);
    }
  },

  destruct : function()
  {
    this._nodeID = null;
    this._columnID = null;
    this._oldValue = null;
    this._newValue = null;
  }
});
