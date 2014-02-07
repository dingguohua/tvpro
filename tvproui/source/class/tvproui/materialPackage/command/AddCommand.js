
/**
 * @author 张未波
 * 添加命令
 */
qx.Class.define("tvproui.materialPackage.command.AddCommand",
{
  extend : tvproui.control.ui.table.command.AddCommand,
  statics : {


    /**
     * TODOC
     *
     * @param parentID {var} TODOC
     * @param childID {var} TODOC
     * @param broadcastDate {var} TODOC
     * @param position {var} TODOC
     * @return {var} TODOC
     */
    executeServer : function(parentID, childID, broadcastDate, position) {
      return tvproui.AjaxPort.call("materialpackage/addToPackage",
      {
        "parentMaterialID" : parentID,
        "childMaterialID" : childID,
        "broadcastDate" : broadcastDate,
        "position" : position
      });
    }
  },
  members : {

    /* 服务器端执行添加操作 */
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
      return tvproui.materialPackage.command.AddCommand.executeServer(model.getParentMaterialID(), item.materialID, model.getBroadcastDate(), row);
    }
  }
});
