
/**
 * @author 张未波
 * 添加命令
 */
qx.Class.define("tvproui.layout.command.AddCommand",
{
  extend : tvproui.control.ui.treevirtual.command.AddCommand,
  members : {

    /* 服务器端执行添加操作 */
    /* @arg Object Item传入item */
    /* @return true/false */

    /**
     * TODOC
     *
     * @param parentID {var} TODOC
     * @param position {var} TODOC
     * @param rowData {var} TODOC
     * @return {var} TODOC
     */
    _executeServer : function(parentID, position, rowData)
    {
      parentID = parentID ? parentID : -1;
      return tvproui.AjaxPort.call("layoutVersion/addLayoutVersion",
      {
        "parentID" : parentID,
        "position" : position,
        "name" : rowData.name,
        "channelID" : rowData.channelID,
        "weekday" : rowData.weekday
      });
    }
  }
});
