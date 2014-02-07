
/**
 * @author 张未波
 * 删除命令
 */
qx.Class.define("tvproui.epgVersion.command.DeleteCommand",
{
  extend : tvproui.control.ui.treevirtual.command.DeleteCommand,
  members : {

    /* 服务器端执行删除 */
    /* @arg Integer ID 要删除的对象ID */
    /* @return true/false */

    /**
     * TODOC
     *
     * @param ID {var} TODOC
     * @return {boolean} TODOC
     */
    _executeServer : function(ID)
    {

      /* 执行更新操作 */
      if (null == tvproui.AjaxPort.call("epgVersion/remove", {
        "ID" : ID
      })) {
        return false;
      }
      return true;
    }
  }
});
