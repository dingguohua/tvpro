
/**
 * @author 张未波
 * 更新命令
 */
qx.Class.define("tvproui.column.command.UpdateMapCommand",
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

      // 替换时长
      for (var ID in map)
      {
        if (parseInt(ID) != ID) {
          continue;
        }
        var row = map[ID];
        if (row["fixed"]) {
          row["fixed"] = row["fixed"] ? 1 : 0;
        }
        if (row["beginTime"]) {
          row["beginTime"] = row["beginTime"].toString();
        }
        if (row["endTime"]) {
          row["endTime"] = row["endTime"].toString();
        }
      }

      /* 执行更新操作 */
      var result = tvproui.AjaxPort.call("column/updateItems", {
        "data" : tvproui.utils.JSON.stringify(map)
      });
      return (result != null);
    }
  }
});
