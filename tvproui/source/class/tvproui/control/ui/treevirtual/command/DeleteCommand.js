
/**
 * @author 张未波
 * 删除命令
 */
qx.Class.define("tvproui.control.ui.treevirtual.command.DeleteCommand",
{
  extend : tvproui.control.ui.command.Command,
  construct : function(model, ID)
  {
    this.base(arguments, model);

    /* 保存需要删除数据的ID */
    this._ID = ID;
  },
  members :
  {
    _ID : null,
    _rowInfo : null,

    /* 服务器端执行命令 */

    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    executeServer : function()
    {
      this.base(arguments);
      var ID = this._ID;
      return this._executeServer(ID);
    },

    /* 服务器端执行, 请覆盖本函数 */
    /* @arg Integer ID 要删除的对象ID */
    /* @return true/false */

    /**
     * TODOC
     *
     * @param ID {var} TODOC
     * @return {boolean} TODOC
     */
    _executeServer : function(ID) {
      return false;
    },

    /* 根据信息恢复服务器端被删除节点 */

    /**
     * TODOC
     *
     * @param model {var} TODOC
     * @param rowInfo {var} TODOC
     * @return {var} TODOC
     */
    _restoreServer : function(model, rowInfo)
    {
      var node = rowInfo.node;
      var parentID = model.getNewID(node.parentNodeId);
      node.parentNodeId = parentID;
      var position = rowInfo.position;
      var rowData = node.columnData.row;
      var newID = this._cancelServer(parentID, position, rowData);
      node.nodeId = newID;
      var children = rowInfo.children;
      var childID;
      for (childID in children)
      {
        if (parseInt(childID) != childID) {
          continue;
        }
        var childRowInfo = children[childID];
        childRowInfo.node.parentNodeId = newID;
        this._restoreServer(model, childRowInfo);
      }
      return node.nodeId;
    },

    // 执行撤销命令

    /**
     * TODOC
     *
     * @return {boolean} TODOC
     */
    cancelServer : function()
    {
      this.base(arguments);
      var model = this._target;
      var rowInfo = this._rowInfo;
      var newID = this._restoreServer(model, rowInfo);
      model.setNewID(this._ID, newID);
      this._ID = newID;
      return true;
    },

    // 在服务器端执行取消, 请覆盖本函数 , 本函数仅提供测试使用*/

    /**
     * TODOC
     *
     * @param parentID {var} TODOC
     * @param position {var} TODOC
     * @param rowData {var} TODOC
     * @return {var} TODOC
     */
    _cancelServer : function(parentID, position, rowData) {
      return tvproui.utils.IDManager.getLocalTempID();
    },

    /* 客户端执行命令 */

    /**
     * TODOC
     *
     * @return {boolean} TODOC
     */
    executeClient : function()
    {
      this.base(arguments);
      var model = this._target;
      var ID = this._ID;

      /* 保存需要删除的数据用以恢复  */
      this._rowInfo = model.getChildrenNodeInfo(ID);

      /* 删除指定ID项目  */
      model.prune(ID, true);
      model.setData();
      return true;
    },

    /* 根据信息恢复被删除节点 */

    /**
     * TODOC
     *
     * @param model {var} TODOC
     * @param rowInfo {var} TODOC
     */
    _restoreNode : function(model, rowInfo)
    {
      var node = rowInfo.node;
      var position = rowInfo.position;
      var ID = node.nodeId;
      var columnData = node.columnData;
      var rowData = columnData['row'];
      switch (node.type)
      {
        case qx.ui.treevirtual.MTreePrimitive.Type.BRANCH:model.addBranch(node.parentNodeId, node.label, true, false, node.icon, node.iconSelected, ID, position);
        break;
        case qx.ui.treevirtual.MTreePrimitive.Type.LEAF:model.addLeaf(node.parentNodeId, node.label, node.icon, node.iconSelected, ID, position);
        break;
        default :dialog.Dialog.error("异常的节点类型，仅支持branch, leaf");
        break;
      }
      model.setColumnData(ID, "row", rowData);
      var pos;
      for (pos in columnData)
      {
        if (parseInt(pos) != pos) {
          continue;
        }
        model.setColumnData(ID, pos, columnData[pos]);
      }
      model.setData();
      var children = rowInfo.children;
      var childID;
      for (childID in children)
      {
        if (parseInt(childID) != childID) {
          continue;
        }
        var childRowInfo = children[childID];
        this._restoreNode(model, childRowInfo);
      }
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
      var rowInfo = this._rowInfo;
      this._restoreNode(model, rowInfo);
      return true;
    }
  },
  destruct : function()
  {
    this._ID = null;
    this._rowInfo = null;
  }
});
