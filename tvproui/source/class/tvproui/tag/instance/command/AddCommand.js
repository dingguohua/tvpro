
/**
 * @author 张未波
 * 添加命令
 */
qx.Class.define("tvproui.tag.instance.command.AddCommand",
{
  extend : tvproui.control.ui.table.command.AddCommand,
  statics : {


    /**
     * TODOC
     *
     * @param item {var} TODOC
     * @param position {var} TODOC
     * @return {var} TODOC
     */
    executeServer : function(item, position) {
      return tvproui.AjaxPort.call("tag/addTagInstance",
      {
        "tag" : item.tag,
        "tagType" : item.tagType,
        "dataType" : item.dataType,
        "dataID" : item.dataID,
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
     * @param position {var} TODOC
     * @return {var} TODOC
     */
    _executeServer : function(item, position) {
      return tvproui.tag.instance.command.AddCommand.executeServer(item, position);
    }
  }
});
