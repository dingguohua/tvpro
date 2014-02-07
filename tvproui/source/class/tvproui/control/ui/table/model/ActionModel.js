
/* ************************************************************************
************************************************************************ */
qx.Class.define('tvproui.control.ui.table.model.ActionModel',
{
  extend : qx.ui.table.model.Filtered,
  construct : function()
  {

    /* 初始化数据 */
    this.base(arguments);

    /* 禁止编辑ID与编辑状态，这两个字段仅供维护使用，默认不作为用户内容展现 */
    this.setColumnEditable(0, false);

    // ID与行号Hash表
    this._IDHash = {

    };
    this._ClientOnlyCol = {

    };
  },
  members :
  {

    /* ID->位置 */
    _IDHash : null,

    /* 需要重建ID->位置 Hash */
    _needRecreateIDHash : true,

    /* 用来定义仅在客户端存在的列 */
    _ClientOnlyCol : null,


    /**
     * TODOC
     *
     * @param col {var} TODOC
     */
    setClientOnlyCol : function(col) {
      this._ClientOnlyCol[col] = true;
    },


    /**
     * TODOC
     *
     * @param col {var} TODOC
     * @return {var} TODOC
     */
    getClientOnlyCol : function(col) {
      return this._ClientOnlyCol[col];
    },


    /**
     * ******* 如果你的ID位置和字段不是0和ID，请在此更换  **************
     *
     * @return {int} TODOC
     */
    getIDCol : function() {
      return 0;
    },


    /**
     * TODOC
     *
     * @return {string} TODOC
     */
    getIDColName : function() {
      return "ID";
    },


    /**
     * ******* 如果你实现了自己版本的命令的话请重载以下函数  **************
     *
     * @param item {var} TODOC
     * @param position {var} TODOC
     * @return {var} TODOC
     */
    /* 获取新的添加命令, 用以被重载使用 */
    _getNewAddCommand : function(item, position) {
      return new tvproui.control.ui.table.command.AddCommand(this, item, position);
    },

    /* 获取新的添加命令, 用以被重载使用 */

    /**
     * TODOC
     *
     * @param ID {var} TODOC
     * @param col {var} TODOC
     * @param value {var} TODOC
     * @param oldValue {var} TODOC
     * @return {var} TODOC
     */
    _getNewUpdateCommand : function(ID, col, value, oldValue) {
      return new tvproui.control.ui.table.command.UpdateCommand(this, ID, col, value, oldValue);
    },

    /* 获取新的添加命令, 用以被重载使用 */

    /**
     * TODOC
     *
     * @param rowStart {var} TODOC
     * @param rowEnd {var} TODOC
     * @return {var} TODOC
     */
    _getNewDeleteCommand : function(rowStart, rowEnd) {
      return new tvproui.control.ui.table.command.DeleteCommand(this, rowStart, rowEnd);
    },

    /* 获取新的移动命令, 用以被重载使用 */

    /**
     * TODOC
     *
     * @param row {var} TODOC
     * @param position {var} TODOC
     * @return {var} TODOC
     */
    _getNewMoveCommand : function(row, position) {
      return new tvproui.control.ui.table.command.MoveCommand(this, row, position);
    },


    /**
     * ******* ID Hash索引支持  **************
     *
     * @param ID {var} TODOC
     * @return {var} TODOC
     */
    /* 支持索引的获取ID所在行位置 */
    getRowOfID : function(ID)
    {
      if (this._needRecreateIDHash)
      {
        var IDHash = {

        };
        var rowCount = this.getRowCount();
        var i = 0;
        var IDCol = this.getIDCol();
        for (; i < rowCount; i++) {
          IDHash[this.getValue(IDCol, i)] = i;
        }
        this._IDHash = IDHash;
        this._needRecreateIDHash = false;
      }
      return this._IDHash[ID];
    },


    /**
     * TODOC
     *
     * @param rowArr {var} TODOC
     * @param startIndex {var} TODOC
     * @param clearSorting {var} TODOC
     * @return {var} TODOC
     */
    addRows : function(rowArr, startIndex, clearSorting)
    {
      this._needRecreateIDHash = true;
      return this.base(arguments, rowArr, startIndex, clearSorting);
    },


    /**
     * TODOC
     *
     * @param mapArr {var} TODOC
     * @param startIndex {var} TODOC
     * @param rememberMaps {var} TODOC
     * @param clearSorting {var} TODOC
     * @return {var} TODOC
     */
    addRowsAsMapArray : function(mapArr, startIndex, rememberMaps, clearSorting)
    {
      this._needRecreateIDHash = true;
      return this.base(arguments, mapArr, startIndex, rememberMaps, clearSorting);
    },


    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    clearSorting : function()
    {
      this._needRecreateIDHash = true;
      return this.base(arguments);
    },


    /**
     * TODOC
     *
     * @param startIndex {var} TODOC
     * @param howMany {var} TODOC
     * @param clearSorting {var} TODOC
     * @return {var} TODOC
     */
    removeRows : function(startIndex, howMany, clearSorting)
    {
      this._needRecreateIDHash = true;
      return this.base(arguments, startIndex, howMany, clearSorting);
    },


    /**
     * TODOC
     *
     * @param rowArr {var} TODOC
     * @param clearSorting {var} TODOC
     * @return {var} TODOC
     */
    setData : function(rowArr, clearSorting)
    {
      this._needRecreateIDHash = true;
      return this.base(arguments, rowArr, clearSorting);
    },


    /**
     * TODOC
     *
     * @param mapArr {var} TODOC
     * @param rememberMaps {var} TODOC
     * @param clearSorting {var} TODOC
     * @return {var} TODOC
     */
    setDataAsMapArray : function(mapArr, rememberMaps, clearSorting)
    {
      this._needRecreateIDHash = true;
      return this.base(arguments, mapArr, rememberMaps, clearSorting);
    },


    /**
     * TODOC
     *
     * @param rowArr {var} TODOC
     * @param startIndex {var} TODOC
     * @param clearSorting {var} TODOC
     * @return {var} TODOC
     */
    setRows : function(rowArr, startIndex, clearSorting)
    {
      this._needRecreateIDHash = true;
      return this.base(arguments, rowArr, startIndex, clearSorting);
    },


    /**
     * TODOC
     *
     * @param mapArr {var} TODOC
     * @param startIndex {var} TODOC
     * @param rememberMaps {var} TODOC
     * @param clearSorting {var} TODOC
     * @return {var} TODOC
     */
    setRowsAsMapArray : function(mapArr, startIndex, rememberMaps, clearSorting)
    {
      this._needRecreateIDHash = true;
      return this.base(arguments, mapArr, startIndex, rememberMaps, clearSorting);
    },

    /* 如果是ID则要求刷新 */

    /**
     * TODOC
     *
     * @param columnIndex {var} TODOC
     * @param rowIndex {var} TODOC
     * @param value {var} TODOC
     * @return {var} TODOC
     */
    setValue : function(columnIndex, rowIndex, value)
    {
      if (columnIndex == this.getIDCol()) {
        this._needRecreateIDHash = true;
      }
      return this.base(arguments, columnIndex, rowIndex, value);
    },


    /**
     * TODOC
     *
     * @param columnId {var} TODOC
     * @param rowIndex {var} TODOC
     * @param value {var} TODOC
     * @return {var} TODOC
     */
    setValueById : function(columnId, rowIndex, value)
    {
      this._needRecreateIDHash = true;
      if (columnId == this.getIDColName()) {
        this._needRecreateIDHash = true;
      }
      return this.base(arguments, columnId, rowIndex, value);
    },


    /**
     * TODOC
     *
     * @param columnIndex {var} TODOC
     * @param ascending {var} TODOC
     * @return {var} TODOC
     */
    sortByColumn : function(columnIndex, ascending)
    {
      this._needRecreateIDHash = true;
      return this.base(arguments, columnIndex, ascending);
    },


    /**
     * ******* 内部用函数  **************
     *
     * @param command {var} TODOC
     * @return {var | boolean} TODOC
     */
    /* 建立添加数据事务 */
    _doCommand : function(command)
    {
      var result = command.executeServer();
      if (result)
      {
        command.executeClient();
        command.dispose();
        return result;
      } else
      {
        dialog.Dialog.error("对不起，服务器提交失败!");
      }
      return false;
    },

    /* 添加数据 */

    /**
     * TODOC
     *
     * @param item {var} TODOC
     * @param position {var} TODOC
     * @return {var} TODOC
     */
    addItem : function(item, position) {

      /* 建立添加数据事务 */
      return this._doCommand(this._getNewAddCommand(item, position));
    },

    /* 添加多行数据 */

    /**
     * TODOC
     *
     * @param items {var} TODOC
     * @param startPosition {var} TODOC
     * @return {var} TODOC
     */
    addItems : function(items, startPosition)
    {

      /* 分配命令数组空间 */
      var commandGroup = [];
      commandGroup.length = items.length;

      /* 循环增加添加命令 */
      for (var i = 0, l = items.length; i < l; i++) {
        commandGroup[i] = this._getNewAddCommand(items[i], startPosition + i);
      }

      /* 插入并执行添加数据事务 */
      return this._doCommand(new tvproui.control.ui.command.GroupCommand(commandGroup));
    },

    /* 修改数据内容 , 一个值 */

    /**
     * TODOC
     *
     * @param row {var} TODOC
     * @param col {var} TODOC
     * @param value {var} TODOC
     * @param oldValue {var} TODOC
     * @return {var} TODOC
     */
    updateItem : function(row, col, value, oldValue)
    {

      /* 获取行ID */
      var ID = this.getRowData(row)[this.getIDCol()];

      /* 插入并执行修改数据事务 */
      return this._doCommand(this._getNewUpdateCommand(ID, col, value, oldValue));
    },

    /* 修改数据内容, 同一行多个值  */

    /**
     * TODOC
     *
     * @param row {var} TODOC
     * @param cols {var} TODOC
     * @param values {var} TODOC
     * @param oldValues {var} TODOC
     * @return {boolean | var} TODOC
     */
    updateItemCols : function(row, cols, values, oldValues)
    {

      /* 必须长度一样 */
      if (cols.length != values.length || values.length != oldValues.length) {
        return false;
      }

      /* 分配命令数组空间 */
      var commandGroup = [];
      commandGroup.length = cols.length;

      /* 获取ID */
      var ID = this.getRowData(row)[this.getIDCol()];

      /* 添加更新命令 */
      for (var i = 0, l = cols.length; i < l; i++)
      {
        var col = cols[i];
        var value = values[i];
        var oldValue = oldValues[i];
        commandGroup[i] = this._getNewUpdateCommand(ID, col, value, oldValue);
      }

      /* 插入并执行修改数据事务 */
      return this._doCommand(new tvproui.control.ui.command.GroupCommand(commandGroup));
    },

    /* 删除内容单行 */

    /**
     * TODOC
     *
     * @param row {var} TODOC
     * @return {var} TODOC
     */
    deleteItem : function(row) {

      /* 插入并执行删除数据事务 */
      return this._doCommand(this._getNewDeleteCommand(row, row));
    },

    /* 删除内容多行 */
    /* @arg Object[] itemRowRanges 要被删除的行范围数组， 其中每一个对象都包含minIndex和maxIndex */

    /**
     * TODOC
     *
     * @param itemRowRanges {var} TODOC
     * @return {var} TODOC
     */
    deleteItems : function(itemRowRanges)
    {
      var commandGroup = [];
      for (var i = 0, l = itemRowRanges.length; i < l; i++)
      {
        var section = itemRowRanges[i];
        var minIndex = section.minIndex;
        var maxIndex = section.maxIndex;
        commandGroup.push(this._getNewDeleteCommand(minIndex, maxIndex));
      }

      /* 插入并执行删除数据事务 */
      return this._doCommand(new tvproui.control.ui.command.GroupCommand(commandGroup));
    },


    /**
     * TODOC
     *
     * @param ID {var} TODOC
     * @param position {var} TODOC
     * @return {var} TODOC
     */
    moveItem : function(ID, position) {

      /* 插入并执行移动数据事务 */
      return this._doCommand(this._getNewMoveCommand(ID, position));
    },


    /**
     * TODOC
     *
     * @param rowDatas {var} TODOC
     * @param position {var} TODOC
     * @return {var} TODOC
     */
    moveItems : function(rowDatas, position)
    {
      var commandGroup = [];
      var IDColName = this.getIDColName();
      for (var i = 0, l = rowDatas.length; i < l; i++)
      {
        var rowData = rowDatas[i];
        commandGroup.push(this._getNewMoveCommand(rowData[IDColName], position++));
      }

      /* 插入并执行移动数据事务 */
      return this._doCommand(new tvproui.control.ui.command.GroupCommand(commandGroup));
    }
  },
  destruct : function()
  {

    /* ID->位置 */
    this._IDHash = null;

    /* 需要重建ID->位置 Hash */
    this._needRecreateIDHash = null;

    /* 用来定义仅在客户端存在的列 */
    this._ClientOnlyCol = null;
  }
});
