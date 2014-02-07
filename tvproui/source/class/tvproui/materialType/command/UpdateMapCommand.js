
/**
 * @author 张未波
 * 更新命令
 */
qx.Class.define("tvproui.materialType.command.UpdateMapCommand",
{
  extend : tvproui.control.ui.table.command.UpdateMapCommand,
  statics : {


    /**
     * TODOC
     *
     * @param map {Map} TODOC
     * @return {boolean} TODOC
     */
    executeServer : function(map)
    {

      /* 执行更新操作 */
      var result = tvproui.AjaxPort.call("materialType/updateItems", {
        "data" : tvproui.utils.JSON.stringify(map)
      });
      return (result != null);
    }
  },
  members : {


    /**
     * TODOC
     *
     * @param map {Map} TODOC
     * @return {var} TODOC
     */
    _executeServer : function(map) {
      return tvproui.materialType.command.UpdateMapCommand.executeServer(map);
    }
  }
});
