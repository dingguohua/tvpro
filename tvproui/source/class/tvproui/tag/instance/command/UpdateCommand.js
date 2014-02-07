
/**
 * @author 张未波
 * 更新命令
 */
qx.Class.define("tvproui.tag.instance.command.UpdateCommand",
{
  extend : tvproui.control.ui.table.command.UpdateCommand,
  members : {

    /* 服务器端执行添加操作, 请覆盖本函数 */
    /* @arg Integer ID 修改记录的ID */
    /* @arg String columnName 列名称 */
    /* @arg String value 修改记录的值 */
    /* @return true/false */

    /**
     * TODOC
     *
     * @param ID {var} TODOC
     * @param columnName {var} TODOC
     * @param value {var} TODOC
     * @param model {var} TODOC
     * @return {var} TODOC
     */
    _executeServer : function(ID, columnName, value, model)
    {

      /* 执行更新操作 */
      var result = tvproui.AjaxPort.call("tag/modifyTagInstance",
      {
        "ID" : ID,
        "columnName" : columnName,
        "value" : value
      });
      return (result != null);
    }
  }
});
