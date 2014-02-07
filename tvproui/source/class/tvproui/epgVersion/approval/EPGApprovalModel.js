
/* ************************************************************************
************************************************************************ */
qx.Class.define('tvproui.epgVersion.approval.EPGApprovalModel',
{
  extend : tvproui.control.ui.treevirtual.ActionModel,
  properties :
  {

    // 锁定状态，锁定后不可编辑
    locked :
    {
      init : true,
      check : "Boolean"
    },

    // 正在编辑用户名
    editingAlias : {
      check : "String"
    }
  },
  construct : function()
  {

    /* 初始化数据 */
    this.base(arguments, ["name", "type", "checkout", "broadcastdate", "channelName", "description", "alias", "recordtime", "tag"]);

    /* 允许编辑名称和标签 */
    this.setColumnEditable(0, false);
    this.setColumnEditable(1, false);
    this.setColumnEditable(2, false);
    this.setColumnEditable(3, false);
    this.setColumnEditable(4, false);
    this.setColumnEditable(5, false);
    this.setColumnEditable(6, false);
    this.setColumnEditable(7, false);
    this.setColumnEditable(8, false);
  },
  members :
  {

    /* 获取新的添加命令 */

    /**
     * TODOC
     *
     * @param oldMap {var} TODOC
     * @param newMap {var} TODOC
     * @return {var} TODOC
     */
    _getNewUpdateCommand : function(oldMap, newMap) {
      return new tvproui.epgVersion.command.UpdateCommand(this, oldMap, newMap);
    },

    // 预排表版本数据

    /**
     * TODOC
     *
     * @return {boolean | Map} TODOC
     */
    loadData : function()
    {
      this.close();
      var rows = tvproui.AjaxPort.call("approvalflow/loadofflineflow");
      this.clearData();
      if (null == rows) {
        return false;
      }

      //!!! 强制不锁定
      //var lock = (rows.lock != 1);
      var lock = false;
      this.setLocked(lock);
      var alias = (rows.alias == null) ? "" : rows.alias;
      this.setEditingAlias(alias);

      //rows = rows.datas;
      for (var i = 0, l = rows.length; i < l; i++)
      {
        var row = rows[i];
        row.ID = parseInt(row.ID);

        //row.name = row.name;
        row.epgversionid = parseInt(row.epgversionid);

        //row.type = row.type;
        //row.broadcastdate = row.broadcastdate
        //row.channelName = row.channelName;
        //row.checkout = row.checkout;
        row.channelID = parseInt(row.channelID);
        row.channelICON = tvproui.system.fileManager.path(row.imagepath);
        delete row.imagepath;

        //row.description = row.description;
        //row.alias = row.alias;
        //row.recordtime = row.recordtime
        this.addBranch(null, row.name, true, false, "tvproui/layout/version.png", "tvproui/layout/version.png", row.ID);
        this.setColumnData(row.ID, 1, row.type);
        this.setColumnData(row.ID, 2, row.checkout);
        this.setColumnData(row.ID, 3, row.broadcastdate);
        this.setColumnData(row.ID, 4, row.channelName);
        this.setColumnData(row.ID, 5, row.description);
        this.setColumnData(row.ID, 6, row.alias);
        this.setColumnData(row.ID, 7, row.recordtime);
        this.setColumnData(row.ID, "row", row);
      }
      this.setData();
      return {
        alias : alias,
        lock : lock
      };
    },

    // overridden

    /**
     * TODOC
     *
     * @param columnIndex {var} TODOC
     * @return {boolean | var} TODOC
     */
    isColumnEditable : function(columnIndex)
    {
      if (this.getLocked()) {
        return false;
      }
      return (this._editableColArr ? this._editableColArr[columnIndex] == true : false);
    },


    /**
     * TODOC
     *
     * @param row {var} TODOC
     * @param col {var} TODOC
     * @param value {var} TODOC
     * @param oldValue {var} TODOC
     * @return {boolean | var} TODOC
     */
    updateItem : function(row, col, value, oldValue)
    {

      //tag处理
      if (col == 7) {
        return true;
      }
      return this.base(arguments, row, col, value, oldValue);
    },

    // 更新行数据

    /**
     * TODOC
     *
     * @param ID {var} TODOC
     * @param node {Node} TODOC
     * @param row {var} TODOC
     * @param col {var} TODOC
     * @param value {var} TODOC
     */
    updateRowData : function(ID, node, row, col, value) {
      switch (col)
      {

        // 名称
        case 0:node.label = value;
        row.name = value;
        break;
        case 2:row.broadcastdate = value;
        break;
      }
    },


    /**
     * TODOC
     *
     */
    close : function() {

      // 锁定用户不需要关闭
      if (this.getLocked()) {
        return;
      }
    }
  },

  // 界面之外的内容释放
  destruct : function() {

    // 释放锁
    this.close();
  }
});

// 释放非显示层级对象
