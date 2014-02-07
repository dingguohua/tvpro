
/**
 * @author 张未波
 * 添加命令
 */
qx.Class.define("tvproui.EPG.editTable.command.AddCommand",
{
  extend : tvproui.control.ui.spanTable.model.command.AddCommand,
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
      var columnData = this._columnData;

      // 统计素材计数
      if (columnData.level == 3) {
        model.addMaterialCount(model.materialMap, columnData.IDMaterial, columnData.type);
      }
      return this.base(arguments);
    },


    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    cancelClient : function()
    {
      var model = this._target;
      var node = model.getNodeByNodeId(this._ID);
      model.removeMaterialNode(model.materialMap, node);
      return this.base(arguments);
    }
  }
});
