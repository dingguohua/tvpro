
/* ************************************************************************
************************************************************************ */
qx.Class.define('tvproui.statistic.EPG.EPGEditModel',
{
  extend : tvproui.EPG.viewTable.EPGViewModel,

  construct: function(EPGVersionID, SubVersionID, channelID, broadcastDate)
  {
    this.base(arguments, EPGVersionID, SubVersionID, channelID, broadcastDate);
    this._dynamicColumns = [];
  },

  members :
  {
    _editStep: 0,
    _lastSaveStep: 0,
    _dynamicColumns: null,

    /* 获取新的更新命令, 用以被重载使用 */

    /**
     * TODOC
     *
     * @param oldMap {var} TODOC
     * @param newMap {var} TODOC
     * @return {var} TODOC
     */
    _getNewUpdateCommand : function(nodeID, columnID, newValue, oldValue) {
      return new tvproui.statistic.EPG.command.UpdateCommand(this, nodeID, columnID, newValue, oldValue);
    },

    /**
     * 加载EPG数据，只读
     *
     * @return {boolean | var} TODOC
     */
    loadEPGData : function()
    {
      var epgVersionID = this.getEPGVersionID();

      // 加载编播表
      var result = tvproui.AjaxPort.call("statistic/loadStatisEpgcolumnByID",
      {
        "ID" : epgVersionID
      });

      return result;
    },

    /* 配置素材附加预测字段 */
    configVectors: function(result)
    {
      // 处理动态列
      // 卸载旧的动态列
      var dynamicColumns = this._dynamicColumns;
      for(var i = 0, l = dynamicColumns.length; i < l; i++)
      {
        var columnID = dynamicColumns[i];

        // 动态列均为第三列
        this.removeColumn(columnID, 3);
      }

      var columnCount = this.getColumnCount();

      dynamicColumns.length = 0;
      var tableDynamicColumns = result.predict;
      for(var i = 0, l = tableDynamicColumns.length; i < l; i++)
      {
        var tableDynamicColumn = tableDynamicColumns[i];
        var columnID = tableDynamicColumn.vectorname;
        dynamicColumns.push(columnID);

        // 动态列均为第三列
        this.addColumn(columnID, columnID, 3, true);
      }

      this.setData();

      return columnCount;
    },

    /* 加载素材数据 */

    /**
     * TODOC
     *
     * @return {boolean | Map} TODOC
     */
    loadData : function(result)
    {
      // 加载样式表
      var defaultStyleMap = tvproui.system.fileManager.getCSSStyle();
      if(!defaultStyleMap)
      {
        return false;
      }

      // 处理维度字段
      var dimensions = result.predict;

      // 处理装载数据
      var epgcolumns = result.epgcolumn;

      // 清理数据
      this.clearData();

      for(var i = 0, l = epgcolumns.length; i < l; i++)
      {
        var columnData = epgcolumns[i];
        columnData.ID = columnData.columnID;
        var nodeID = columnData.ID;

        // root无需插入
        if(0 == columnData.level)
        {
          continue;
        }

        //row.name = row.name;
        columnData.beginTime = tvproui.utils.Time.fromOffset(parseInt(columnData.beginTime));
        columnData.endTime = tvproui.utils.Time.fromOffset(parseInt(columnData.endTime));
        columnData.duration = columnData.endTime.sub(columnData.beginTime);

        columnData.IDMaterial = parseInt(columnData.IDMaterial);
        columnData.parentID = parseInt(columnData.parentID);
        
        //columnData.type = row.type
        columnData.fixed = (columnData.fixed == 1) ? true : false;

        columnData.intersection = "";
        columnData.spare = "";
        columnData.durationcalc = "";
        columnData.changed = false;
        columnData.level = parseInt(columnData.level);

        delete columnData.columnID;

        var parentID = columnData.parentID;
        delete columnData.parentID;

        var position = columnData.position;
        delete columnData.position;

        var predict = columnData.predict;
        delete columnData.predict;

        for(var key in predict)
        {
          columnData[key] = predict[key];
        }

        var style = null;

        // 刷新样式表
        if(!defaultStyleMap[columnData.type])
        {
          dialog.Dialog.error("未定义的数据类型" + columnData.type);
          style = defaultStyleMap["未知类型"];
        }
        else
        {
          style = defaultStyleMap[columnData.type];
        }

        switch(columnData.level)
        {
          //栏目
          case 1:
            this.addBranch(nodeID, 0, position);
            break;
          // 子栏目
          case 2:
            this.addBranch(nodeID, parentID, position);
            break;
          //素材
          case 3:
            this.addLeaf(nodeID, parentID, position);
            break;
        }

        this.setNode(nodeID, columnData, style);
      }

      // 刷新数据显示
      this.setData();

      // 检查表格状态
      this.check();

      return true;
    },

    // 将编播表保存至网络
    saveNetwork: function()
    {
      // 加载编播表
      var epgVersionID = this.getEPGVersionID();

      // 通过回退表计算变更项目
      var undoList = this._undoList;
      var updateItems = [];
      for(var i = 1, l = undoList.getLength(); i < l; i++)
      {
        var groupCommand = undoList.getItem(i);
        var updateCommand = groupCommand.getWorks()[0];
        updateItems.push(updateCommand.getItem());
      }

      var result = tvproui.AjaxPort.call("statistic/updateStatisItems", {
        "epgversionid" : epgVersionID,
        "confirmjson": tvproui.utils.JSON.stringify(updateItems)
      });

      if(null === result)
      {
        dialog.Dialog.error("存盘失败!");
        return;
      }

      this._lastSaveStep = this._editStep;

      this._clearRedoList();
      this._clearUndoList();

      return;
    },

    // 清除所有的变更记录

    /**
     * TODOC
     *
     */
    cleanChanged : function()
    {

      /* 清除更新标记 */
      var children = this.getData();
      for (var childID in children)
      {
        if (parseInt(childID) != childID) {
          continue;
        }
        var child = children[childID];
        if (!child || child.nodeID == 0) {
          continue;
        }
        var columnData = child.columnData;
        columnData.changed = false;
        columnData.spare = "";
        columnData.intersection = "";
        columnData.durationcalc = "";
      }
    },

    /* 修改数据内容 , 一个值 */

    /**
     * TODOC
     *
     * @param node {Node} TODOC
     * @param colID {var} TODOC
     * @param value {var} TODOC
     * @param oldValue {var} TODOC
     * @return {boolean | var} TODOC
     */
    updateItem : function(node, colID, value, oldValue)
    {
      var ID = node.nodeID;
      var parent = this.getNodeByNodeId(node.parentID);

      // 清除变更记录
      this.cleanChanged();

      // 父类函数
      var result = this.updateItemByID(ID, colID, value, oldValue);
      if (result)
      {
        var columnData = node.columnData;

        // 变更提示
        columnData.changed = true;

        // 提交事务
        this.commitTrans(["更新 [", columnData.beginTime.toString(), " ", columnData.type, " ", columnData.name, " ", this.getColumnNameByLevelId(node.level, colID), " 为 ", value, "]"].join(""));
      }

      this.check();
      return result;
    },

    /**
     * TODOC
     *
     * @return {boolean} TODOC
     */
    needSaveVersion : function()
    {
      // 是否是有操作步骤，如果没有操作步骤，则无需保存版本
      if (this._lastSaveStep == this._editStep) {
        return false;
      }

      return true;
    },

    commitTrans : function(description)
    {
      this.base(arguments, description);

      // 存储操作步骤计数
      this._editStep++;
    },

    undo : function()
    {
      this.base(arguments);

      // 存储操作步骤计数
      this._editStep++;
    },

    redo: function()
    {
      this.base(arguments);

      // 存储操作步骤计数
      this._editStep++;
    },

    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    getCommandList : function()
    {
      var undoList = this.getUndoList();
      var descriptions = [];
      descriptions.length = undoList.getLength();
      for (var i = 0, l = descriptions.length; i < l; i++)
      {
        var command = undoList.getItem(i);
        descriptions[i] = command.getDescription();
      }
      descriptions.shift();
      return tvproui.utils.JSON.stringify(descriptions);
    }
  }
});
