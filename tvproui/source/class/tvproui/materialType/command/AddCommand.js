
/**
 * @author 张未波
 * 添加命令
 */
qx.Class.define("tvproui.materialType.command.AddCommand",
{
  extend : tvproui.control.ui.table.command.AddCommand,
  members :
  {

    /* 服务器端执行添加操作 */
    /* @arg Object Item传入item */
    /* @return true/false */

    /**
     * TODOC
     *
     * @param item {var} TODOC
     * @return {var} TODOC
     */
    _executeServer : function(item) {
      return tvproui.AjaxPort.call("materialType/add",
      {
        "type" : item.type,
        "imageID" : item.imageID,
        "backcolor" : item.backcolor,
        "fontsize" : item.fontsize,
        "fontcolor" : item.fontcolor,
        "level" : item.level,
        "bold" : item.bold,
        "italic" : item.italic
      });
    },

    // 在服务器端执行取消 */

    /**
     * TODOC
     *
     * @param ID {var} TODOC
     * @return {var} TODOC
     */
    _cancelServer : function(ID)
    {
      if (null == tvproui.AjaxPort.call("materialType/delete", {
        "ID" : ID
      })) {
        return false;
      }
      return true;
    }
  }
});
