
/**
 * @author 张未波
 * 移动命令
 */
qx.Class.define("tvproui.materialPackage.command.MoveCommand",
{
  extend : tvproui.control.ui.table.command.MoveCommand,
  members : {


    /**
     * TODOC
     *
     * @param ID {var} TODOC
     * @param position {var} TODOC
     * @return {boolean} TODOC
     */
    _executeServer : function(ID, position)
    {
      var model = this._target;

      /* 执行更新操作 */
      if (null == tvproui.AjaxPort.call("materialpackage/movePackage",
      {
        "parentMaterialID" : model.getParentMaterialID(),
        "sourcePackageID" : ID,
        "position" : position
      })) {
        return false;
      }
      return true;
    }
  }
});
