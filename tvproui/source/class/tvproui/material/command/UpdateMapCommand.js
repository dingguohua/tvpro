
/**
 * @author 张未波
 * 更新命令
 */
qx.Class.define("tvproui.material.command.UpdateMapCommand",
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

      // 替换时长
      for (var ID in map)
      {
        if (parseInt(ID) != ID) {
          continue;
        }
        var row = map[ID];
        if (row["duration"]) {
          row["duration"] = row["duration"].getTime();
        }
      }

      /* 执行更新操作 */
      var result = tvproui.AjaxPort.call("Material/updateItems", {
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
      return tvproui.material.command.UpdateMapCommand.executeServer(map);
    }
  }
});
