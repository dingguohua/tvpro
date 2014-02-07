
/**
 * @author 张未波
 * 移动命令
 */
qx.Class.define("tvproui.tag.instance.command.MoveCommand",
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

      /* 执行更新操作 */
      if (null == tvproui.AjaxPort.call("tag/moveTagInstance",
      {
        "ID" : ID,
        "position" : position
      })) {
        return false;
      }
      return true;
    }
  }
});
