
/**
 * @author 张未波
 * 删除命令
 */
qx.Class.define("tvproui.tag.command.DeleteCommand",
{
  extend : tvproui.control.ui.table.command.DeleteCommand,
  statics : {


    /**
     * TODOC
     *
     * @param ID {var} TODOC
     * @return {boolean} TODOC
     */
    executeServer : function(ID)
    {

      /* 执行更新操作 */
      if (null == tvproui.AjaxPort.call("tag/removeTagType", {
        "ID" : ID
      })) {
        return false;
      }
      return true;
    }
  },
  members :
  {

    /* 服务器端执行删除 */
    /* @arg Integer ID 要删除的对象ID */
    /* @return true/false */

    /**
     * TODOC
     *
     * @param ID {var} TODOC
     * @return {var} TODOC
     */
    _executeServer : function(ID) {
      return tvproui.tag.command.DeleteCommand.executeServer(ID);
    },

    // 在服务器端执行取消, 请覆盖本函数 , 本函数仅提供测试使用*/

    /**
     * TODOC
     *
     * @param item {var} TODOC
     * @param row {var} TODOC
     * @return {var} TODOC
     */
    _cancelServer : function(item, row) {
      return tvproui.tag.command.AddCommand.executeServer(item);
    }
  }
});
