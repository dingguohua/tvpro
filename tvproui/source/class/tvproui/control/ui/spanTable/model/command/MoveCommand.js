
/**
 * @author 张未波
 * 移动命令
 */
qx.Class.define("tvproui.control.ui.spanTable.model.command.MoveCommand",
{
  extend : tvproui.control.ui.command.Command,
  construct : function(model, nodeID, parentID, position)
  {
    this.base(arguments, model);
    this._nodeID = nodeID;
    var nodeInfo = model.getNodeInfo(nodeID);
    this._sourceParentID = nodeInfo.parentID;
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

    /* 执行命令 */

    /**
     * TODOC
     *
     * @return {boolean} TODOC
     */
    executeClient : function()
    {
      var model = this._target;
      model.move(this._nodeID, this._targetParentID, this._targetPosition);
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
      var model = this._target;
      model.move(this._nodeID, this._sourceParentID, this._sourcePosition);
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
  }
});
