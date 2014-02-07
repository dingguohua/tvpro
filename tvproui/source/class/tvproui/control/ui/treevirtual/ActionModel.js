
/* ************************************************************************
************************************************************************ */
qx.Class.define('tvproui.control.ui.treevirtual.ActionModel',
{
  extend : qx.ui.treevirtual.SimpleTreeDataModel,
  construct : function(columnNames)
  {

    /* 初始化数据 */
    this.base(arguments);

    /* 初始化变更记录 */
    this._colVarNames = columnNames;

    // 变更表
    this._oldMap = {

    };
    this._newMap = {

    };
    this._updateCounter = 0;
    this._newIDMap = {

    };
    this._oldIDMap = {

    };
    this._clientOnlyCol = {

    };
    this._editableColArr = this.getColumnEditable();
  },
  members :
  {

    // 可编辑列
    _editableColArr : null,

    /* 列变量名称 */
    _colVarNames : null,

    // 新旧数据映射表
    _oldMap : null,
    _newMap : null,

    // 更新计数器
    _updateCounter : null,

    // 新ID映射表
    _newIDMap : null,

    // 旧ID映射表
    _oldIDMap : null,
    _clientOnlyCol : null,


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
     * TODOC
     *
     * @param col {var} TODOC
     * @return {var} TODOC
     */
    getColumnVarName : function(col) {
      return this._colVarNames[col];
    },


    /**
     * ******* 如果你实现了自己版本的命令的话请重载以下函数  **************
     *
     * @param type {var} TODOC
     * @param parentID {var} TODOC
     * @param position {var} TODOC
     * @param ID {var} TODOC
     * @param label {var} TODOC
     * @param rowData {var} TODOC
     * @param columnData {var} TODOC
     * @param icon {var} TODOC
     * @param iconSelected {var} TODOC
     * @return {var} TODOC
     */
    /* 获取新的添加命令, 用以被重载使用 */
    _getNewAddCommand : function(type, parentID, position, ID, label, rowData, columnData, icon, iconSelected) {
      return new tvproui.control.ui.treevirtual.command.AddCommand(this, type, parentID, position, ID, label, rowData, columnData, icon, iconSelected);
    },

    /* 获取新的更新命令, 用以被重载使用 */

    /**
     * TODOC
     *
     * @param oldMap {var} TODOC
     * @param newMap {var} TODOC
     * @return {var} TODOC
     */
    _getNewUpdateCommand : function(oldMap, newMap) {
      return new tvproui.control.ui.treevirtual.command.UpdateCommand(this, oldMap, newMap);
    },

    /* 获取新的删除命令, 用以被重载使用 */

    /**
     * TODOC
     *
     * @param nodeID {var} TODOC
     * @return {var} TODOC
     */
    _getNewDeleteCommand : function(nodeID) {
      return new tvproui.control.ui.treevirtual.command.DeleteCommand(this, nodeID);
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
    _getNewMoveCommand : function(nodeID, parentID, position, direction) {
      return new tvproui.control.ui.treevirtual.command.MoveCommand(this, nodeID, parentID, position, direction);
    },

    // 实现数据行更新

    /**
     * TODOC
     *
     * @param ID {var} TODOC
     * @param node {Node} TODOC
     * @param row {var} TODOC
     * @param col {var} TODOC
     * @param value {var} TODOC
     * @return {boolean} TODOC
     */
    updateRowData : function(ID, node, row, col, value) {
      return true;
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
      if (!command.executeServer())
      {
        dialog.Dialog.error("对不起，服务器提交失败，您可以稍后再次尝试，您之前所做的修改已经提交到服务器，请您不必担心丢失!");
        return false;
      }
      var result = command.executeClient();
      if (!result)
      {
        dialog.Dialog.error("对不起，客户端提交失败，请联系长江龙公司解决!");
        return false;
      }
      return result;
    },


    /**
     * ******* 对外事务接口 **************
     *
     * @param parentNodeId {var} TODOC
     * @param label {var} TODOC
     * @param bOpened {Boolean} TODOC
     * @param bHideOpenCloseButton {Boolean} TODOC
     * @param icon {var} TODOC
     * @param iconSelected {var} TODOC
     * @param ID {var} TODOC
     * @param position {var} TODOC
     * @return {var} TODOC
     */

    /**
     * 重写了该函数，使得我们可以传入自己的ID以及指定插入点位置
     * Add a branch to the tree.
     *
     * @param parentNodeId {Integer}
     *   The node id of the parent of the node being added
     *
     * @param label {String}
     *   The string to display as the label for this node
     *
     * @param bOpened {Boolean}
     *   <i>True</i> if the branch should be rendered in its opened state;
     *   <i>false</i> otherwise.
     *
     * @param bHideOpenCloseButton {Boolean}
     *   <i>True</i> if the open/close button should not be displayed;
     *   <i>false</i> if the open/close button should be displayed
     *
     * @param icon {String}
     *   The relative (subject to alias expansion) or full path of the icon to
     *   display for this node when it is not a selected node.
     *
     * @param iconSelected {String}
     *   The relative (subject to alias expansion) or full path of the icon to
     *   display for this node when it is a selected node.
     *
     * @return {Integer}
     *   The node id of the newly-added branch.
     */
    addBranch : function(parentNodeId, label, bOpened, bHideOpenCloseButton, icon, iconSelected, ID, position) {
      return this._addNode(this._nodeArr, parentNodeId, label, bOpened, bHideOpenCloseButton, qx.ui.treevirtual.MTreePrimitive.Type.BRANCH, icon, iconSelected, ID, position);
    },


    /**
     * 重写了该函数，使得我们可以传入自己的ID以及指定插入点位置
     *
     * @param parentNodeId {Integer} The node id of the parent of the node being added
     * @param label {String} The string to display as the label for this node
     * @param icon {String} The relative (subject to alias expansion) or full path of the icon to
     *                 display for this node when it is not a selected node.
     * @param iconSelected {String} The relative (subject to alias expansion) or full path of the icon to
     *                 display for this node when it is a selected node.
     * @param ID {var} TODOC
     * @param position {var} TODOC
     * @return {Integer} The node id of the newly-added leaf.
     */
    addLeaf : function(parentNodeId, label, icon, iconSelected, ID, position) {
      return this._addNode(this._nodeArr, parentNodeId, label, false, false, qx.ui.treevirtual.MTreePrimitive.Type.LEAF, icon, iconSelected, ID, position);
    },


    /**
     * 重写了该函数，使得我们可以指定插入点位置
     * Add a node to the tree.
     *
     * NOTE: This method is for <b>internal use</b> and should not be called by
     *       users of this class. There is no guarantee that the interface to this
     *       method will remain unchanged over time.
     *
     * @param nodeArr {Array | Map} The array to which new nodes are to be added. See, however, the
     *                 nodeId parameter. If nodeId values will be provided, then nodeArr can
     *                 be a map. The traditional TreeVirtual does not provide node ids, and
     *                 passes an array for this parameter.
     * @param parentNodeId {Integer} The node id of the parent of the node being added
     * @param label {String} The string to display as the label for this node
     * @param bOpened {Boolean} <i>true</i> if the tree should be rendered in its opened state;
     *                 <i>false</i> otherwise.
     * @param bHideOpenCloseButton {Boolean} <i>true</i> if the open/close button should be hidden (not displayed);
     *                 </i>false</i> to display the open/close button for this node.
     * @param type {Integer} The type of node being added.  The type determines whether children
     *                 may be added, and determines the default icons to use.  This
     *                 parameter must be one of the following values:
     *                 <dl>
     *                   <dt>qx.ui.treevirtual.SimpleTreeDataModel.Type.BRANCH</dt>
     *                   <dd>
     *                     This node is a branch.  A branch node may have children.
     *                   </dd>
     *                   <dt>qx.ui.treevirtual.SimpleTreeDataModel.Type.LEAF</dt>
     *                   <dd>
     *                     This node is a leaf, and may not have children
     *                   </dd>
     *                 </dl>
     * @param icon {String} The relative (subject to alias expansion) or full path of the icon to
     *                 display for this node when it is not a selected node.
     * @param iconSelected {String} The relative (subject to alias expansion) or full path of the icon to
     *                 display for this node when it is a selected node.
     *
     *
     *                 NOTE: As of 13 Mar 2009, this feature is disabled by default, by
     *                       virtue of the fact that the tree's "alwaysUpdateCells" property
     *                       has a setting of 'false' now instead of 'true'. Setting this
     *                       property to true allows the icon to change upon selection, but
     *                       causes problems such as single clicks not always selecting a
     *                       row, and, in IE, double click operations failing
     *                       completely. (For more information, see bugs 605 and 2021.) To
     *                       re-enable the option to have an unique icon that is displayed
     *                       when the node is selected, issue
     *                       <code>tree.setAlwaysUpdateCells(true);</code>
     * @param nodeId {Integer} The requested node id for this new node. If not provided, nodeArr
     *                 will be assumed to be an array, not a map, and the next available
     *                 index of the array will be used. If it is provided, then nodeArr may
     *                 be either an array or a map.
     * @param position {var} TODOC
     * @return {Integer} The node id of the newly-added node.
     * @throws If one tries to add a child to a non-existent parent.
     */
    _addNode : function(nodeArr, parentNodeId, label, bOpened, bHideOpenCloseButton, type, icon, iconSelected, nodeId, position)
    {
      var parentNode;

      // Ensure that if parent was specified, it exists
      if (parentNodeId)
      {
        parentNode = nodeArr[parentNodeId];
        if (!parentNode) {
          throw new Error("Request to add a child to a non-existent parent");
        }

        // Ensure parent isn't a leaf
        if (parentNode.type == qx.ui.treevirtual.SimpleTreeDataModel.Type.LEAF) {
          throw new Error("Sorry, a LEAF may not have children.");
        }
      } else
      {

        // This is a child of the root
        parentNode = nodeArr[0];
        parentNodeId = 0;
      }

      // If this is a leaf, we don't present open/close icon
      if (type == qx.ui.treevirtual.SimpleTreeDataModel.Type.LEAF)
      {

        // mask off the opened bit but retain the hide open/close button bit
        bOpened = false;
        bHideOpenCloseButton = false;
      }

      // Determine the node id of this new node
      if (nodeId === undefined) {
        nodeId = nodeArr.length;
      }

      // Set the data for this node.
      var node =
      {
        type : type,
        nodeId : nodeId,
        parentNodeId : parentNodeId,
        label : label,
        bSelected : false,
        bOpened : bOpened,
        bHideOpenClose : bHideOpenCloseButton,
        icon : icon,
        iconSelected : iconSelected,
        children : [],
        columnData : []
      };

      // Add this node to the array
      nodeArr[nodeId] = node;

      // Add this node to its parent's child array.
      if (position !== 0 && !position) {
        parentNode.children.push(nodeId);
      } else {
        parentNode.children.splice(position, 0, nodeId);
      }

      // Return the node id we just added
      return nodeId;
    },


    /**
     * 重写了该函数，使得我们可以指定插入点位置
     * Move a node in the tree.
     *
     * @param moveNodeReference {Object | Integer} The node to be moved.  The node can be represented
     *                 either by the node object, or the node id (as would have been
     *                 returned by addBranch(), addLeaf(), etc.)
     * @param parentNodeReference {Object | Integer} The new parent node, which must not be a LEAF.  The node can be
     *                 represented either by the node object, or the node id (as would have
     *                 been returned by addBranch(), addLeaf(), etc.)
     * @param position {var} TODOC
     * @throws If the node object or id is not valid.
     */
    move : function(moveNodeReference, parentNodeReference, position)
    {
      var moveNode;
      var moveNodeId;
      var parentNode;
      var parentNodeId;

      // Replace null parent with node id 0
      parentNodeReference = parentNodeReference || 0;
      if (typeof (moveNodeReference) == "object")
      {
        moveNode = moveNodeReference;
        moveNodeId = moveNode.nodeId;
      } else if (typeof (moveNodeReference) == "number")
      {
        moveNodeId = moveNodeReference;
        moveNode = this._nodeArr[moveNodeId];
      } else
      {
        throw new Error("Expected move node object or node id");
      }

      if (typeof (parentNodeReference) == "object")
      {
        parentNode = parentNodeReference;
        parentNodeId = parentNode.nodeId;
      } else if (typeof (parentNodeReference) == "number")
      {
        parentNodeId = parentNodeReference;
        parentNode = this._nodeArr[parentNodeId];
      } else
      {
        throw new Error("Expected parent node object or node id");
      }

      // Ensure parent isn't a leaf
      if (parentNode.type == qx.ui.treevirtual.MTreePrimitive.Type.LEAF) {
        throw new Error("Sorry, a LEAF may not have children.");
      }

      // Remove the node from its current parent's children list
      var oldParent = this._nodeArr[moveNode.parentNodeId];
      qx.lang.Array.remove(oldParent.children, moveNodeId);

      // Add this node to its parent's child array.
      if (position !== 0 && !position) {
        parentNode.children.push(moveNodeId);
      } else {
        parentNode.children.splice(position, 0, moveNodeId);
      }

      // Replace this node's parent reference
      this._nodeArr[moveNodeId].parentNodeId = parentNodeId;
    },

    // overridden

    /**
     * TODOC
     *
     * @param columnIndex {var} TODOC
     * @return {var} TODOC
     */
    isColumnEditable : function(columnIndex) {
      return (this._editableColArr ? this._editableColArr[columnIndex] == true : false);
    },

    /* 获取节点信息 */

    /**
     * TODOC
     *
     * @param nodeId {var} TODOC
     * @return {var} TODOC
     */
    getNodeByNodeId : function(nodeId) {
      return this._nodeArr[nodeId];
    },

    /* 获取根部 */

    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    getRoot : function() {
      return this._nodeArr[0];
    },

    // 判断child是否是parent下面的节点

    /**
     * TODOC
     *
     * @param parent {var} TODOC
     * @param child {var} TODOC
     * @return {boolean} TODOC
     */
    isChildByNode : function(parent, child)
    {
      var childID = child.nodeId;
      var children = parent.children;
      if (children.indexOf(childID) != -1) {
        return true;
      }
      for (var i = 0, l = children.length; i < l; i++)
      {
        var childNode = this.getNodeByNodeId(children[i]);
        if (this.isChildByNode(childNode, child)) {
          return true;
        }
      }
      return false;
    },

    // 根据ID判断子节点

    /**
     * TODOC
     *
     * @param parentID {var} TODOC
     * @param childID {var} TODOC
     * @return {var} TODOC
     */
    isChildByID : function(parentID, childID)
    {
      var parent = this.getNodeByNodeId(parentID);
      var child = this.getNodeByNodeId(childID);
      return this.isChildByNode(parent, child);
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
      var row = this.getRowFromNodeId(nodeID);
      var node = this.getNodeByNodeId(nodeID);

      /* 获取父节点ID */
      var parentID = node.parentNodeId;
      var parentNode;

      /* 获取本节点位置 */
      if (parentID == 0) {
        parentNode = this.getRoot();
      } else {
        parentNode = this.getNodeByNodeId(parentID);
      }
      var position = parentNode.children.indexOf(nodeID);
      return {
        row : row,
        node : node,
        parentNode : parentNode,
        position : position
      };
    },

    // 获取节点以及其子节点的描述信息

    /**
     * TODOC
     *
     * @param nodeID {var} TODOC
     * @return {var} TODOC
     */
    getChildrenNodeInfo : function(nodeID)
    {
      var rowInfo = this.getNodeInfo(nodeID);
      var children = {

      };
      rowInfo.children = children;
      var node = rowInfo.node;
      var childrenID = node.children;
      for (var i = 0, l = childrenID.length; i < l; i++)
      {
        var childID = childrenID[i];
        children[childID] = this.getChildrenNodeInfo(childID);
      }
      return rowInfo;
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
        var minIndex = section.minIndex;
        var maxIndex = section.maxIndex;

        /* 将选中的节点分层次存入选中节点数组 */
        for (var j = minIndex; j <= maxIndex; j++)
        {

          /* 获取节点 */
          var nodeItem = this.getNodeFromRow(j);
          var parentNodeItem = nodeItem;
          var parentID = 0;

          /* 寻找节点在当前给出节点中可用父位置（可以跨级） */
          do
          {
            var parentID = parentNodeItem.parentNodeId;
            if (parentID == 0) {
              break;
            }

            /* 已经发现可用父级 */
            if (tree[parentID]) {
              break;
            }

            /* 继续寻找上层父级 */
            parentNodeItem = this.getNodeByNodeId(parentID);
          }while (parentID != 0);
          var node = {
            item : nodeItem
          };

          /* 若拥有子节点，则做一些准备 */
          if (nodeItem.children.length > 0) {
            node.children = [];
          }

          /* 孤立节点 */
          if (parentID == 0)
          {
            tree[nodeItem.nodeId] = node;
            ary.push(node);
            continue;
          }
          node.parent = tree[parentID];
          node.parent.children.push(node);
        }
      }
      return ary;
    },

    // 复制子项

    /**
     * TODOC
     *
     * @param item {var} TODOC
     * @return {var} TODOC
     */
    _CopySubItem : function(item)
    {
      var result = [];
      var children = item.children;
      for (var i = 0, l = children.length; i < l; i++)
      {
        var childID = children[i];
        var child = this.getNodeByNodeId(childID);
        var childObject = {
          item : qx.lang.Object.clone(child)
        };

        /* 递归完成子集建立 */
        if (child.children.length > 0) {
          childObject.children = this._CopySubItem(child);
        }
        result.push(childObject);
      }
      return result;
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
      for (var i = 0, l = ary.length; i < l; i++)
      {
        var node = ary[i];
        if (!node.children) {
          continue;
        }
        var item = node.item;
        if (item.children.length > 0) {
          node.children = this._CopySubItem(item);
        }
      }
      return ary;
    },

    // 添加数据到表格中 , 成功则返回用户ID，失败返回false

    /**
     * TODOC
     *
     * @param type {var} TODOC
     * @param parentID {var} TODOC
     * @param position {var} TODOC
     * @param label {var} TODOC
     * @param rowData {var} TODOC
     * @param columnData {var} TODOC
     * @param icon {var} TODOC
     * @param iconSelected {var} TODOC
     * @return {var} TODOC
     */
    addItem : function(type, parentID, position, label, rowData, columnData, icon, iconSelected)
    {

      // 新建添加命令,并且执行命令
      var command = this._getNewAddCommand(type, parentID, position, label, rowData, columnData, icon, iconSelected);

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
        var nodeID = tree[i].item.nodeId;
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
     * @param col {var} TODOC
     * @param value {var} TODOC
     * @param oldValue {var} TODOC
     * @return {void | boolean} TODOC
     */
    updateItemByID : function(ID, col, value, oldValue)
    {

      // 深度比较
      if ((value.equal) && (value.equal === oldValue.equal) && (value.equal(oldValue))) {
        return;
      }
      if (value == oldValue) {
        return;
      }
      var oldRow = this._oldMap[ID];
      if (!oldRow)
      {
        oldRow = {

        };
        this._oldMap[ID] = oldRow;
      }

      // 只保存第一次初始值
      if (!oldRow[col]) {
        oldRow[col] = oldValue;
      }
      var newRow = this._newMap[ID];
      if (!newRow)
      {
        newRow = {

        };
        this._newMap[ID] = newRow;
      }
      newRow[col] = value;

      // 更新变更计数器
      this._updateCounter++;

      // 实际进行本地修改(保证后续函数运行)
      var node = this.getNodeByNodeId(ID);
      var row = node.columnData.row;
      this.updateRowData(ID, node, row, col, value);
      return true;
    },

    /* 修改数据内容 , 一个值 */

    /**
     * TODOC
     *
     * @param row {var} TODOC
     * @param col {var} TODOC
     * @param value {var} TODOC
     * @param oldValue {var} TODOC
     * @return {Node} TODOC
     */
    updateItem : function(row, col, value, oldValue)
    {

      /* 获取行ID */
      var node = this.getNodeFromRow(row);
      var ID = node.nodeId;
      this.updateItemByID(ID, col, value, oldValue);
      return node;
    },

    // 提交修改数据

    /**
     * TODOC
     *
     * @return {void | var} TODOC
     */
    commitUpdate : function()
    {
      if (this._updateCounter == 0) {
        return;
      }

      /* 插入并执行更新数据事务 */
      var result = this._doCommand(this._getNewUpdateCommand(this._oldMap, this._newMap));
      if (!result) {

        // 提交更新时发生错误
        return result;
      }
      this._oldMap = {

      };
      this._newMap = {

      };
      this._updateCounter = 0;
      return result;
    },


    /**
     * TODOC
     *
     * @param oldID {var} TODOC
     * @param newID {var} TODOC
     */
    setNewID : function(oldID, newID) {
      this._newIDMap[oldID] = newID;
    },


    /**
     * TODOC
     *
     * @param oldID {var} TODOC
     * @return {var} TODOC
     */
    getNewID : function(oldID)
    {
      var newID = this._newIDMap[oldID];
      if (!newID) {
        return oldID;
      }
      return newID;
    },


    /**
     * TODOC
     *
     * @param ID {var} TODOC
     * @param recursive {var} TODOC
     */
    openItem : function(ID, recursive)
    {
      var node = this.getNodeByNodeId(ID);
      if (!node) {
        return;
      }
      this.setState(node, {
        bOpened : true
      });
      if (!recursive) {
        return;
      }
      var children = node.children;
      for (var i = 0, l = children.length; i < l; i++) {
        this.openItem(children[i], true);
      }
    },


    /**
     * TODOC
     *
     * @param ID {var} TODOC
     * @param recursive {var} TODOC
     * @param limit {var} TODOC
     */
    closeItem : function(ID, recursive, limit)
    {
      var node = this.getNodeByNodeId(ID);
      if (!node) {
        return;
      }
      if (node.level >= limit) {
        this.setState(node, {
          bOpened : false
        });
      }
      if (!recursive) {
        return;
      }
      var children = node.children;
      for (var i = 0, l = children.length; i < l; i++) {
        this.closeItem(children[i], true, limit);
      }
    }
  },
  destruct : function()
  {

    // 可编辑列
    this._editableColArr = null;

    /* 列变量名称 */
    this._colVarNames = null;

    // 新旧数据映射表
    this._oldMap = null;
    this._newMap = null;

    // 更新计数器
    this._updateCounter = null;

    // 新ID映射表
    this._newIDMap = null;

    // 旧ID映射表
    this._oldIDMap = null;
    this._clientOnlyCol = null;
  }
});
