
/**
 * @author 张未波
 * 添加命令
 */
qx.Class.define("tvproui.column.command.AddCommand",
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
      return tvproui.AjaxPort.call("column/addColumnDuration",
      {
        "resourcetree_id" : item.resourcetree_id,
        "name" : item.name,
        "beginTime" : item.beginTime.toString(),
        "endTime" : item.endTime.toString(),
        "layoutversionid" : item.layoutversionid,
        "fixed" : (item.fixed ? 1 : 0)
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
      return tvproui.column.command.AddCommand.executeServer(item);
    },

    // 在服务器端执行取消 */

    /**
     * TODOC
     *
     * @param ID {var} TODOC
     * @return {var} TODOC
     */
    _cancelServer : function(ID) {
      return tvproui.column.command.DeleteCommand.executeServer(ID);
    }
  }
});
