
/* ************************************************************************
************************************************************************ */
qx.Class.define('tvproui.control.ui.table.model.TransModel',
{
  extend : tvproui.control.ui.table.model.ActionModel,
  construct : function()
  {

    /* 初始化数据 */
    this.base(arguments);

    // 变更表
    this._oldMap = {

    };
    this._newMap = {

    };
    this._updateCounter = 0;

    /* 初始化变更记录 */
    this._undoList = [];
    this._redoList = [];
    this._transList = [];
  },
  events :
  {
    canRedo : "qx.event.type.Data",
    canUndo : "qx.event.type.Data"
  },
  members :
  {

    // 新旧数据映射表
    _oldMap : null,
    _newMap : null,

    // 更新计数器
    _updateCounter : null,

    /* 撤销表 */
    _undoList : null,

    /* 重做表 */
    _redoList : null,

    // 事务表
    _transList : null,


    /**
     * ******* 如果你实现了自己版本的命令的话请重载以下函数  **************
     *
     * @param oldMap {var} TODOC
     * @param newMap {var} TODOC
     * @return {var} TODOC
     */
    /* 获取新的更新命令, 用以被重载使用 */
    _getNewUpdateMapCommand : function(oldMap, newMap) {
      return new tvproui.control.ui.table.command.UpdateMapCommand(this, oldMap, newMap);
    },


    /**
     * ******* Undo Redo实现, 内部用函数  **************
     *
     */
    /* 清理Redo表 */
    _clearRedoList : function()
    {
      var redoList = this._redoList;

      /* 若不需要清理,退出 */
      if (redoList.length == 0) {
        return;
      }
      redoList.length = 0;

      /* 没有可以redo的东西，原先可以redo */
      this.fireDataEvent("canRedo", false, true, false);
    },


    /**
     * TODOC
     *
     */
    _clearUndoList : function()
    {
      var undoList = this._undoList;

      /* 若不需要清理,退出 */
      if (undoList.length == 0) {
        return;
      }
      undoList.length = 0;

      /* 没有可以redo的东西，原先可以redo */
      this.fireDataEvent("canUndo", false, true, false);
    },

    // 执行并加入事务

    /**
     * TODOC
     *
     * @param command {var} TODOC
     * @return {boolean | var} TODOC
     */
    _pushTrans : function(command)
    {
      var transList = this._transList;
      transList.push(command);
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

    // 提交事务

    /**
     * TODOC
     *
     */
    commitTrans : function()
    {
      var transList = this._transList;
      if (transList.length == 0) {
        return;
      }
      this._clearRedoList();
      var undoList = this._undoList;
      var notifyTag = (undoList.length == 0);
      undoList.push(new tvproui.control.ui.command.GroupCommand(transList));
      this._transList = [];

      /* 若是第一条可以undo的命令 */
      if (!notifyTag) {
        return;
      }

      /* 通知可以undo, 原先不可以undo */
      this.fireDataEvent("canUndo", true, false, false);
    },


    /**
     * ******* 对外事务接口 **************
     *
     * @return {boolean | var} TODOC
     */
    /* 撤销  */
    undo : function()
    {
      var undoList = this._undoList;
      var length = undoList.length;
      if (0 == length) {
        return false;
      }

      /* 尾部弹出一个任务，执行客户端行为撤销 */
      var job = undoList.pop();
      var result = job.cancel();
      if (!result)
      {
        dialog.Dialog.error("对不起，提交失败，请联系长江龙公司解决!");
        return false;
      }

      /* 加入重做表 头部 */
      var redoList = this._redoList;
      redoList.unshift(job);

      /* 若从1个撤销至不可以再撤销，则通知不能撤销 */
      if (length == 1) {

        /* 通知不可以undo, 原先可以undo */
        this.fireDataEvent("canUndo", false, true, false);
      }

      /* 从0个重做变成一个重做，则通知可以重做 */
      if (redoList.length == 1) {

        /* 通知可以redo, 原先不可以redo */
        this.fireDataEvent("canRedo", true, false, false);
      }
      return result;
    },

    /* 重做 */

    /**
     * TODOC
     *
     * @return {boolean | var} TODOC
     */
    redo : function()
    {
      var redoList = this._redoList;
      var length = redoList.length;
      if (0 == length) {
        return false;
      }

      /* 从重做表首部弹出一个任务，执行该任务 */
      var job = redoList.shift();
      var result = job.execute();
      if (!result)
      {
        dialog.Dialog.error("对不起，提交失败，请联系长江龙公司解决!");
        return false;
      }

      /* 将该任务加入任务表尾部 */
      var undoList = this._undoList;
      undoList.push(job);

      /* 若从1个撤销至不可以再撤销，则通知不能撤销 */
      if (length == 1) {

        /* 通知不可以Redo, 原先可以redo */
        this.fireDataEvent("canRedo", false, true, false);
      }

      /* 从0个撤销变成一个撤销，则通知可以重做 */
      if (undoList.length == 1) {

        /* 通知可以undo, 原先不可以undo */
        this.fireDataEvent("canUndo", true, false, false);
      }
      return result;
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
      this._clearRedoList();
      this._clearUndoList();
      return this.base(arguments, mapArr, rememberMaps, clearSorting);
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
      return this._pushTrans(this._getNewAddCommand(item, position));
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
      return this._pushTrans(new tvproui.control.ui.command.GroupCommand(commandGroup));
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
     * @return {var} TODOC
     */
    updateItem : function(row, col, value, oldValue)
    {

      /* 获取行ID */
      var ID = this.getRowData(row)[this.getIDCol()];

      // 实际进行本地修改(保证后续函数运行)
      this.setValue(col, row, value);

      /* 插入并执行修改数据事务 */
      return this.updateItemByID(ID, col, value, oldValue);
    },

    /* 修改数据内容, 同一行多个值  */

    /**
     * TODOC
     *
     * @param row {var} TODOC
     * @param cols {var} TODOC
     * @param values {var} TODOC
     * @param oldValues {var} TODOC
     * @return {boolean} TODOC
     */
    updateItemCols : function(row, cols, values, oldValues)
    {

      /* 必须长度一样 */
      if (cols.length != values.length || values.length != oldValues.length) {
        return false;
      }

      /* 获取ID */
      var ID = this.getRowData(row)[this.getIDCol()];

      /* 添加更新命令 */
      for (var i = 0, l = cols.length; i < l; i++)
      {
        var col = cols[i];
        var value = values[i];
        var oldValue = oldValues[i];

        // 实际进行本地修改(保证后续函数运行)
        this.setValue(col, row, value);
        this.updateItemByID(ID, col, value, oldValue);
      }

      /* 插入并执行修改数据事务 */
      return true;
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
      var result = this._pushTrans(this._getNewUpdateMapCommand(this._oldMap, this._newMap));
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

    /* 删除内容单行 */

    /**
     * TODOC
     *
     * @param row {var} TODOC
     * @return {var} TODOC
     */
    deleteItem : function(row) {

      /* 插入并执行删除数据事务 */
      return this._pushTrans(this._getNewDeleteCommand(row, row));
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
      return this._pushTrans(new tvproui.control.ui.command.GroupCommand(commandGroup));
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
      return this._pushTrans(this._getNewMoveCommand(ID, position));
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
      return this._pushTrans(new tvproui.control.ui.command.GroupCommand(commandGroup));
    }
  },
  destruct : function()
  {

    // 变更表
    this._oldMap = null;
    this._newMap = null;
    this._updateCounter = null;

    /* 撤销表 */
    var undoList = this._undoList;
    for (var i = 0, l = undoList.length; i < l; i++) {
      undoList[i].dispose();
    }
    this._undoList = null;

    /* 重做表 */
    var redoList = this._redoList;
    for (var i = 0, l = redoList.length; i < l; i++) {
      redoList[i].dispose();
    }
    this._redoList = null;

    /* 事务表 */
    var transList = this._transList;
    for (var i = 0, l = transList.length; i < l; i++) {
      transList[i].dispose();
    }
    this._transList = null;
  }
});
