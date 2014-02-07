
/**
 * @author 张未波
 * 更新命令
 */
qx.Class.define("tvproui.tag.command.UpdateMapCommand",
{
  extend : tvproui.control.ui.table.command.UpdateMapCommand,
  members : {


    /**
     * TODOC
     *
     * @param map {Map} TODOC
     * @return {var} TODOC
     */
    _executeServer : function(map)
    {

      /* 执行更新操作 */
      var result = tvproui.AjaxPort.call("tag/updateItems", {
        "data" : tvproui.utils.JSON.stringify(map)
      });
      return (result != null);
    }
  }
});
