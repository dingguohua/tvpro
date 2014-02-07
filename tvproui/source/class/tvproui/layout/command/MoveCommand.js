
/**
 * @author 张未波
 * 删除命令
 */
qx.Class.define("tvproui.layout.command.MoveCommand",
{
  extend : tvproui.control.ui.treevirtual.command.MoveCommand,
  members : {

    /* 服务器端执行删除 */
    /* @arg Integer ID 要删除的对象ID */
    /* @return true/false */

    /**
     * TODOC
     *
     * @param nodeID {var} TODOC
     * @param parentID {var} TODOC
     * @param position {var} TODOC
     * @return {boolean} TODOC
     */
    _executeServer : function(nodeID, parentID, position)
    {
      parentID = parentID ? parentID : -1;

      /* 执行更新操作 */
      if (null == tvproui.AjaxPort.call("layoutVersion/moveLayoutVersion",
      {
        "ID" : nodeID,
        "parentID" : parentID,
        "position" : position
      })) {
        return false;
      }
      return true;
    }
  }
});
