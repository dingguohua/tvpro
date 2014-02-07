
/**
 * @author 张未波
 * 更新命令
 */
qx.Class.define("tvproui.layout.command.UpdateCommand",
{
  extend : tvproui.control.ui.treevirtual.command.UpdateCommand,
  members : {

    /* 服务器端执行添加操作, 请覆盖本函数 */
    /* @arg map 变更数据映射 */
    /* @return true/false */

    /**
     * TODOC
     *
     * @param map {Map} TODOC
     * @return {var} TODOC
     */
    _executeServer : function(map)
    {

      /* 执行更新操作 */
      var result = tvproui.AjaxPort.call("layoutVersion/updateItems", {
        "data" : tvproui.utils.JSON.stringify(map)
      });
      return (result != null);
    }
  }
});
