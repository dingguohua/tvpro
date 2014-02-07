
/* ************************************************************************
************************************************************************ */
qx.Class.define('tvproui.layout.LayoutVersionModel',
{
  extend : tvproui.control.ui.treevirtual.ActionModel,
  properties :
  {
    channelID : {
      check : "Integer"
    },
    channel : {
      check : "String"
    },

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
    this.base(arguments, ["name", "weekday", "channelName", "alias", "updateTime", "tag"]);

    /* 允许编辑名称和标签 */
    this.setColumnEditable(0, true);
    this.setColumnEditable(1, true);
    this.setColumnEditable(2, false);
    this.setColumnEditable(3, false);
    this.setColumnEditable(4, false);
    this.setColumnEditable(5, true);
  },
  members :
  {

    /* 获取新的添加命令 */

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
    _getNewAddCommand : function(type, parentID, position, label, rowData, columnData, icon, iconSelected) {
      return new tvproui.layout.command.AddCommand(this, type, parentID, position, label, rowData, columnData, icon, iconSelected);
    },

    /* 获取新的添加命令 */

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
      return new tvproui.layout.command.UpdateCommand(this, ID, col, value, oldValue);
    },

    /* 获取新的添加命令 */

    /**
     * TODOC
     *
     * @param ID {var} TODOC
     * @return {var} TODOC
     */
    _getNewDeleteCommand : function(ID) {
      return new tvproui.layout.command.DeleteCommand(this, ID);
    },

    /* 获取新的移动命令，用以被重载使用 */

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
      return new tvproui.layout.command.MoveCommand(this, nodeID, parentID, position, direction);
    },

    /* 添加版本 */

    /**
     * TODOC
     *
     * @param position {var} TODOC
     * @param weekday {var} TODOC
     * @param name {var} TODOC
     * @param tag {var} TODOC
     * @return {var} TODOC
     */
    addVersion : function(position, weekday, name, tag)
    {

      //默认从周一开始编排
      if (!weekday) {
        weekday = 1;
      }
      var row =
      {
        name : name,
        weekday : weekday,
        channelID : this.getChannelID(),
        channelName : this.getChannel(),
        userName : tvproui.user.LoginWindow.currentUsername,
        updateTime : tvproui.utils.Time.formatDate(new Date()),
        alias : tvproui.user.LoginWindow.currentUserAlias,
        tag : tag
      };
      var ID = this.addItem("branch", 0, position, row.name, row, ["", row.channelName, row.alias, row.updateTime, tag], "tvproui/layout/version.png", "tvproui/layout/version.png");
      return ID;
    },

    // 添加日播表

    /**
     * TODOC
     *
     * @param parentID {var} TODOC
     * @param position {var} TODOC
     * @param weekday {var} TODOC
     * @param name {var} TODOC
     * @param tag {var} TODOC
     * @return {var} TODOC
     */
    addDayTable : function(parentID, position, weekday, name, tag)
    {

      // 未设定周几，则根据父节点推断
      if (!weekday)
      {
        var parentRow = this.getNodeByNodeId(parentID).columnData.row;
        weekday = parentRow.weekday;

        //修改WeekDay到服务器端
        var newWeekday = weekday % 7 + 1;
        this.updateItemByID(parentID, 1, newWeekday, weekday);
        this.commitUpdate();
        this.setColumnData(parentID, 1, "");
      }

      // 未设定名称，则根据周几推断
      if (!name) {
        name = tvproui.layout.LayoutVersionTable.dayNames[weekday];
      }
      if (!tag) {
        tag = null;
      }
      var row =
      {
        name : name,
        weekday : weekday,
        channelID : this.getChannelID(),
        channelName : this.getChannel(),
        userName : tvproui.user.LoginWindow.currentUsername,
        updateTime : tvproui.utils.Time.formatDate(new Date()),
        alias : tvproui.user.LoginWindow.currentUserAlias,
        tag : tag
      };
      var ID = this.addItem("leaf", parentID, position, row.name, row, [weekday, row.channelName, row.alias, row.updateTime, tag], "tvproui/layout/weekday.png", "tvproui/layout/weekday.png");
      return ID;
    },

    // 预排表版本数据

    /**
     * TODOC
     *
     * @param channelID {var} TODOC
     * @param channel {var} TODOC
     * @return {void | boolean | Map} TODOC
     */
    loadData : function(channelID, channel)
    {

      // 先关闭
      this.close();
      this.setChannelID(channelID);
      this.setChannel(channel);
      var rows = tvproui.AjaxPort.call("layoutVersion/loadLayoutVersion", {
        "channelID" : channelID
      });
      this.clearData();
      if (null == rows) {
        return;
      }
      if (null == rows.lock) {
        return false;
      }
      var lock = (rows.lock != 1);
      this.setLocked(lock);
      var alias = (rows.alias == null) ? "" : rows.alias;
      this.setEditingAlias(alias);
      rows = rows.datas;
      if (null == rows) {
        return {
          alias : alias,
          lock : lock
        };
      }
      for (var i = 0, l = rows.length; i < l; i++)
      {
        var row = rows[i];
        row.ID = parseInt(row.ID);
        row.weekday = parseInt(row.weekday);
        row.channelID = parseInt(row.channelID);

        //row.channelName = row.channelName;
        //row.name = row.name;
        //row.username = row.username;
        //row.alias = row.alias;
        row.userID = parseInt(row.userID);

        //row.lastEdit = row.lastEdit
        var parentID = (row.parentID == "-1") ? null : parseInt(row.parentID);
        row.position = parseInt(row.position);

        //若为版本表在第一层，日表在第二层
        row.level = parentID ? 2 : 1;
        switch (row.level)
        {
          case 1:/* 父节点ID，列名称，默认展开，不隐藏收缩按钮，节点ID */
          this.addBranch(parentID, row.name, true, false, "tvproui/layout/version.png", "tvproui/layout/version.png", row.ID);
          this.setColumnData(row.ID, 1, "");
          break;
          case 2:/* 父节点ID，列名称，展开图片，关闭图片，节点ID */
          this.addLeaf(parentID, row.name, "tvproui/layout/weekday.png", "tvproui/layout/weekday.png", row.ID);
          this.setColumnData(row.ID, 1, row.weekday);
          break;
        }
        this.setColumnData(row.ID, 2, row.channelName);
        this.setColumnData(row.ID, 3, row.alias);
        this.setColumnData(row.ID, 4, row.lastEdit);
        this.setColumnData(row.ID, "row", row);
      }
      this.setData();
      return {
        alias : alias,
        lock : lock
      };
    },


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
     */
    addItem : function(type, parentID, position, label, rowData, columnData, icon, iconSelected)
    {
      var ID = this.base(arguments, type, parentID, position, label, rowData, columnData, icon, iconSelected);

      //增加对复制情况下Tags的处理
      if (rowData.tag && ID) {
        tvproui.tag.instance.TagInstanceModel.cloneTags(rowData.tag, ID);
      }
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
      if (col == 5) {
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

        // 周几
        case 1:row.weekday = value;
        break;
      }
    },


    /**
     * TODOC
     *
     */
    close : function()
    {

      // 锁定用户不需要关闭
      if (this.getLocked()) {
        return;
      }
      tvproui.AjaxPort.call("layoutVersion/closeLayoutVersion", {
        "channelID" : this.getChannelID()
      });
    }
  },

  // 界面之外的内容释放
  destruct : function() {

    // 释放锁
    this.close();
  }
});

// 释放非显示层级对象
