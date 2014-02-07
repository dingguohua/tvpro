
/**
 * @author 张未波
 * 添加命令
 */
qx.Class.define("tvproui.tag.command.AddCommand",
{
  extend : tvproui.control.ui.table.command.AddCommand,
  statics : {


    /**
     * TODOC
     *
     * @param item {var} TODOC
     * @return {var} TODOC
     */
    executeServer : function(item) {
      return tvproui.AjaxPort.call("tag/addTagType",
      {
        "Name" : item.name,
        "imageID" : item.imageid,
        "Desc" : item.desc
      });
    }
  },
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
      return tvproui.tag.command.AddCommand.executeServer(item);
    },

    // 在服务器端执行取消 */

    /**
     * TODOC
     *
     * @param ID {var} TODOC
     * @return {var} TODOC
     */
    _cancelServer : function(ID) {
      return tvproui.tag.command.DeleteCommand.executeServer(ID);
    }
  }
});
