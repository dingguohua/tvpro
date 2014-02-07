

/* ************************************************************************
   Transcation Model
   A Model support transcation
   Authors:
     * Weibo Zhang (datouxia)

************************************************************************ */
qx.Class.define('tvproui.control.ui.spanTable.model.TransModel',
{
  extend : tvproui.control.ui.spanTable.model.ActionModel,
  construct : function()
  {

    /* 初始化数据 */
    this.base(arguments);

    /* 初始化变更记录 */
    this._undoList = new qx.data.Array([new tvproui.control.ui.command.GroupCommand([], "加载完毕")]);
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

    /* 撤销表 */
    _undoList : null,

    /* 重做表 */
    _redoList : null,

    // 事务表
    _transList : null,


    /**
     * ******* Undo Redo实现, 内部用函数  **************
     *
     * @return {boolean} TODOC
     */
    /* 清理Redo表 */
    _clearRedoList : function()
    {
      var redoList = this._redoList;

      /* 若不需要清理,退出 */
      if (redoList.length == 0) {
        return true;
      }
      redoList.length = 0;

      /* 没有可以redo的东西，原先可以redo */
      this.fireDataEvent("canRedo", false, true, false);
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
     * @param description {var} TODOC
     */
    commitTrans : function(description)
    {
      var transList = this._transList;
      if (transList.length == 0) {
        return;
      }
      
      this._clearRedoList();
      var undoList = this._undoList;
      var notifyTag = (undoList.getLength() == 1);
      undoList.push(new tvproui.control.ui.command.GroupCommand(transList, description));

      this.setData();

      // 新建事务表
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
      var length = undoList.getLength();
      if (1 == length) {
        return false;
      }

      /* 尾部弹出一个任务，执行客户端行为撤销 */
      var job = undoList.pop();
      var result = job.cancel();
      this.setData();
      if (!result)
      {
        dialog.Dialog.error("对不起，提交失败，请联系长江龙公司解决!");
        return false;
      }

      /* 加入重做表 头部 */
      var redoList = this._redoList;
      redoList.unshift(job);

      /* 若从1个撤销至不可以再撤销，则通知不能撤销 */
      if (length == 2) {

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


    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    hasModifyed : function() {
      return this._undoList.getLength() > 1;
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
      this.setData();
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
      if (undoList.getLength() == 1) {

        /* 通知可以undo, 原先不可以undo */
        this.fireDataEvent("canUndo", true, false, false);
      }
      return result;
    },

    /* 添加数据 */

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

      /* 建立添加数据事务 */
      var command = this._getNewAddCommand(type, parentID, position, columnData, styleMap);
      return this._pushTrans(command);
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
      if (!tree)
      {
        tree = [];
        this.sectionToTree(itemRowRanges, tree);
      }
      for (var i = 0, l = tree.length; i < l; i++)
      {
        var nodeID = tree[i].nodeID;
        commandGroup.push(this._getNewDeleteCommand(nodeID));
      }

      /* 插入并执行删除数据事务 */
      return this._pushTrans(new tvproui.control.ui.command.GroupCommand(commandGroup));
    },

    /* 删除制定内容 */
    /* @arg int NodeID */

    /**
     * TODOC
     *
     * @param nodeID {var} TODOC
     * @return {var} TODOC
     */
    deleteItem : function(nodeID) {

      /* 插入并执行删除数据事务 */
      return this._pushTrans(this._getNewDeleteCommand(nodeID));
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
      return this._pushTrans(this._getNewMoveCommand(nodeId, targetParent, targetPosition));
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

      return this._pushTrans(this._getNewUpdateCommand(ID, columnID, value, oldValue));
    },
    
    /**
     * TODOC
     *
     * @return {boolean} TODOC
     */
    _clearUndoList : function()
    {
      var undoList = this._undoList;
      var length = undoList.getLength();

      /* 若不需要清理,退出 */
      if (undoList.getLength() == 1) {
        return true;
      }
      undoList.splice(1, length - 1)

      /* 没有可以redo的东西，原先可以redo */
      this.fireDataEvent("canUndo", false, true, false);
    },


    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    clearData : function()
    {
      this._clearRedoList();
      this._clearUndoList();
      return this.base(arguments);
    },

    loadFromJSON: function(json)
    {
      this.clearData();
      return this.base(arguments, json);
    },

    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    getUndoList : function() {
      return this._undoList;
    }
  },
  destruct : function()
  {

    /* 撤销表 */
    var undoList = this._undoList;
    for (var i = 0, l = undoList.getLength(); i < l; i++) {
      undoList.getItem(i).dispose();
    }
    this._undoList = null;

    /* 重做表 */
    var redoList = this._redoList;
    for (var i = 0, l = redoList.length; i < l; i++) {
      redoList[i].dispose();
    }
    this._redoList = null;

    // 事务表
    var transList = this._transList;
    for (var i = 0, l = transList.length; i < l; i++) {
      transList[i].dispose();
    }
    this._transList = null;
  }
});
