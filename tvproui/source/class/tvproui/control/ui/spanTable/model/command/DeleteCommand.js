
/**
 * @author 张未波d
 */
qx.Class.define("tvproui.control.ui.spanTable.model.command.DeleteCommand",
{
  extend : tvproui.control.ui.command.Command,
  construct : function(model, ID)
  {
    this.base(arguments, model);

    /* 保存需要删除数据的ID */
    this._ID = ID;
  },
  
  members :
  {
    _ID : null,
    _rowInfo : null,
    _node: null,

    /* 客户端执行命令 */

    /**
     * TODOC
     *
     * @return {boolean} TODOC
     */
    executeClient : function()
    {
      var model = this._target;
      var ID = this._ID;

      /* 保存需要删除的数据用以恢复  */
      this._rowInfo = model.getNodeInfo(ID);
      this._node = model.copyNodeByNodeID(ID);

      /* 删除指定ID项目  */
      model.prune(ID);

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
      var model = this._target;
      var rowInfo = this._rowInfo;
      var node = this._node;

      model.restoreNode(rowInfo.parentID, rowInfo.position, node);

      return true;
    }
  },
  destruct : function()
  {
    this._ID = null;
    this._rowInfo = null;
    this._node = null;
  }
});
