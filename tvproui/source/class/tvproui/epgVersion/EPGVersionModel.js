
/* ************************************************************************
************************************************************************ */
qx.Class.define('tvproui.epgVersion.EPGVersionModel',
{
  extend: tvproui.control.ui.treevirtual.ActionModel,
  properties :{
      channelID:{
        check : "Integer"
      },
      channel:{
        check: "String"
      },
      channelICON: {
        check : "String"
      },

      broadcastDate:{
        check : "String"
      },
 
      locked :
      {
        init: true,
        check : "Boolean"
      },

      editingAlias :{
        check : "String"
      }
  },

  construct : function()
  {
    this.base(arguments,["name","type", "status", "checkout", "broadcastdate", "channelName", "alias", "updatedate", "tag"]);
    this.setColumnEditable(0,true);
    this.setColumnEditable(1,false);
    this.setColumnEditable(2, false);
    this.setColumnEditable(3, false);
    this.setColumnEditable(4, true);
    this.setColumnEditable(5, false);
    this.setColumnEditable(6, false);
    this.setColumnEditable(7, false);
    this.setColumnEditable(8, true);
  },
  members :
  {
    _lastChannelID : null,
    _lastBroadcastDate : null,

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
      return new tvproui.epgVersion.command.AddCommand(this, type, parentID, position, label, rowData, columnData, icon, iconSelected);
    },

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

    /* 获取新的添加命令 */

    /**
     * TODOC
     *
     * @param ID {var} TODOC
     * @return {var} TODOC
     */
    _getNewDeleteCommand : function(ID) {
      return new tvproui.epgVersion.command.DeleteCommand(this, ID);
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
      return new tvproui.epgVersion.command.MoveCommand(this, nodeID, parentID, position, direction);
    },

    /* 添加编播表 */

    /**
     * TODOC
     *
     * @param position {var} TODOC
     * @param broadcastdate {var} TODOC
     * @param name {var} TODOC
     * @param tag {var} TODOC
     * @return {var} TODOC
     */
    addEPG : function(position, broadcastdate, name, tag)
    {

      /* 获取方向 */
      var row =
      {
        name : name,
        type : "日播表",
        status : "未送审",
        checkout: "未检出",
        broadcastdate : broadcastdate,
        channelID : this.getChannelID(),
        channelName : this.getChannel(),
        userName : tvproui.user.LoginWindow.currentUsername,
        updatedate : tvproui.utils.Time.formatDateTime(),
        alias : tvproui.user.LoginWindow.currentUserAlias,
        tag : tag
      };
      return this.addItem("branch", 0, position, row.name, row, [row.type, row.status, row.checkout, row.broadcastdate, row.channelName, row.alias, row.updatedate, tag], "tvproui/layout/version.png", "tvproui/layout/version.png");
    },

    // 添加其他在线包装表格

    /**
     * TODOC
     *
     * @param parentID {var} TODOC
     * @param position {var} TODOC
     * @param name {var} TODOC
     * @param tag {var} TODOC
     * @param type {var} TODOC
     * @return {var} TODOC
     */
    addWrapper : function(parentID, position, name, tag, type)
    {
      var parent = this.getNodeByNodeId(parentID);
      var row =
      {
        name : name,
        type : type,
        status : "未送审",
        checkout: "未检出",
        broadcastdate : parent.columnData.row.broadcastdate,
        channelID : this.getChannelID(),
        channelName : this.getChannel(),
        userName : tvproui.user.LoginWindow.currentUsername,
        updatedate : tvproui.utils.Time.formatDateTime(),
        alias : tvproui.user.LoginWindow.currentUserAlias,
        tag : tag
      };
      return this.addItem("leaf", parentID, position, row.name, row, [row.type, row.status, row.checkout, row.broadcastdate, row.channelName, row.alias, row.updatedate, tag], "tvproui/layout/subtitle.png", "tvproui/layout/subtitle.png");
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

      //"name", "type", "broadcastdate", "channelName", "alias", "updateTime", "tag"
      var channelID = this.getChannelID();
      var broadcastDate = this.getBroadcastDate();
      var rows = tvproui.AjaxPort.call("epgVersion/loadCheckByChannelID",{
        "startDate" : broadcastDate,
        "endDate" : broadcastDate,
        "channelID" : channelID
      });
      this.clearData();
      if(null == rows){
        return false;
      }
      var lock = (rows.lock !=1);
      this.setLocked(lock);
      var alias = (rows.alias == null) ? "":rows.alias;
      this.setEditingAlias(alias);
      rows = rows.datas;

      for (var i = 0, l = rows.length; i < l; i++)
      {
        var row = rows[i];
        row.ID = parseInt(row.ID);

        //row.name = row.name;
        //row.type = row.type;
        //row.status = row.status;
        //row.check = row.check;
        //row.broadcastdate = row.broadcastdate;
        //row.channelName = row.channelName;
        //row.alias = row.alias;
        //row.updatedate = row.updatedate;
        row.channelID = this.getChannelID();
        var parentID = row.parentID == "-1" ? null : parseInt(row.parentID);
        delete row.parentID;

        //若为版本表在第一层，日表在第二层
        row.level = parentID ? 2 : 1;
        switch (row.level)
        {
          case 1:/* 父节点ID，列名称，默认展开，不隐藏收缩按钮，节点ID */
          this.addBranch(parentID, row.name, true, false, "tvproui/layout/version.png", "tvproui/layout/version.png", row.ID);
          break;
          case 2:/* 父节点ID，列名称，展开图片，关闭图片，节点ID */
          this.addLeaf(parentID, row.name, "tvproui/layout/subtitle.png", "tvproui/layout/subtitle.png", row.ID);
          break;
        }
        this.setColumnData(row.ID, 1, row.type);
        this.setColumnData(row.ID, 2, row.status);
        this.setColumnData(row.ID, 3, row.check);
        this.setColumnData(row.ID, 4, row.broadcastdate);
        this.setColumnData(row.ID, 5, row.channelName);
        this.setColumnData(row.ID, 6, row.alias);
        this.setColumnData(row.ID, 7, row.updatedate);
        this.setColumnData(row.ID, "row", row);
      }
      this.setData();

      // 保持上一次记录
      if (!lock)
      {
        this._lastChannelID = channelID;
        this._lastBroadcastDate = broadcastDate;
      }
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
      var ID = this.base(arguments, type, parentID, position, label, rowData, columnData, icon, iconSelected);

      //增加对复制情况下Tags的处理
      if (rowData.tag && ID) {
        tvproui.tag.instance.TagInstanceModel.cloneTags(rowData.tag, ID);
      }
      return ID;
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
      if (col == 8) {
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
        case 0:
        node.label = value;
        row.name = value;
          break;

        // 状态
        case 2:
          row.status = value;
          break;
        // 播出时间
        case 4:
          row.broadcastdate = value;
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
      var channelID = this._lastChannelID;
      var broadcastDate = this._lastBroadcastDate;
      this._lastChannelID = null;
      this._lastBroadcastDate = null;

      // 如果是可写模式，关闭引用的EPGVersion
      tvproui.AjaxPort.call("epgVersion/closeCheckByChannelID",
      {
        "startDate" : broadcastDate,
        "endDate" : broadcastDate,
        "channelID" : channelID
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
