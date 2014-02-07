
/**
 * @author 张未波
 * 移动命令
 */
qx.Class.define("tvproui.control.ui.treevirtual.command.MoveCommand",
{
  extend : tvproui.control.ui.command.Command,
  construct : function(model, nodeID, parentID, position)
  {
    this.base(arguments, model);
    this._nodeID = nodeID;
    var nodeInfo = model.getNodeInfo(nodeID);
    this._sourceParentID = nodeInfo.parentNode.nodeId;
    this._sourcePosition = nodeInfo.position;

    // 处理边界溢出
    var targetParent = model.getNodeByNodeId(parentID);
    this._targetParentID = parentID;
    this._targetPosition = (position > targetParent.children.length) ? targetParent.children.length : position;
  },
  members :
  {
    _nodeID : null,
    _sourceParentID : null,
    _sourcePosition : null,
    _targetParentID : null,
    _targetPosition : null,
    _direction : null,

    /* 执行保存命令 */

    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    executeServer : function()
    {
      this.base(arguments);
      var model = this._target;
      this._nodeID = model.getNewID(this._nodeID);
      this._targetParentID = model.getNewID(this._targetParentID);
      return this._executeServer(this._nodeID, this._targetParentID, this._targetPosition);
    },

    /* 服务器端执行移动操作, 请覆盖本函数 */
    /* @arg Integer nodeID 修改记录的ID */
    /* @arg Integer parentID 目标父级节点ID */
    /* @arg Integer position 目标父级节点中的新位置 */
    /* @return true/false */

    /**
     * TODOC
     *
     * @param nodeID {var} TODOC
     * @param parentID {var} TODOC
     * @param position {var} TODOC
     * @return {boolean} TODOC
     */
    _executeServer : function(nodeID, parentID, position) {
      return true;
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
      var model = this._target;
      this._nodeID = model.getNewID(this._nodeID);
      this._sourceParentID = model.getNewID(this._sourceParentID);
      return this._executeServer(this._nodeID, this._sourceParentID, this._sourcePosition);
    },

    /* 执行命令 */

    /**
     * TODOC
     *
     * @return {boolean} TODOC
     */
    executeClient : function()
    {
      this.base(arguments);
      var model = this._target;
      model.move(this._nodeID, this._targetParentID, this._targetPosition);
      model.setData();
      return true;
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
      model.move(this._nodeID, this._sourceParentID, this._sourcePosition);
      model.setData();
      return true;
    }
  },
  destruct : function()
  {
    this._nodeID = null;
    this._sourceParentID = null;
    this._sourcePosition = null;
    this._targetParentID = null;
    this._targetPosition = null;
    this._direction = null;
  }
});
