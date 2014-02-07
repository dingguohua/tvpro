
/**
 * @author 张未波
 * 添加命令
 */
qx.Class.define("tvproui.control.ui.treevirtual.command.AddCommand",
{
  extend : tvproui.control.ui.command.Command,
  construct : function(model, type, parentID, position, label, rowData, columnData, icon, iconSelected)
  {
    this.base(arguments, model);
    this._type = type;
    this._parentID = parentID;
    this._position = position;
    this._label = label;
    this._rowData = rowData;
    this._columnData = columnData;
    this._icon = icon;
    this._iconSelected = iconSelected;
  },
  members :
  {
    _type : null,
    _parentID : null,
    _position : null,
    _ID : null,
    _label : null,
    _rowData : null,
    _columnData : null,
    _icon : null,
    _iconSelected : null,

    // 执行保存命令

    /**
     * TODOC
     *
     * @return {boolean | var} TODOC
     */
    executeServer : function()
    {
      this.base(arguments);
      var model = this._target;
      this._parentID = model.getNewID(this._parentID);

      /* 在服务器端插入数据 */
      var newID = this._executeServer(this._parentID, this._position, this._rowData);
      if (null == newID) {
        return false;
      }
      if (this._ID) {
        model.setNewID(this._ID, newID);
      }
      this._ID = newID;
      return newID;
    },

    /* 服务器端执行添加操作, 请覆盖本函数 , 本函数仅提供测试使用 */
    /* @arg int parentID 父对象编号 */
    /* @arg int position 相对于父对象位置 */
    /* @arg int rowData 插入数据内容 */
    /* @return ID */

    /**
     * TODOC
     *
     * @param parentID {var} TODOC
     * @param position {var} TODOC
     * @param rowData {var} TODOC
     * @return {var} TODOC
     */
    _executeServer : function(parentID, position, rowData) {
      return tvproui.utils.IDManager.getLocalTempID();
    },

    // 执行撤销命令

    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    cancelServer : function()
    {
      this.base(arguments);
      var ID = this._ID;

      // 在服务器上撤销
      return this._cancelServer(ID);
    },

    // 在服务器端执行取消, 请覆盖本函数 , 本函数仅提供测试使用*/

    /**
     * TODOC
     *
     * @param ID {var} TODOC
     * @return {boolean} TODOC
     */
    _cancelServer : function(ID) {
      return true;
    },

    /* 客户端执行命令 */

    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    executeClient : function()
    {
      this.base(arguments);
      var model = this._target;
      var ID = this._ID;
      switch (this._type)
      {
        case "branch":model.addBranch(this._parentID, this._label, true, false, this._icon, this._iconSelected, ID, this._position);
        break;
        case "leaf":model.addLeaf(this._parentID, this._label, this._icon, this._iconSelected, ID, this._position);
        break;
        default :dialog.Dialog.error("异常的节点类型，仅支持branch, leaf");
        break;
      }
      model.setColumnData(ID, "row", this._rowData);
      var columnData = this._columnData;
      if (!columnData) {
        return ID;
      }
      for (var i = 0, l = columnData.length; i < l; i++) {
        model.setColumnData(ID, i + 1, columnData[i]);
      }
      model.setData();
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
      this.base(arguments);
      var model = this._target;
      var ID = this._ID;
      model.prune(ID, true);
      model.setData();
      return true;
    }
  },
  destruct : function()
  {
    this._type = null;
    this._parentID = null;
    this._position = null;
    this._ID = null;
    this._label = null;
    this._rowData = null;
    this._columnData = null;
    this._icon = null;
    this._iconSelected = null;
  }
});
