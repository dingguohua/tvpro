
/**
 * @author Administrator
 */

/* ************************************************************************
#asset(qx/icon/${qx.icontheme}/22/actions/*)
#asset(qx/icon/${qx.icontheme}/22/devices/*)
#asset(qx/icon/${qx.icontheme}/22/categories/*)
#asset(tvproui/table/*)
#asset(tvproui/layout/*)
************************************************************************ */
qx.Class.define("tvproui.statistic.SourceTable",
{
  extend : qx.ui.container.Composite,
  statics : {
    currentEPG : {

    }
  },
  construct : function(model, parentWindow)
  {

    /* 网格化布局，第一行是表格，第二行是工具栏 */
    var layout = new qx.ui.layout.Grid(10, 0);
    this.base(arguments, layout);
    this._parentWindow = parentWindow;

    /* 水平方向随着窗口缩放 */
    layout.setColumnFlex(0, 1);

    /* 垂直方向，中间的表格随着窗口缩放 */
    layout.setRowFlex(0, 1);

    /* 频道数据模型初始化 */
    this._dataModel = model;

    /* 建立表格 */
    this._table = new qx.ui.treevirtual.TreeVirtual(["名称", "类型", "播出日期", "子版本", "创建人", "正确率", "最后修正日期", "最后计算日期"], {
      dataModel : this._dataModel
    });

    this._table.setRowHeight(24);
    this._table.addListener("cellDblclick", this._beforeEdit, this);
    this._table.setHeight(300);

    // 增加功能选单
    this._initContextMenu();
    this._table.setContextMenuHandler(0, this._contextMenuHandler, this);
    this._table.setContextMenuHandler(1, this._contextMenuHandler, this);
    this._table.setContextMenuHandler(2, this._contextMenuHandler, this);
    this._table.setContextMenuHandler(3, this._contextMenuHandler, this);
    this._table.setContextMenuHandler(4, this._contextMenuHandler, this);
    this._table.setContextMenuHandler(5, this._contextMenuHandler, this);
    this._table.setContextMenuHandler(6, this._contextMenuHandler, this);
    this._table.setContextMenuHandler(7, this._contextMenuHandler, this);

    /* 配置多选模式 */
    this._selectionModel = this._table.getSelectionModel();
    this._selectionModel.setSelectionMode(qx.ui.table.selection.Model.MULTIPLE_INTERVAL_SELECTION);

    /* 调整各列的渲染/编辑模式 */
    this._initTableColumnRender(this._table.getTableColumnModel());

    /* 将表格加入显示列表第二行位置 */
    this.add(this._table,
    {
      row : 0,
      column : 0
    });

    /* 初始化工具栏 */
    this.add(this._initToolBar(),
    {
      row : 1,
      column : 0
    });

    /* 默认屏蔽 */
    this.setEnabled(false);

    // 加载条件
    this._loadCondition();
  },
  members :
  {
    _table : null,
    _dataModel : null,
    _selectionModel : null,
    _openEntry : null,
    _joinStatisticEntry: null,
    _removeJoinStatisticEntry: null,
    _filterConditionsSelect: null,
    _filterConditionList: null,

    /* 初始化 列渲染器 */

    /**
     * TODOC
     *
     * @param columnModel {var} TODOC
     */
    _initTableColumnRender : function(columnModel)
    {
      var behavior = columnModel.getBehavior();

      /* 默认打开名称显示 */
      columnModel.setColumnVisible(0, true);
      behavior.setWidth(0, 250);
      var labelEditor = new tvproui.control.ui.table.celleditor.LabelEditor();
      columnModel.setCellEditorFactory(0, labelEditor);

      /* 类型 */
      columnModel.setColumnVisible(1, false);
      behavior.setWidth(1, 60);

      /* 播出日期 */
      columnModel.setColumnVisible(2, true);
      behavior.setWidth(2, 100);

      /* 子版本号 */
      columnModel.setColumnVisible(3, true);
      behavior.setWidth(3, 60);

      /* 创建人 */
      columnModel.setColumnVisible(4, true);
      behavior.setWidth(4, 73);

      /* 正确率 */
      columnModel.setColumnVisible(5, true);
      behavior.setWidth(5, 73);

      /* 播出日期 */
      columnModel.setColumnVisible(6, true);
      behavior.setWidth(6, 100);

      /* 播出日期 */
      columnModel.setColumnVisible(7, true);
      behavior.setWidth(7, 100);
    },

    /* 初始化工具栏 */

    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    _initToolBar : function()
    {
      var toolbar = new qx.ui.toolbar.ToolBar();

      /* 工具栏的操作分段 */
      var actionPart = new qx.ui.toolbar.Part();
      toolbar.add(actionPart);

      /* 加入打开按钮到编辑分段中 */
      var openButton = new qx.ui.toolbar.Button("打开", "icon/22/actions/document-open.png");
      openButton.addListener("execute", this._onOpenButton, this);
      actionPart.add(openButton);

      // 选区实现
      var selectionMenu = new qx.ui.menu.Menu();
      var selectionAllButton = new qx.ui.menu.Button("全选", "tvproui/selection/all.png");
      var selecttionReverseButton = new qx.ui.menu.Button("反选", "tvproui/selection/reverse.png");
      var selectionByNameButton = new qx.ui.menu.Button("按名称", "tvproui/selection/byname.png");
      selectionMenu.add(selectionAllButton);
      selectionMenu.add(selecttionReverseButton);
      selectionMenu.add(selectionByNameButton);
      selectionAllButton.addListener("execute", this._selectionAllCommandExecute, this);
      selecttionReverseButton.addListener("execute", this._selectionReverseButton, this);
      selectionByNameButton.addListener("execute", this._onSelectionByNameButton, this);
      var selectionButton = new qx.ui.toolbar.MenuButton("选择", "tvproui/selection/selection.png", selectionMenu);
      actionPart.add(selectionButton);

      // 导出为周播表
      var exportLayoutTable = new qx.ui.toolbar.Button("导出为周播表", "icon/22/categories/internet.png");
      exportLayoutTable.addListener("execute", this._onLayoutExportButton, this);
      actionPart.add(exportLayoutTable);

      /* 模型 */
      var modelPart = new qx.ui.toolbar.Part();
      toolbar.add(modelPart);

      var characterStudyButton = new qx.ui.toolbar.Button("学习", "icon/22/actions/mail-mark-read.png");
      characterStudyButton.addListener("execute", this._onCharacterStudyButton, this);
      modelPart.add(characterStudyButton);

      var predictButton = new qx.ui.toolbar.Button("预测", "icon/22/actions/view-sort-descending.png");
      predictButton.addListener("execute", this._onPredictButton, this);
      modelPart.add(predictButton);

      /* 工具栏的操作分段 */
      var exportPart = new qx.ui.toolbar.Part();
      toolbar.add(exportPart);

      /* 加入删除按钮到编辑分段中 */
      var labelFilter = new qx.ui.toolbar.RadioButton("筛选条件");
      exportPart.add(labelFilter);

      var addButton = new qx.ui.toolbar.Button("增加", "icon/22/actions/list-add.png");
      addButton.addListener("execute", this._addConditionButton, this);
      exportPart.add(addButton);

      var deleteButton = new qx.ui.toolbar.Button("删除", "icon/22/actions/list-remove.png");
      deleteButton.addListener("execute", this._deleteConditionButton, this);
      exportPart.add(deleteButton);

      var editButton = new qx.ui.toolbar.Button("编辑", "icon/22/actions/insert-link.png");
      editButton.addListener("execute", this._editConditionButton, this);
      exportPart.add(editButton);

      /* 监听事件决定是否启用删除按钮 */
      var filterConditionList = new qx.data.Array();
      this._filterConditionList = filterConditionList;
      var filterConditionsSelect = new qx.ui.form.VirtualSelectBox(filterConditionList).set( {
        labelPath : "description"
      });
      filterConditionsSelect.bind("selection[0].description", filterConditionsSelect, "toolTipText", null);

      var delegate = {
        bindItem : function(controller, item, id)
        {
          controller.bindDefaultProperties(item, id);
          controller.bindProperty("description", "toolTipText", null, item, id);
        }
      };

      filterConditionsSelect.setDelegate(delegate);
      exportPart.add(filterConditionsSelect);
      filterConditionsSelect.setWidth(250);

      var exportExcelButton = new qx.ui.toolbar.Button("筛选结果导出为Excel", "icon/22/apps/office-spreadsheet.png");
      exportExcelButton.addListener("execute", this._onExportButton, this);
      exportPart.add(exportExcelButton);

      this._filterConditionsSelect = filterConditionsSelect;

      return toolbar;
    },

    // 特征学习
    _onCharacterStudyButton: function()
    {
        var conditionModifyed = tvproui.AjaxPort.call("statistic/autoStudyFromStatisTable", null, false, true, function(result)
        {
          if(!result)
          {
            dialog.Dialog.error("特征学习过程中发生了错误！");
            return;
          }

          dialog.Dialog.alert("特征学习成功!");
        });
    },

    _onPredictButton: function()
    {
      // 获得需要预测的表格
      var model = this._dataModel;
      var selectionModel = this._selectionModel;
      var selections = selectionModel.getSelectedRanges();
      var selectPos = null;
      var predictRequest = [];
      for (var i = 0, l = selections.length; i < l; i++)
      {
        var section = selections[i];
        for(var row = section.minIndex, maxRow = section.maxIndex; row <= maxRow; row++)
        {
          var selectedNode = model.getRowData(row)[0];
          var nodeID = selectedNode.nodeId;
          var nodeRow = selectedNode.columnData.row;
          if(nodeRow.correctRate == "尚未导入")
          {
            dialog.Dialog.alert(nodeRow.name + "尚未导入，跳过!");
            continue;
          }

          predictRequest.push(nodeID);
        }
      }

      
      var result = tvproui.AjaxPort.call("statistic/recursivePredictByIDs",
      {
         "predictRequest" : tvproui.utils.JSON.stringify(predictRequest)
      });

      if(!result)
      {
        dialog.Dialog.alert("预测中出错!");
        return;
      }

      // 重新加载学习成果
      this.loadData();
      dialog.Dialog.alert("预测成功!");
    },

    _addConditionButton: function(e)
    {
      var filterConditionEditorWindow = tvproui.Application.desktop.loadWindow(tvproui.statistic.FilterCondition.FilterConditionEditor);
      filterConditionEditorWindow.addListener("close", function(e) {
        var condition = filterConditionEditorWindow.getCondition();
        if(condition == null)
        {
          return;
        }

        var conditionID = tvproui.AjaxPort.call("statistic/addUserSql",
        {
          name: condition.getDescription(),
          query: tvproui.utils.JSON.stringify(condition.getCondition())
        });

        if(!conditionID)
        {
          dialog.Dialog.error("添加统计过滤条件到服务器时出错!");
          return;
        }

        condition.setId(conditionID);
        this._filterConditionList.push(condition);
        var filterSelections = this._filterConditionsSelect.getSelection();
        filterSelections.removeAll();
        filterSelections.push(condition);
      }, this);
    },

    _deleteConditionButton: function()
    {
      var filterConditionsSelect = this._filterConditionsSelect;
      var filterSelections = filterConditionsSelect.getSelection();
      if(filterSelections.getLength() == 0)
      {
        dialog.Dialog.error("请增加新的过滤条件!");
        return;
      }

      var filterItem = filterSelections.getItem(0);
      var result = tvproui.AjaxPort.call("statistic/deleteUserSql",
      {
        id: filterItem.getId()
      });

      filterSelections.remove(filterItem);
      var list = this._filterConditionList;
      list.remove(filterItem);
    },

    _editConditionButton: function()
    {
      var filterConditionsSelect = this._filterConditionsSelect;
      var filterSelections = filterConditionsSelect.getSelection();
      if(filterSelections.getLength() == 0)
      {
        dialog.Dialog.error("请增加新的过滤条件!");
        return;
      }

      var filterItem = filterSelections.getItem(0);

      var filterConditionEditorWindow = tvproui.Application.desktop.loadWindow(tvproui.statistic.FilterCondition.FilterConditionEditor, filterItem);
      filterConditionEditorWindow.addListener("close", function(e) {
        var condition = filterConditionEditorWindow.getCondition();
        if(condition == filterItem)
        {
          return;
        }

        var conditionModifyed = tvproui.AjaxPort.call("statistic/modifyUserSql",
        {
          id: condition.getId(),
          name: condition.getDescription(),
          query: tvproui.utils.JSON.stringify(condition.getCondition())
        });

        filterItem.setDescription(condition.getDescription());
        filterItem.setCondition(condition.getCondition());
      }, this);
    },

    _loadCondition: function()
    {
      var list = this._filterConditionList;
      list.removeAll();
      var results = tvproui.AjaxPort.call("statistic/loadUserSql");
      if(!results || results.length == 0)
      {
        return;
      }
      
      for(var i = 0, l = results.length; i < l; i++)
      {
        var result = results[i];
        var condition = new tvproui.statistic.FilterCondition.FilterCondition();
        var parsed = {};
        try
        {
          parsed = JSON.parse(result.condition);
        }
        catch(err)
        {
          
        }

        condition.set({id: result.id, description: result.name, condition: parsed});
        list.push(condition);
      }
    },

    /**
     * TODOC
     *
     */
    _initContextMenu : function()
    {
      // 打开按钮
      var openEntry = new qx.ui.menu.Button("打开", "icon/22/actions/document-open.png");
      openEntry.addListener("execute", this._onOpenButton, this);
      this._openEntry = openEntry;

      // 加入打开按钮到编辑分段中
      var joinStatisticEntry = new qx.ui.menu.Button("重新导入", "icon/22/actions/help-about.png");
      joinStatisticEntry.addListener("execute", this._onJoinStatisticButton, this);
      this._joinStatisticEntry = joinStatisticEntry;

      var removeJoinStatisticEntry = new qx.ui.menu.Button("取消导入", "icon/22/actions/edit-delete.png");
      removeJoinStatisticEntry.addListener("execute", this._onRemoveJoinStatisticEntry, this);
      this._removeJoinStatisticEntry = removeJoinStatisticEntry;
    },

    /* 根据需求获取当前选中项信息 */

    /**
     * TODOC
     *
     * @param level {var} TODOC
     * @return {void | var} TODOC
     */
    getSelectedItem : function(level)
    {
      if ((level < 0) || (level > 3))
      {
        dialog.Dialog.error("无效的选择范围");
        return;
      }
      var selectionModel = this._selectionModel;
      var selections = selectionModel.getSelectedRanges();
      var selectPos = null;
      for (var i = 0, l = selections.length; i < l; i++)
      {
        var section = selections[i];
        selectPos = section.maxIndex;
        break;
      }
      return this.getLevelNode(selectPos, level);
    },


    /**
     * TODOC
     *
     * @param row {var} TODOC
     * @param level {var} TODOC
     * @return {null | var} TODOC
     */
    getLevelNode : function(row, level)
    {

      /* 未有任何选中项 */
      if (null == row) {
        return null;
      }
      var dataModel = this._dataModel;
      var selectedNode = dataModel.getRowData(row)[0];
      var findParentLength = selectedNode.level - level;
      if (findParentLength < 0) {
        return null;
      }

      /* 递归向父级前进 */
      for (var i = 0; i < findParentLength; i++) {
        selectedNode = dataModel.getNodeByNodeId(selectedNode.parentNodeId);
      }
      return selectedNode;
    },

    // 打开日节目预排表

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onOpenButton : function(e)
    {
      // 判断窗口是否已经打开过，如果已经打开过直接切换至响应窗口
      var item = this.getSelectedItem(1);
      var model = this._dataModel;
      if (null == item) {
        return;
      }
      var row = item.columnData.row;
      if(row.correctRate == "尚未导入")
      {
        dialog.Dialog.error(row.name + "尚未导入，请您导入后再进行打开操作!");
        return;
      }

      var currentEPG = tvproui.statistic.SourceTable.currentEPG;
      if (currentEPG[item.nodeId])
      {
        currentEPG[item.nodeId].maximize();
        return;
      }

      var EPGVersionID = item.nodeId;

      // 打开编辑窗口
      var configuration =
      {
        EPGVersionID : EPGVersionID,
        subVersionID: row.subversion,
        channelID : row.channelID,
        channelName : row.channelName,
        channelICON : model.getChannelICON(),
        broadcastdate : row.broadcastdate,
        name : row.name + " (" + row.broadcastdate + ")"
      };
      var epgWindow = tvproui.Application.desktop.loadWindow(tvproui.statistic.EPG.EPGEditWindow, configuration);
      currentEPG[item.nodeId] = epgWindow;
      epgWindow.addListener("close", function(e) {
        delete currentEPG[item.nodeId];
      }, this);
    },

    /**
     * 统计
     *
     * @param e {Event} TODOC
     */
    _onJoinStatisticButton: function(e)
    {
      var model = this._dataModel;
      var selectionModel = this._selectionModel;
      var selections = selectionModel.getSelectedRanges();
      var selectPos = null;
      for (var i = 0, l = selections.length; i < l; i++)
      {
        var section = selections[i];
        for(var row = section.minIndex, maxRow = section.maxIndex; row <= maxRow; row++)
        {
          var selectedNode = model.getRowData(row)[0];
          var nodeID = selectedNode.nodeId;
          var nodeRow = selectedNode.columnData.row;
          if(nodeRow.correctRate != "尚未导入")
          {
            dialog.Dialog.alert(nodeRow.name + "已导入，跳过!");
            continue;
          }

          var checkoutResult = tvproui.AjaxPort.call("statistic/createStatisByEpgId",
          {
             "ID" : nodeID,
             "subversion": nodeRow.subversion
          });

          // ID已经存在应该报错

          if(!checkoutResult)
          {
            dialog.Dialog.error("转换表格" + selectedNode.label + "时出错，转换进程已经停止!");
            return;
          }
        }
      }

      // 刷新数据加载情况
      this.loadData();
    },

    /**
    * 删除统计
    * @param e {Event} TODOC
    */
    _onRemoveJoinStatisticEntry: function(e)
    {
      var model = this._dataModel;
      var selectionModel = this._selectionModel;
      var selections = selectionModel.getSelectedRanges();
      var selectPos = null;
      for (var i = 0, l = selections.length; i < l; i++)
      {
        var section = selections[i];
        for(var row = section.minIndex, maxRow = section.maxIndex; row <= maxRow; row++)
        {
          var selectedNode = model.getRowData(row)[0];
          var nodeID = selectedNode.nodeId;
          var nodeRow = selectedNode.columnData.row;
          if(nodeRow.correctRate == "尚未导入")
          {
            dialog.Dialog.alert(nodeRow.name + "尚未导入，跳过!");
            continue;
          }

          var checkoutResult = tvproui.AjaxPort.call("statistic/removeStatisByEpgId",
          {
             "EPGVersionID" : nodeID
          });

          // ID已经存在应该报错

          if(!checkoutResult)
          {
            dialog.Dialog.error("取消导入表格" + selectedNode.label + "时出错，转换进程已经停止!");
            return;
          }
        }
      }

      // 刷新数据加载情况
      this.loadData();
    },


    _onExportButton: function(e)
    {
      var model = this._dataModel;
      var selectionModel = this._selectionModel;
      var selections = selectionModel.getSelectedRanges();
      var epgids = [];

      // 获取被选中表格ID集合
      for (var i = 0, l = selections.length; i < l; i++)
      {
        var section = selections[i];
        for(var row = section.minIndex, maxRow = section.maxIndex; row <= maxRow; row++)
        {
          var selectedNode = model.getRowData(row)[0];
          var nodeRow = selectedNode.columnData.row;
          if(nodeRow.correctRate == "尚未导入")
          {
            dialog.Dialog.alert(nodeRow.name + "尚未导入，跳过!");
            continue;
          }

          epgids.push(selectedNode.nodeId);
        }
      }

      if(epgids.length == 0)
      {
        dialog.Dialog.error("请在上方选中您需要进行统计的表格!");
        return;
      }

      // 获取被选中的过滤条件json
      var filterConditionsSelect = this._filterConditionsSelect;
      var filterSelections = filterConditionsSelect.getSelection();
      if(filterSelections.getLength() == 0)
      {
        dialog.Dialog.error("请增加新的过滤条件!");
        return;
      }

      var filterItem = filterSelections.getItem(0);
      var filterCondition = filterItem.getCondition();

      var result = tvproui.AjaxPort.call("statistic/queryStatisByCondition",
      {
         queryRequest: tvproui.utils.JSON.stringify({epgids: epgids, query: filterCondition})
      });

      if(!result)
      {
        dialog.Dialog.error("导出数据时出现错误!");
        return;
      }

      qx.bom.Window.open("../../controller.php/statistic/downloadStatisExcel?filename=" + result + "&showname=" + filterItem.getDescription() + ".xls");
    },

    _onLayoutExportButton: function(e)
    {
      var model = this._dataModel;
      var selectionModel = this._selectionModel;
      var selections = selectionModel.getSelectedRanges();
      var epgids = [];

      // 获取被选中表格ID集合
      for (var i = 0, l = selections.length; i < l; i++)
      {
        var section = selections[i];
        for(var row = section.minIndex, maxRow = section.maxIndex; row <= maxRow; row++)
        {
          var selectedNode = model.getRowData(row)[0];
          var nodeRow = selectedNode.columnData.row;
          if(nodeRow.correctRate == "尚未导入")
          {
            dialog.Dialog.alert(nodeRow.name + "尚未导入，跳过!");
            continue;
          }

          epgids.push(selectedNode.nodeId);
        }
      }

      if(epgids.length == 0)
      {
        dialog.Dialog.error("请在上方选中您需要导出为周播表的统计表格!");
        return;
      }

      qx.bom.Window.open("../../controller.php/statistic/getWeeklyLayout?queryids=" + tvproui.utils.JSON.stringify(epgids));
    },

    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    loadData : function()
    {

      /* 停止编辑行为 */
      if (this._table.isEditing()) {
        this._table.stopEditing();
      }

      /* 清除选区 */
      this._table.getSelectionModel().resetSelection();

      /* 默认屏蔽 */
      this.setEnabled(true);
      var model = this._dataModel;
      return model.loadData();
    },

    // 编辑之前的判断

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _beforeEdit : function(e)
    {
      this._onOpenButton();
    },


    /**
     * 菜单处理
     *
     * @param col {var} TODOC
     * @param row {var} TODOC
     * @param table {var} TODOC
     * @param dataModel {var} TODOC
     * @param contextMenu {var} TODOC
     * @return {boolean} TODOC
     */
    _contextMenuHandler : function(col, row, table, dataModel, contextMenu)
    {
      contextMenu.add(this._openEntry);

      // 获得需要预测的表格
      var model = this._dataModel;
      var selectedNode = model.getRowData(row)[0];
      var nodeID = selectedNode.nodeId;
      var nodeRow = selectedNode.columnData.row;
      if(nodeRow.correctRate == "尚未导入")
      {
        contextMenu.add(this._joinStatisticEntry);
      }
      else
      {
        contextMenu.add(this._removeJoinStatisticEntry);
      }
      
      return true;
    },

    _selectionReverseButton: function(e)
    {
      var dataModel = this._dataModel;
      var selectionModel = this._table.getSelectionModel();
      var nodeMap = {

      };

      // 获得当前选中的素材
      var selections = selectionModel.getSelectedRanges();
      for (var i = 0, l = selections.length; i < l; i++)
      {
        var selection = selections[i];
        for (var j = selection.minIndex, k = selection.maxIndex; j <= k; j++)
        {
          var selectNode = dataModel.getNodeFromRow(j);
          nodeMap[selectNode.nodeId] = true;
        }
      }

      // 清空选区
      selectionModel.resetSelection();

      // 循环整表
      var nodes = dataModel.getData();
      for (var nodeID in nodes)
      {
        if (0 == nodeID) {
          continue;
        }
        if (nodeMap[nodeID]) {
          continue;
        }

        var row = dataModel.getRowFromNodeId(nodeID)
        selectionModel.addSelectionInterval(row, row);
      }
    },

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onSelectionByNameButton : function(e)
    {
      var dataModel = this._dataModel;
      var selectionModel = this._table.getSelectionModel();
      dialog.Dialog.prompt("请输入要选中条目的名称中包含的文本", function(result)
      {
        if (!result) {
          return;
        }

        // 清空选区
        selectionModel.resetSelection();

        // 循环整表
        var nodes = dataModel.getData();
        for (var nodeID in nodes)
        {
          if (0 == nodeID) {
            continue;
          }

          var node = nodes[nodeID];
          var row = dataModel.getRowFromNodeId(nodeID);
          var columnData = node.columnData.row;
          if (columnData.name.indexOf(result) < 0) {
            continue;
          }
          selectionModel.addSelectionInterval(row, row);
        }
      }, this, "");
    },

    /**
     * 全选
     *
     * @param e {Event} TODOC
     */
    _selectionAllCommandExecute : function(e)
    {
      if (0 == this._dataModel.getRowCount()) {
        return;
      }

      // 全选
      this._table.getSelectionModel().setSelectionInterval(0, this._dataModel.getRowCount() - 1);
    }

  },

  // 界面之外的内容释放
  destruct : function()
  {
    if (this._table.isEditing()) {
      this._table.stopEditing();
    }

    // 释放非显示层级对象
    this._dataModel.dispose();

    // 去除多余的引用
    this._table = null;
    this._dataModel = null;
    this._selectionModel = null;
    this._openEntry = null;
    this._filterConditionsSelect = null;
    this._filterConditionList = null;
  }
});
