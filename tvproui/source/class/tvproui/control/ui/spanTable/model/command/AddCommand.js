
/**
 * @author 张未波
 * 添加命令
 */
qx.Class.define("tvproui.control.ui.spanTable.model.command.AddCommand",
{
  extend : tvproui.control.ui.command.Command,
  construct : function(model, type, parentID, position, columnData, styleMap)
  {
    this.base(arguments, model);
    this._type = type;
    this._parentID = parentID;
    this._position = position;
    this._columnData = columnData;
    this._styleMap = styleMap;
  },

  members :
  {
    _type : null,
    _parentID : null,
    _position : null,
    _columnData : null,
    _styleMap : null,
    _ID : null,

    /* 客户端执行命令 */

    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    executeClient : function()
    {
      var model = this._target;

      // 直接生成本地ID
      var ID;
      if(this._ID > 0)
      {
        ID = this._ID;
      }
      else
      {
        ID = this._ID = model.getLocalID();
      }

      switch (this._type)
      {
        case "branch":
          model.addBranch(ID, this._parentID, this._position);
        break;
        case "leaf":
          model.addLeaf(ID, this._parentID, this._position);
        break;
        default:
          dialog.Dialog.error("异常的节点类型，仅支持branch, leaf");
        break;
      }

      var columnData = this._columnData;
      if (!columnData)
      {
        return ID;
      }

      var styleMap = this._styleMap;
      model.setNode(ID, columnData, styleMap);

      return ID;
    },

    /* 取消命令 */

    /**
     * TODOC
     *
     * @return {boolean} TODOC
     */
    cancelClient : function()
    {
      var model = this._target;
      var ID = this._ID;
      model.prune(ID);
      return true;
    }
  },

  destruct : function()
  {
    this._type = null;
    this._parentID = null;
    this._position = null;
    this._columnData = null;
    this._styleMap = null;
    this._ID = null;
  }
});
