
/* ************************************************************************
   Row span tabel Model
   A Model support translate tree level to row span
   Authors:
     * Weibo Zhang (datouxia)

************************************************************************ */
qx.Class.define("tvproui.control.ui.spanTable.model.SpanTableModel",
{
  extend : qx.ui.table.model.Abstract,


  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */
  construct : function()
  {
    this.base(arguments);

    // Set the nodes map
    var nodeMap = {

    };
    this._nodeMap = nodeMap;

    // insert the root node
    nodeMap[0] =
    {
      nodeID : 0,
      level : 0,
      children : []
    };

    // ready the row array
    this._rowAry = [];

    // init column Model
    this._columnMetaMap = {

    };
    this._columnArray = [];
  },


  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */
  members :
  {
    _nodeMap : null,
    _rowAry : null,
    _columnMetaMap : null,
    _columnIDMap : null,
    _columnArray : null,

    // ******************* Overridden the abstruct Model Begin *******************/
    // overridden

    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    getRowCount : function()
    {
      var rowArray = this._rowAry;
      return rowArray.length;
    },

    // overridden

    /**
     * TODOC
     *
     * @param rowIndex {var} TODOC
     * @return {var} TODOC
     */
    getRowData : function(rowIndex) {
      return this._rowAry[rowIndex];
    },

    // overridden

    /**
     * TODOC
     *
     * @param columnIndex {var} TODOC
     * @return {var} TODOC
     */
    isColumnEditable : function(columnIndex)
    {
      var columnArray = this._columnArray;
      return columnArray[columnIndex].editable ? true : false;
    },


    /**
     * TODOC
     *
     * @abstract
     * @param columnIndex {var} TODOC
     * @param ascending {var} TODOC
     * @throws the abstract function warning.
     * @abstract
     */
    sortByColumn : function(columnIndex, ascending) {
      throw new Error("SpanTable can not be sorted by column");
    },

    // overridden

    /**
     * TODOC
     *
     * @param columnIndex {var} TODOC
     * @param rowIndex {var} TODOC
     * @return {var} TODOC
     */
    getValue : function(columnIndex, rowIndex)
    {
      var rowArray = this._rowAry;
      if (rowIndex < 0 || rowIndex >= rowArray.length) {
        return null;
      }

      //throw new Error("this._rowAry row " + "(" + rowIndex + ") out of bounds: " + rowArray + " (0.." + (rowArray.length - 1) + ")");
      var columnMap = rowArray[rowIndex];
      if (!columnMap[columnIndex]) {
        return null;
      }

      //throw new Error("column " + "(" + columnIndex + ") can't be found. ");
      return columnMap[columnIndex].value;
    },

    // overridden

    /**
     * TODOC
     *
     * @param columnIndex {var} TODOC
     * @param rowIndex {var} TODOC
     * @param value {var} TODOC
     * @throws TODOC
     */
    setValue : function(columnIndex, rowIndex, value)
    {
      var rowArray = this._rowAry;
      if (rowIndex < 0 || rowIndex >= rowArray.length) {
        throw new Error("this._rowAry row " + "(" + rowIndex + ") out of bounds: " + rowArray + " (0.." + (rowArray.length - 1) + ")");
      }
      var columnMap = rowArray[rowIndex];
      if (!columnMap[columnIndex]) {
        throw new Error("column " + "(" + columnIndex + ") can't be found. ");
      }
      columnMap[columnIndex].data = value;

      // Inform the listeners
      if (this.hasListener("dataChanged"))
      {
        var data =
        {
          firstRow : rowIndex,
          lastRow : rowIndex,
          firstColumn : columnIndex,
          lastColumn : columnIndex
        };
        this.fireDataEvent("dataChanged", data);
      }
    },

    // overridden

    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    getColumnCount : function()
    {
      var columnArray = this._columnArray;
      return columnArray.length;
    },

    // overridden

    /**
     * TODOC
     *
     * @param columnID {var} TODOC
     * @return {var} TODOC
     * @throws TODOC
     */
    getColumnIndexById : function(columnID)
    {
      throw new Error("SpanTable do not support this method, but you can write a method based on columnID and level!");
    },

    // overridden

    /**
     * TODOC
     *
     * @param columnID {var} TODOC
     * @return {var} TODOC
     * @throws TODOC
     */
    getColumnNameById : function(columnID)
    {
      throw new Error("SpanTable do not support this method, but you can write a method based on columnID and level!");
    },

    /**
     * TODOC
     *
     * @param columnID {var} TODOC
     * @return {var} TODOC
     * @throws TODOC
     */
    getColumnNameByLevelId : function(level, columnID)
    {
      // 列名称表
      var columnMetaMap = this._columnMetaMap;

      var levelMap = columnMetaMap[level];
      if (!levelMap)
      {
        throw new Error("Level not existed!");
      }

      if (!levelMap[columnID]) {
        throw new Error("ColumnID not existed in the level!");
      }

      // 获取列元信息
      var columnMetaData = levelMap[columnID];
      return columnMetaData.columnName;
    },

    // overridden

    /**
     * TODOC
     *
     * @param columnIndex {var} TODOC
     * @return {var} TODOC
     * @throws TODOC
     */
    getColumnId : function(columnIndex)
    {
      var columnArray = this._columnArray;
      var columnMetaData = columnArray[columnIndex];
      if (!columnMetaData) {
        throw new Error("Column can't be found!");
      }
      return columnMetaData.columnID;
    },

    // overridden

    /**
     * TODOC
     *
     * @param columnIndex {var} TODOC
     * @return {var} TODOC
     * @throws TODOC
     */
    getColumnName : function(columnIndex)
    {
      var columnArray = this._columnArray;
      var columnMetaData = columnArray[columnIndex];
      if (!columnMetaData) {
        throw new Error("Column can't be found!");
      }
      return columnMetaData.columnName;
    },


    /**
     * TODOC
     *
     * @param columnIndex {var} TODOC
     * @return {var} TODOC
     * @throws TODOC
     */
    getColumnLevel : function(columnIndex)
    {
      var columnArray = this._columnArray;
      var columnMetaData = columnArray[columnIndex];
      if (!columnMetaData) {
        throw new Error("Column can't be found!");
      }
      return columnMetaData.level;
    },

    // overridden

    /**
     * TODOC
     *
     * @abstract
     * @param columnIdArr {var} TODOC
     * @throws the abstract function warning.
     * @abstract
     */
    setColumnIds : function(columnIdArr) {
      throw new Error("SpanTable must use addColumn");
    },

    // overridden

    /**
     * TODOC
     *
     * @abstract
     * @param columnNameArr {var} TODOC
     * @throws the abstract function warning.
     * @abstract
     */
    setColumnNamesByIndex : function(columnNameArr) {
      throw new Error("SpanTable must use addColumn");
    },

    // overridden

    /**
     * TODOC
     *
     * @abstract
     * @param columnNameMap {var} TODOC
     * @throws the abstract function warning.
     * @abstract
     */
    setColumnNamesById : function(columnNameMap) {
      throw new Error("SpanTable must use addColumn");
    },

    // overridden

    /**
     * TODOC
     *
     * @abstract
     * @param columnNameArr {var} TODOC
     * @param columnIdArr {var} TODOC
     * @throws the abstract function warning.
     * @abstract
     */
    setColumns : function(columnNameArr, columnIdArr) {
      throw new Error("SpanTable must use addColumn");
    },

    // ******************* Overridden the abstruct Model End *******************/
    // ******************* Column Model Begin *******************/

    /**
     * Add Column
     *
     * @param columnID {var} TODOC
     * @param columnName {var} like "Time"
     * @param level {var} The level of node
     * @param editable {var} true / false
     * @throws When ColumnID duplicate
     */
    addColumn : function(columnID, columnName, level, editable)
    {
      // Set the column model
      var columnMetaMap = this._columnMetaMap;
      var columnArray = this._columnArray;

      var columnMetaData =
      {
        columnID : columnID,
        columnName : columnName,
        level : level,
        editable : editable,
        position : columnArray.length
      };

      var levelMap = columnMetaMap[level];
      if (!levelMap)
      {
        levelMap = {};
        columnMetaMap[level] = levelMap;
      }

      if (levelMap[columnID]) {
        throw new Error("Column name must not duplicate at the same level!");
      }

      levelMap[columnID] = columnMetaData;
      columnArray.push(columnMetaData);
      this.fireEvent("metaDataChanged");
    },

    /**
     * Remove Column
     *
     * @param columnID {var} TODOC
     * @param columnName {var} like "Time"
     * @param level {var} The level of node
     * @throws When ColumnID duplicate
     */
    removeColumn : function(columnID, level)
    {
      // 列名称表
      var columnMetaMap = this._columnMetaMap;
      var columnArray = this._columnArray;

      var levelMap = columnMetaMap[level];
      if (!levelMap)
      {
        throw new Error("Level not existed!");
      }

      if (!levelMap[columnID]) {
        throw new Error("ColumnID not existed in the level!");
      }

      // 获取列元信息
      var columnMetaData = levelMap[columnID];
      delete levelMap[columnID];

      // 更新后续节点位置
      var position = columnMetaData.position;
      for(var i = position + 1, l = columnArray.length; i < l; i++)
      {
        var nextColumn = columnMetaData[i];
        nextColumn.position = i - 1;
      }

      // 清理数组
      columnArray.splice(position, 1);

      this.fireEvent("metaDataChanged");
    },

    // ******************* Column Model End *******************/
    // ******************* Data Model Begin *******************/

    /**
     * TODOC
     *
     * @return {int} TODOC
     */
    getRootID : function() {
      return 0;
    },


    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    getRoot : function()
    {

      // make sure nodeID not existed
      var nodeMap = this._nodeMap;
      return nodeMap[0];
    },


    /**
     * TODOC
     *
     * @param nodeID {var} TODOC
     * @param parentID {var} TODOC
     * @param position {var} TODOC
     * @throws TODOC
     */
    addBranch : function(nodeID, parentID, position)
    {

      // make sure nodeID not existed
      var nodeMap = this._nodeMap;
      if (nodeMap[nodeID]) {
        throw new Error("Node has already existed!");
      }

      // find parentNode
      var parentNode = nodeMap[parentID];
      if (!parentNode) {
        throw new Error("Can't find parent node!");
      }
      var parentChildren = parentNode.children;
      if (!parentChildren) {
        throw new Error("Can't insert node into a leaf node!");
      }

      // create new node
      var node =
      {
        nodeID : nodeID,
        parentID : parentID,
        level : parentNode.level + 1,
        children : [],
        columnData : {

        }
      };

      parentChildren.splice(position, 0, nodeID);

      // insert node into nodeID : node map
      nodeMap[nodeID] = node;
      return;
    },


    /**
     * TODOC
     *
     * @param nodeID {var} TODOC
     * @param parentID {var} TODOC
     * @param position {var} TODOC
     * @throws TODOC
     */
    addLeaf : function(nodeID, parentID, position)
    {

      // make sure nodeID not existed
      var nodeMap = this._nodeMap;
      if (nodeMap[nodeID]) {
        throw new Error("Node has already existed!");
      }

      // find parentNode
      var parentNode = nodeMap[parentID];
      if (!parentNode) {
        throw new Error("Can't find parent node!");
      }

      var parentChildren = parentNode.children;
      if (!parentChildren) {
        throw new Error("Can't insert node into a leaf node!");
      }

      // create new node
      var node =
      {
        nodeID : nodeID,
        parentID : parentID,
        level : parentNode.level + 1,
        columnData : {

        }
      };
      parentChildren.splice(position, 0, nodeID);

      // insert node into nodeID : node map
      nodeMap[nodeID] = node;
      return;
    },


    /**
     * TODOC
     *
     * @param nodeID {var} TODOC
     * @throws TODOC
     */
    prune : function(nodeID)
    {
      // make sure root node existed
      if (0 === nodeID) {
        throw new Error("Can't remove root node");
      }

      // make sure nodeID not existed
      var nodeMap = this._nodeMap;
      if (!nodeMap[nodeID]) {
        return null;
      }

      // get node children
      var node = nodeMap[nodeID];

      // find parentNode
      var parentNode = nodeMap[node.parentID];
      var parentChildren = parentNode.children;

      // remove node from parent children
      var position = parentChildren.indexOf(nodeID);
      parentChildren.splice(position, 1);

      var children = node.children;
      if(children)
      {
        while(children.length > 0)
        {
          this.prune(children[0]);
        }
      }

      // remove node from nodeMap
      delete nodeMap[nodeID];
      return;
    },


    /**
     * TODOC
     *
     * @param nodeID {var} TODOC
     * @param parentID {var} TODOC
     * @param position {var} TODOC
     * @throws TODOC
     */
    move : function(nodeID, parentID, position)
    {

      // make sure root node existed
      if (0 === nodeID) {
        throw new Error("Can't remove root node");
      }

      // make sure nodeID not existed
      var nodeMap = this._nodeMap;
      if (!nodeMap[nodeID]) {
        throw new Error("Node is not existed!");
      }

      // get node children
      var node = nodeMap[nodeID];

      // find parentNode
      var oldParentNode = nodeMap[node.parentID];
      var oldParentChildren = oldParentNode.children;

      // remove node from parent children
      var oldPosition = oldParentChildren.indexOf(nodeID);
      oldParentChildren.splice(oldPosition, 1);

      // edit node parent
      var newParentNode = nodeMap[parentID];
      node.parentID = parentID;

      // add node to the new parent
      var newParentChildren = newParentNode.children;
      if (!newParentChildren) {
        throw new Error("Can't move a node above to a leaf node!");
      }
      newParentChildren.splice(position, 0, nodeID);
    },


    /**
     * When you do all the thing you want do, use this function sync it to the view
     *
     */
    setData : function()
    {
      // make row array ready
      var rowArray = this._rowAry;
      rowArray.length = 0;

      // render row array
      var nodeMap = this._nodeMap;
      var columnMetaMap = this._columnMetaMap;
      this.__rendeRow(nodeMap, nodeMap[0], columnMetaMap, rowArray);

      // Inform the listeners
      if (this.hasListener("dataChanged"))
      {
        var data =
        {
          firstRow : 0,
          lastRow : rowArray.length - 1,
          firstColumn : 0,
          lastColumn : this.getColumnCount() - 1
        };
        this.fireDataEvent("dataChanged", data);
      }
    },

    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    getData : function() {
      return this._nodeMap;
    },

    /**
     * Clears the tree of all nodes
     *
     */
    clearData : function()
    {

      // Set the nodes map
      var nodeMap = {

      };
      this._nodeMap = nodeMap;

      // insert the root node
      nodeMap[0] =
      {
        nodeID : 0,
        level : 0,
        children : []
      };
    },

    getJSON : function()
    {
      return tvproui.utils.JSON.stringify(this.getData());
    },

    setJSON : function(json)
    {
      this._nodeMap = qx.lang.Json.parse(json);
    },

    /**
     * TODOC
     *
     * @param node {Node} TODOC
     * @param columnMetaMap {var} TODOC
     * @param rows {var} TODOC
     */
    __rendeRow : function(nodeMap, node, columnMetaMap, rows)
    {

      // Iterate the leaf nodes first
      var children = node.children;
      var rowSpan;
      node.row = rows.length;
      if (children && children.length > 0)
      {
        var length = children.length;
        for (var i = 0; i < length; i++)
        {
          var childID = children[i];
          var child = nodeMap[childID];
          this.__rendeRow(nodeMap, child, columnMetaMap, rows, true);
        }

        // head row is the first leaf row
        rowSpan = rows.length - node.row;
      } else
      {
        rowData = [];
        rowSpan = 1;
        rows.push(rowData);
      }
      var level = node.level;
      var levelMap = columnMetaMap[level];
      if (!levelMap) {
        return;
      }
      var columnData = node.columnData;
      var columnID = null;
      var offset = 0;
      for (var i = node.row, l = rows.length; i < l; i++)
      {
        var rowData = rows[i];
        for (columnID in levelMap)
        {
          var columnMeta = levelMap[columnID];
          var position = columnMeta.position;
          rowData[position] =
          {
            nodeID : node.nodeID,
            style : node.style,
            span : rowSpan,
            value : columnData[columnID],
            level : level,
            offset : offset
          };
        }

        // Offset is zero means this node will be rendered
        offset++;
      }
      return;
    },


    /**
     * TODOC
     *
     * @param nodeID {var} TODOC
     * @return {var} TODOC
     * @throws TODOC
     */
    getNodeByNodeId : function(nodeID)
    {

      // make sure nodeID not existed
      var nodeMap = this._nodeMap;
      if (!nodeMap[nodeID]) {
        return null;
      }
      return nodeMap[nodeID];
    },


    /**
     * TODOC
     *
     * @param nodeID {var} TODOC
     * @param columnIndex {var} TODOC
     * @param data {var} TODOC
     */
    setColumnData : function(nodeID, columnIndex, data)
    {
      var node = this.getNodeByNodeId(nodeID);
      if(!node)
      {
        return false;
      }

      var columnData = node.columnData;
      columnData[columnIndex] = data;
      return true;
    },

    /**
     * TODOC
     *
     * @param nodeID {var} TODOC
     * @param columnIndex {var} TODOC
     * @param data {var} TODOC
     */
    setNodeAttr : function(node, columnIndex, data)
    {
      if(!node)
      {
        return false;
      }

      var columnData = node.columnData;

      columnData[columnIndex] = data;
      return true;
    },

    /**
     * TODOC
     *
     * @param nodeID {var} TODOC
     * @param contentObject {var} TODOC
     * @param styleMap {var} TODOC
     */
    setNode : function(nodeID, contentObject, styleMap)
    {
      if (!styleMap)
      {
        dialog.Dialog.error("无法加载的节点" + nodeID);
        return;
      }
      var node = this.getNodeByNodeId(nodeID);
      var columnData = node.columnData;
      var columnIndex = null;
      for (columnIndex in contentObject) {
        columnData[columnIndex] = contentObject[columnIndex];
      }
      node.style = styleMap;
      return;
    },


    /**
     * TODOC
     *
     * @param nodeID {var} TODOC
     * @return {var} TODOC
     */
    getColumnDataByID : function(nodeID)
    {
      var node = this.getNodeByNodeId(nodeID);
      return node ? node.columnData : null;
    },


    /**
     * TODOC
     *
     * @param nodeID {var} TODOC
     * @return {var} TODOC
     */
    getRowFromNodeId : function(nodeID)
    {
      var node = this.getNodeByNodeId(nodeID);
      return node ? node.row : null;
    },


    /**
     * TODOC
     *
     * @param nodeID {var} TODOC
     * @return {var} TODOC
     */
    getParentID : function(nodeID)
    {
      var node = this.getNodeByNodeId(nodeID);
      return node ? node.parent.ID : null;
    },


    /**
     * TODOC
     *
     * @param columnIndex {var} TODOC
     * @param rowIndex {var} TODOC
     * @return {var} TODOC
     * @throws TODOC
     */
    getNodeID : function(columnIndex, rowIndex)
    {
      var rowArray = this._rowAry;
      if (rowIndex < 0 || rowIndex >= rowArray.length) {
        throw new Error("this._rowAry row " + "(" + rowIndex + ") out of bounds: " + rowArray + " (0.." + (rowArray.length - 1) + ")");
      }
      var columnMap = rowArray[rowIndex];
      if (!columnMap) {
        throw new Error("row doesn't existed!");
      }
      if (!columnMap[columnIndex]) {
        return null;
      }

      //throw new Error("column " + "(" + columnIndex + ") can't be found. ");
      return columnMap[columnIndex].nodeID;
    },


    /**
     * TODOC
     *
     * @param level {var} TODOC
     * @param rowIndex {var} TODOC
     * @return {var} TODOC
     * @throws TODOC
     */
    getNodeIDByLevel : function(level, rowIndex)
    {
      var columnMetaMap = this._columnMetaMap;
      var levelMap = columnMetaMap[level];
      if (!levelMap) {
        throw new Error("level doesn't existed!");
      }
      var columnID;
      for (columnID in levelMap) {
        break;
      }
      if (!columnID) {
        throw new Error("No column ID!");
      }
      var columnMeta = levelMap[columnID];
      return this.getNodeID(columnMeta.position, rowIndex);
    },


    /**
     * TODOC
     *
     * @param level {var} TODOC
     * @param rowIndex {var} TODOC
     * @return {null | var} TODOC
     */
    getNodeByLevel : function(level, rowIndex)
    {
      var nodeID = this.getNodeIDByLevel(level, rowIndex);
      if (nodeID === null) {
        return null;
      }
      return this.getNodeByNodeId(nodeID);
    },


    /**
     * TODOC
     *
     * @param columnIndex {var} TODOC
     * @param rowIndex {var} TODOC
     * @return {var} TODOC
     * @throws TODOC
     */
    getNodeLevel : function(columnIndex, rowIndex)
    {
      var rowArray = this._rowAry;
      if (rowIndex < 0 || rowIndex >= rowArray.length) {
        throw new Error("this._rowAry row " + "(" + rowIndex + ") out of bounds: " + rowArray + " (0.." + (rowArray.length - 1) + ")");
      }
      var columnMap = rowArray[rowIndex];
      if (!columnMap[columnIndex]) {
        throw new Error("column " + "(" + columnIndex + ") can't be found. ");
      }
      return columnMap[columnIndex].level;
    },


    /**
     * TODOC
     *
     * @param columnIndex {var} TODOC
     * @param rowIndex {var} TODOC
     * @return {var} TODOC
     * @throws TODOC
     */
    getDisplayDesc : function(columnIndex, rowIndex)
    {
      var rowArray = this._rowAry;
      if (rowIndex < 0 || rowIndex >= rowArray.length) {
        throw new Error("this._rowAry row " + "(" + rowIndex + ") out of bounds: " + rowArray + " (0.." + (rowArray.length - 1) + ")");
      }
      var columnMap = rowArray[rowIndex];
      if (!columnMap[columnIndex]) {
        return null;
      }
      return columnMap[columnIndex];
    },


    /**
     * TODOC
     *
     * @param columnIndex {var} TODOC
     * @param rowIndex {var} TODOC
     * @return {null | var} TODOC
     */
    getNodeByRowColumn : function(columnIndex, rowIndex)
    {
      var nodeID = this.getNodeID(columnIndex, rowIndex);
      if (null === nodeID) {
        return null;
      }
      return this.getNodeByNodeId(nodeID);
    },

    // ******************* Data Model End *******************/
    // ******************* Tree Tools Begin *******************/

    /**
     * TODOC
     *
     * @param parentID {var} TODOC
     * @param nodeID {var} TODOC
     * @return {boolean} TODOC
     * @throws TODOC
     */
    isDescendant : function(parentID, nodeID)
    {
      var nodeMap = this._nodeMap;
      var parent = nodeMap[parentID];

      if (!parent) {
        throw new Error("parent is not existed!");
      }

      var children = parent.children;
      if (!children) {
        return false;
      }
      if (children.indexOf(nodeID) != -1) {
        return true;
      }
      for (var i = 0, l = children.length; i < l; i++)
      {
        var childID = children[i];
        if (this.isDescendant(childID, nodeID)) {
          return true;
        }
      }
      return false;
    },


    /**
     * TODOC
     *
     * @param parentID {var} TODOC
     * @param nodeID {var} TODOC
     * @return {boolean | var} TODOC
     */
    isAncestor : function(parentID, nodeID)
    {

      // root is ancestor of any node
      if (parentID == 0) {
        return true;
      }
      var nodeMap = this._nodeMap;
      var node = nodeMap[nodeID];
      var ancestorID = node.parentID;
      if (ancestorID == parentID) {
        return true;
      }
      if (ancestorID == 0) {
        return false;
      }
      return this.isAncestor(parentID, ancestorID);
    }
  },

  // ******************* Tree Tools End *******************/
  destruct : function()
  {
    this._nodeMap = null;
    this._rowAry = null;
    this._columnMetaMap = null;
    this._columnArray = null;
  }
});
