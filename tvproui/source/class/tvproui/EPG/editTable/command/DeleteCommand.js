
/**
 * @author 张未波
 * 删除命令
 */
qx.Class.define("tvproui.EPG.editTable.command.DeleteCommand",
{
  extend : tvproui.control.ui.spanTable.model.command.DeleteCommand,
  members :
  {
    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    executeClient : function()
    {
      var model = this._target;
      var node = model.getNodeByNodeId(this._ID);
      model.removeMaterialNode(model.materialMap, node);
      return this.base(arguments);
    }
  }
});
