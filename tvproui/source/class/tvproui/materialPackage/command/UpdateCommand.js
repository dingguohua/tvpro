
/**
 * @author 张未波
 * 更新命令
 */
qx.Class.define("tvproui.materialPackage.command.UpdateCommand",
{
  extend : tvproui.control.ui.table.command.UpdateCommand,
  construct : function(model, ID, col, value, oldValue, materialID)
  {
    this.base(arguments, model, ID, col, value, oldValue);
    this._materialID = materialID;
  },
  members :
  {
    _materialID : null,

    // overide

    /**
     * TODOC
     *
     * @return {boolean | var} TODOC
     */
    executeServer : function()
    {
      var model = this._target;
      if (model.getClientOnlyCol(this._col)) {
        return true;
      }
      return this._executeServer(this._materialID, this._columnName, this._value);
    },

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
     * @return {boolean | var} TODOC
     */
    _executeServer : function(ID, columnName, value)
    {
      switch (columnName)
      {
        case "duration":value = value.getTime();
        break;
        case "tag":return true;
        break;
      }

      /* 执行更新操作 */
      var result = tvproui.AjaxPort.call("Material/modifyMaterial",
      {
        "id" : ID,
        "columnName" : columnName,
        "value" : value
      });
      return (result != null);
    }
  },

  // 界面之外的内容释放
  destruct : function() {

    // 去除多余的引用
    this._materialID = null;
  }
});
