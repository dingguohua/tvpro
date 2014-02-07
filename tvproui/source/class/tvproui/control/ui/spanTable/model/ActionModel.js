
/* ************************************************************************
   Action Model
   A Model support command mode
   Authors:
     * Weibo Zhang (datouxia)

************************************************************************ */
qx.Class.define('tvproui.control.ui.spanTable.model.ActionModel',
{
  extend : tvproui.control.ui.spanTable.model.SpanTableModel,
  construct : function()
  {
    /* 初始化数据 */
    this.base(arguments);
    this._localIDPool = 0;
    this._clientOnlyCol = {

    };
  },
  members :
  {
    _clientOnlyCol : null,
    _localIDPool: null,

    getLocalID : function()
    {
      var resultID = ++this._localIDPool;

      // 当ID达到最大值，为了确保ID输出正确，将ID置0
      if(this._localIDPool == 0xffffffff)
      {
        this._localIDPool = 0;
      }
      
      return resultID;
    },

    /**
     * TODOC
     *
     * @param col {var} TODOC
     */
    setClientOnlyCol : function(col) {
      this._clientOnlyCol[col] = true;
    },


    /**
     * TODOC
     *
     * @param col {var} TODOC
     * @return {var} TODOC
     */
    IsClientOnlyCol : function(col) {
      return this._clientOnlyCol[col] == true;
    },


    /**
     * ******* 如果你实现了自己版本的命令的话请重载以下函数  **************
     *
     * @param type {var} TODOC
     * @param parentID {var} TODOC
     * @param position {var} TODOC
     * @param columnData {var} TODOC
     * @param styleMap {var} TODOC
     * @return {var} TODOC
     */
    /* 获取新的添加命令, 用以被重载使用 */
    _getNewAddCommand : function(type, parentID, position, columnData, styleMap) {
      return new tvproui.control.ui.spanTable.model.command.AddCommand(this, type, parentID, position, columnData, styleMap);
    },

    /* 获取新的更新命令, 用以被重载使用 */

    /**
     * TODOC
     *
     * @param oldMap {var} TODOC
     * @param newMap {var} TODOC
     * @return {var} TODOC
     */
    _getNewUpdateCommand : function(nodeID, columnID, newValue, oldValue) {
      return new tvproui.control.ui.spanTable.model.command.UpdateCommand(this, nodeID, columnID, newValue, oldValue);
    },

    /* 获取新的删除命令, 用以被重载使用 */

    /**
     * TODOC
     *
     * @param nodeID {var} TODOC
     * @return {var} TODOC
     */
    _getNewDeleteCommand : function(nodeID) {
      return new tvproui.control.ui.spanTable.model.command.DeleteCommand(this, nodeID);
    },

    /* 获取新的移动名林，用以被重载使用 */

    /**
     * TODOC
     *
     * @param nodeID {var} TODOC
     * @param parentID {var} TODOC
     * @param position {var} TODOC
     * @param direction {var} TODOC
     * @return {var} TODOC
     */
    _getNewMoveCommand : function(nodeID, parentID, position) {
      return new tvproui.control.ui.spanTable.model.command.MoveCommand(this, nodeID, parentID, position);
    },


    /**
     * ******* 内部用函数  **************
     *
     * @param command {var} TODOC
     * @return {boolean | var} TODOC
     */
    /* 建立添加数据事务 */
    _doCommand : function(command)
    {
      var result = command.executeClient();
      if (!result)
      {
        dialog.Dialog.error("对不起，客户端提交失败，请联系长江龙公司解决!");
        return false;
      }
      this.setData();
      return result;
    },

    // 选中内容变成树形结构存储到Ary

    /**
     * TODOC
     *
     * @param sections {var} TODOC
     * @param ary {var} TODOC
     * @return {var} TODOC
     */
    sectionToTree : function(sections, ary)
    {
      var tree = {

      };
      if (!ary) {
        ary = [];
      }

      /* 根据传入的区域 */
      for (var i = 0, l = sections.length; i < l; i++)
      {
        var section = sections[i];
        var level = section.level;
        var lastRow = section.maxIndex;
        for (var row = section.minIndex; row <= lastRow; row++)
        {
          var nodeID = this.getNodeIDByLevel(level, row);
          var node = this.getNodeByNodeId(nodeID);
          if (tree[nodeID]) {
            continue;
          }
          var parentNode = node;

          /* 寻找节点在当前给出节点中可用父位置（可以跨级） */
          var parentID = 0;
          do
          {
            parentNode = this.getNodeByNodeId(parentNode.parentID);
            parentID = parentNode.nodeID;

            /* 已经发现可用父级 */
            if (tree[parentID]) {
              break;
            }
          }while (parentID != 0);

          /* 孤立节点 */
          if (parentID == 0)
          {
            tree[nodeID] = node;
            ary.push(node);
            continue;
          }
        }
      }
      return ary;
    },

    // 复制子项

    /**
     * TODOC
     *
     * @param node {Node} TODOC
     * @param parentNode {var} TODOC
     * @return {var} TODOC
     */
    copyNode : function(node)
    {
      // 复制节点
      node = qx.lang.Object.clone(node);

      // 逐一复制子节点, 用子节点内容替代子节点ID
      var orginalChildren = node.children;
      var newChildren = [];
      node.children = newChildren;

      if (orginalChildren) {
        for (var i = 0, l = orginalChildren.length; i < l; i++) {
          var childID = orginalChildren[i];
          var child = this.getNodeByNodeId(childID);
          newChildren[i] = this.copyNode(child);
        }
      }
      return node;
    },

    /**
     * TODOC
     *
     * @param nodeID {var} TODOC
     * @return {var} TODOC
     */
    copyNodeByNodeID : function(nodeID)
    {
      var node = this.getNodeByNodeId(nodeID);
      return node ? this.copyNode(node) : null;
    },

    // 复制树

    /**
     * TODOC
     *
     * @param sections {var} TODOC
     * @return {var} TODOC
     */
    copyTree : function(sections)
    {
      var ary = this.sectionToTree(sections);
      for (var i = 0, l = ary.length; i < l; i++) {
        ary[i] = this.copyNode(ary[i]);
      }
      return ary;
    },

    // 获取节点描述信息

    /**
     * TODOC
     *
     * @param nodeID {var} TODOC
     * @return {Map} TODOC
     */
    getNodeInfo : function(nodeID)
    {
      var node = this.getNodeByNodeId(nodeID);

      /* 获取父节点ID */
      var parentID = node.parentID;
      var parentNode = this.getNodeByNodeId(parentID);

      /* 获取本节点位置 */
      var position = parentNode.children.indexOf(nodeID);

      return {
        parentID : parentID,
        position : position
      };
    },

    /* 根据信息恢复被删除节点 */

    /**
     * TODOC
     *
     * @param model {var} TODOC
     * @param rowInfo {var} TODOC
     */
    restoreNode : function(parentID, position, node)
    {
      var ID = node.nodeID;
      var columnData = node.columnData;
      var children = node.children;
      var styleMap = node.style;

      if (children) {
        this.addBranch(ID, parentID, position);
      } else {
        this.addLeaf(ID, parentID, position);
      }

      if (columnData) {
        this.setNode(ID, columnData, styleMap);
      }

      var children = node.children;
      for(var i = 0, l = children.length; i < l; i++)
      {
        var childNode = children[i];
        this.restoreNode(ID, i, childNode);
      }
    },

    // 添加数据到表格中 , 成功则返回用户ID，失败返回false

    /**
     * TODOC
     *
     * @param type {var} TODOC
     * @param parentID {var} TODOC
     * @param position {var} TODOC
     * @param columnData {var} TODOC
     * @param styleMap {var} TODOC
     * @return {var} TODOC
     */
    addItem : function(type, parentID, position, columnData, styleMap)
    {

      // 新建添加命令,并且执行命令
      var command = this._getNewAddCommand(type, parentID, position, columnData, styleMap);

      // 返回用户ID
      return this._doCommand(command);
    },

    /* 删除多行内容 */
    /* @arg Object[] itemRowRanges 要被删除的行范围数组， 其中每一个对象都包含minIndex和maxIndex */

    /**
     * TODOC
     *
     * @param itemRowRanges {var} TODOC
     * @param tree {var} TODOC
     * @return {var} TODOC
     */
    deleteItems : function(itemRowRanges, tree)
    {
      var commandGroup = [];

      /* 通过层级处理，剔除会造成重复删除的子集内容，所有需要执行删除的内容都在顶层 */
      if (!tree) {
        tree = [];
      }
      this.sectionToTree(itemRowRanges, tree);
      for (var i = 0, l = tree.length; i < l; i++)
      {
        var nodeID = tree[i].nodeID;
        commandGroup.push(this._getNewDeleteCommand(nodeID));
      }

      /* 插入并执行删除数据事务 */
      return this._doCommand(new tvproui.control.ui.command.GroupCommand(commandGroup));
    },

    /* 需要知道的信息有移动项目ID，目标位置的父级以及目标中的位置 */

    /**
     * TODOC
     *
     * @param nodeId {var} TODOC
     * @param targetParent {var} TODOC
     * @param targetPosition {var} TODOC
     * @return {var} TODOC
     */
    moveItem : function(nodeId, targetParent, targetPosition) {

      /* 插入并执行删除数据事务 */
      return this._doCommand(this._getNewMoveCommand(nodeId, targetParent, targetPosition));
    },

    /* 修改数据内容 , 一个值 */

    /**
     * TODOC
     *
     * @param ID {var} TODOC
     * @param columnID {var} TODOC
     * @param value {var} TODOC
     * @param oldValue {var} TODOC
     * @param node {Node} TODOC
     * @return {void | boolean} TODOC
     */
    updateItemByID : function(ID, columnID, value, oldValue)
    {
      // 深度比较
      if ((value.equal) && (value.equal === oldValue.equal) && (value.equal(oldValue))) {
        return;
      }
      if (value == oldValue) {
        return;
      }

      // 为了能让变更立即生效
      this.setColumnData(ID, columnID, value);

      return this._doCommand(this._getNewUpdateCommand(ID, columnID, value, oldValue));
    },

    saveToObject: function()
    {
      var nodeMap = this._nodeMap;
      var storage = {IDPool: this._localIDPool, nodeMap: nodeMap};
      return storage;
    },

    loadFromOjbect: function(storage)
    {
      this._localIDPool = storage.IDPool;
      this._nodeMap = storage.nodeMap;
      this.setData();

      return true;
    }
  },
  destruct : function()
  {
    this._clientOnlyCol = null;
  }
});
