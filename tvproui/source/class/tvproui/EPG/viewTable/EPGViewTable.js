
/**
 * @author Administrator
 */

/* ************************************************************************
#asset(qx/icon/${qx.icontheme}/22/actions/*)
#asset(qx/icon/${qx.icontheme}/22/devices/*)
#asset(qx/icon/${qx.icontheme}/22/categories/*)
#asset(tvproui/type/*)
#asset(tvproui/selection/*)
************************************************************************ */
qx.Class.define("tvproui.EPG.viewTable.EPGViewTable",
{
  extend : qx.ui.container.Composite,
  construct : function(model)
  {

    /* 网格化布局，第一行是表格，第二行是工具栏 */
    var layout = new qx.ui.layout.Grid(10, 0);
    this.base(arguments, layout);

    /* 水平方向随着窗口缩放 */
    layout.setColumnFlex(0, 1);

    /* 垂直方向，中间的表格随着窗口缩放 */
    layout.setRowFlex(0, 1);

    /* 频道数据模型初始化 */
    this._dataModel = model;

    /* 建立表格 */
    this._table = new tvproui.control.ui.spanTable.spanTable(model);
    this._table.setRowHeight(24);
    this._table.addListener("cellDblclick", this._beforeEdit, this);

    /* 配置多选模式 */
    this._selectionModel = this._table.getSelectionModel();
    this._selectionModel.setSelectionMode(qx.ui.table.selection.Model.MULTIPLE_INTERVAL_SELECTION);

    /* 处理选中事件 */
    this._selectionModel.addListener("changeSelection", this._onSelectionChanged, this);

    /* 配置鼠标聚焦 */
    this._table.setFocusCellOnMouseMove(true);

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
    this._table.setContextMenuHandler(8, this._contextMenuHandler, this);

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

    // 初始化提示信息
    this._initToolTip();
  },
  members :
  {
    _tooltip: null,
    _table : null,
    _dataModel : null,
    _selectionModel : null,
    _actionPart : null,
    _selectionAllCommand : null,
    _toolbar: null,
    _lastTipPos: null,

    // 初始化提示
    _initToolTip: function()
    {
      var table = this._table;
      var tooltip = new qx.ui.tooltip.ToolTip(""); 
      this._tooltip = tooltip;
      table.addListener("mousemove", this._showTooltip, this); 
      table.addListener("mouseout", function(e) { 
        this._tooltip.hide(); 
      }, this); 
    },

    // 显示鼠标提示
    _showTooltip: function(e) 
    { 
      var table = this._table;
      var row = table.getFocusedRow();
      var col = table.getFocusedColumn();
      var tooltip = this._tooltip;

      if (row < 0) { 
        tooltip.hide(); 
        return;
      }

      switch(col)
      {
        //栏目名称
        case 1:
        //时段名称
        case 2:
        //时段时长
        case 6:
          break;
        case 8:
        //素材类型
          break;
        default:
          tooltip.hide(); 
          return;
          break;
      }

      var tipPos = row + "_" + col;
      if(tipPos == this._lastTipPos)
      {
        tooltip.placeToMouse(e); 
        tooltip.show(); 
        return;
      }
      this._lastTipPos = tipPos;

      var model = this._dataModel;
      var node = model.getNodeByRowColumn(col, row);
      
      if(!node || !node.columnData)
      {
        tooltip.hide(); 
        return;
      }

      var message = null;
      
      switch(col)
      {
        //栏目名称
        case 1:
        //时段名称
        case 2:
        //时段时长
        case 6:
          message = node.columnData.name;
          break;
        case 8:
        //素材类型
          message = node.columnData.type;
          break;
      }

      tooltip.placeToMouse(e); 
      tooltip.setLabel(message); 
      tooltip.show(); 
    },

    /* 初始化 列渲染器 */

    /**
     * TODOC
     *
     * @param columnModel {var} TODOC
     */
    _initTableColumnRender : function(columnModel)
    {
      var defaultStyle =
      {
        "background-color" : "#cccccc",
        "color" : "#000000"
      };

      /* 默认打开序号显示 */
      columnModel.setColumnVisible(0, true);
      columnModel.setColumnWidth(0, 38);
      columnModel.setOverWriteStyle(0, defaultStyle);

      /* 默认打开栏目名称显示 */
      columnModel.setColumnVisible(1, true);
      columnModel.setColumnWidth(1, 115);
      columnModel.setOverWriteStyle(1, defaultStyle);

      /* 默认时段名称显示 */
      columnModel.setColumnVisible(2, true);
      columnModel.setColumnWidth(2, 93);
      columnModel.setOverWriteStyle(2, defaultStyle);

      /* 默认时段时长时间显示 */
      columnModel.setColumnVisible(3, true);
      columnModel.setColumnWidth(3, 77);
      columnModel.setOverWriteStyle(3, defaultStyle);

      /* 默认定时显示 */
      columnModel.setColumnVisible(4, true);
      columnModel.setColumnWidth(4, 38);
      columnModel.setOverWriteStyle(4, defaultStyle);

      /* 默认播出时间显示 */
      columnModel.setColumnVisible(5, true);
      columnModel.setColumnWidth(5, 93);
      columnModel.setOverWriteStyle(5, defaultStyle);

      /* 默认节目名称显示 */
      columnModel.setColumnVisible(6, true);
      columnModel.setColumnWidth(6, 365);

      /* 默认节目时长显示  */
      columnModel.setColumnVisible(7, true);
      columnModel.setColumnWidth(7, 77);

      /* 默认类型显示  */
      columnModel.setColumnVisible(8, true);
      columnModel.setColumnWidth(8, 38);

      /* 时段时长，播出时间，节目时长 */
      columnModel.setDataCellRenderer(3, new tvproui.EPG.viewTable.TimeCellRender());
      columnModel.setDataCellRenderer(5, new tvproui.EPG.viewTable.TimeCellRender());
      columnModel.setDataCellRenderer(7, new tvproui.EPG.viewTable.TimeCellRender());

      // 定时
      columnModel.setDataCellRenderer(4, new tvproui.control.ui.spanTable.cellrenderer.Boolean());

      /* 类型列使用图像渲染器，可以选择编辑 */
      columnModel.setDataCellRenderer(8, new tvproui.EPG.viewTable.MaterialImage(22, 22));
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
      this._toolbar = toolbar;

      /* 工具栏的操作分段 */
      var actionPart = new qx.ui.toolbar.Part();
      this._actionPart = actionPart;
      toolbar.add(actionPart);

      // 选区实现
      var selectionMenu = new qx.ui.menu.Menu();
      var selectionAllButton = new qx.ui.menu.Button("全选", "tvproui/selection/all.png");
      var selecttionReverseButton = new qx.ui.menu.Button("反选", "tvproui/selection/reverse.png");
      var selectionByTypeButton = new qx.ui.menu.Button("按类型", "tvproui/selection/bytype.png");
      var selectionByMaterialButton = new qx.ui.menu.Button("按引用", "tvproui/selection/byreference.png");
      var selectionByNameButton = new qx.ui.menu.Button("按名称", "tvproui/selection/byname.png");
      selectionMenu.add(selectionAllButton);
      selectionMenu.add(selecttionReverseButton);
      selectionMenu.add(selectionByTypeButton);
      selectionMenu.add(selectionByMaterialButton);
      selectionMenu.add(selectionByNameButton);
      selectionAllButton.addListener("execute", this._selectionAllCommandExecute, this);
      selecttionReverseButton.addListener("execute", this._selectionReverseButton, this);
      selectionByTypeButton.addListener("execute", this._onSelectionByTypeButton, this);
      selectionByMaterialButton.addListener("execute", this._onSelectionByMaterialButton, this);
      selectionByNameButton.addListener("execute", this._onSelectionByNameButton, this);
      var selectionButton = new qx.ui.toolbar.MenuButton("选择", "tvproui/selection/selection.png", selectionMenu);
      actionPart.add(selectionButton);

      // 全选命令
      var selectionAllCommand = new qx.ui.core.Command("Ctrl+A");
      this._selectionAllCommand = selectionAllCommand;
      selectionAllCommand.addListener("execute", this._selectionAllCommandExecute, this);
      return toolbar;
    },


    /**
     * TODOC
     *
     */
    _initContextMenu : function()
    {

      // 选区实现
      var selectionMenu = new qx.ui.menu.Menu();
      var selectionAllButton = new qx.ui.menu.Button("全选", "tvproui/selection/all.png");
      var selectionByTypeButton = new qx.ui.menu.Button("按类型", "tvproui/selection/bytype.png");
      var selectionByMaterialButton = new qx.ui.menu.Button("按引用", "tvproui/selection/byreference.png");
      var selectionByNameButton = new qx.ui.menu.Button("按名称", "tvproui/selection/byname.png");
      selectionMenu.add(selectionAllButton);
      selectionMenu.add(selectionByTypeButton);
      selectionMenu.add(selectionByMaterialButton);
      selectionMenu.add(selectionByNameButton);
      selectionAllButton.addListener("execute", this._selectionAllCommandExecute, this);
      selectionByTypeButton.addListener("execute", this._onSelectionByTypeButton, this);
      selectionByMaterialButton.addListener("execute", this._onSelectionByMaterialButton, this);
      selectionByNameButton.addListener("execute", this._onSelectionByNameButton, this);
      var selectionEntry = new qx.ui.menu.Button("选择", "tvproui/selection/selection.png", null, selectionMenu);
      this._selectionEntry = selectionEntry;
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
      if (!selections || selections.length == 0) {
        return;
      }
      var selectPos = null;
      for (var i = 0, l = selections.length; i < l; i++)
      {
        var section = selections[i];
        selectPos = section.maxIndex;
        break;
      }
      var dataModel = this._dataModel;
      return dataModel.getNodeByLevel(level, selectPos);
    },


    /**
     * TODOC
     *
     * @param row {var} TODOC
     * @param level {var} TODOC
     * @return {null | var} TODOC
     */
    getLevelItem : function(row, level)
    {

      /* 未有任何选中项 */
      if (null == row) {
        return null;
      }
      var dataModel = this._dataModel;
      if (row >= dataModel.getRowCount()) {
        return null;
      }

      var selectNode = dataModel.getNodeByLevel(level, row);

      // 未插入的节点
      if (null == selectNode) {
        return null;
      }
      var findParentLength = selectNode.level - level;
      if (findParentLength < 0) {
        return null;
      }

      /* 递归向父级前进 */
      for (var i = 0; i < findParentLength; i++)
      {
        if (null == selectNode) {
          return null;
        }
        selectNode = dataModel.getNodeByNodeId(selectNode.parentID);
      }
      return selectNode;
    },


    /**
     * TODOC
     *
     * @param ID {var} TODOC
     * @param level {var} TODOC
     * @return {null | var} TODOC
     */
    getLevelItemByID : function(ID, level)
    {

      /* 未有任何选中项 */
      if (null == ID) {
        return null;
      }
      var dataModel = this._dataModel;
      var selectNode = dataModel.getNodeByNodeId(ID);
      var findParentLength = selectNode.level - level;
      if (findParentLength < 0) {
        return null;
      }

      /* 递归向父级前进 */
      for (var i = 0; i < findParentLength; i++)
      {
        if (null == selectNode) {
          return null;
        }

        selectNode = dataModel.getNodeByNodeId(selectNode.parentID);
      }
      return selectNode;
    },

    /* 根据选中目标加载素材 */

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onSelectionChanged : function(e)
    {

      /* 更新选中项目时长计算 */
      var selectionModel = this._table.getSelectionModel();
      var selections = selectionModel.getSelectedRanges();
      this._table.setAdditionalStatusBarText(this._dataModel.sumItems(selections));
    },


    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    loadData : function()
    {
      if (this._table.isEditing()) {
        this._table.stopEditing();
      }

      /* 清除选区 */
      this._table.getSelectionModel().resetSelection();

      /* 数据模型 */
      var model = this._dataModel;
      return model.loadData();
    },

    // 菜单处理

    /**
     * TODOC
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
      contextMenu.add(this._selectionEntry);
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
        var level = selection.level;
        for (var j = selection.minIndex, k = selection.maxIndex; j <= k; j++)
        {
          var selectNode = dataModel.getNodeByLevel(level, j);
          nodeMap[selectNode.nodeID] = true;
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
        var node = nodes[nodeID];
        if (nodeMap[node.nodeID]) {
          continue;
        }

        var level = node.level;
        var row = node.row;
        selectionModel.addSelectionInterval(row, row, level, level);
      }
    },

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onSelectionByTypeButton : function(e)
    {
      var dataModel = this._dataModel;
      var selectionModel = this._table.getSelectionModel();
      var typeMap = {

      };
      var count = 0;

      // 获得当前选中的素材
      var selections = selectionModel.getSelectedRanges();
      for (var i = 0, l = selections.length; i < l; i++)
      {
        var selection = selections[i];
        var level = selection.level;
        for (var j = selection.minIndex, k = selection.maxIndex; j <= k; j++)
        {
          var selectNode = dataModel.getNodeByLevel(level, j);
          var row = selectNode.columnData;
          typeMap[row.type] = true;
          count++;
        }
      }
      if (count == 0)
      {
        dialog.Dialog.error("请先选择一行，我们将据此为您选择其他同类行!");
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
        var level = node.level;
        var row = node.row;
        var columnData = node.columnData;
        if (!typeMap[columnData.type]) {
          continue;
        }
        selectionModel.addSelectionInterval(row, row, level, level);
      }
    },


    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onSelectionByMaterialButton : function(e)
    {
      var dataModel = this._dataModel;
      var selectionModel = this._table.getSelectionModel();
      var typeMap = {

      };
      var count = 0;

      // 获得当前选中的素材
      var selections = selectionModel.getSelectedRanges();
      for (var i = 0, l = selections.length; i < l; i++)
      {
        var selection = selections[i];
        var level = selection.level;
        for (var j = selection.minIndex, k = selection.maxIndex; j <= k; j++)
        {
          var selectNode = dataModel.getNodeByLevel(level, j);
          var columnData = selectNode.columnData;
          typeMap[columnData.IDMaterial] = true;
          count++;
        }
      }
      if (count == 0)
      {
        dialog.Dialog.error("请先选择一行，我们将据此为您选择其他相关行!");
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
        var level = node.level;
        var row = node.row;
        var columnData = node.columnData;
        if (!typeMap[columnData.IDMaterial]) {
          continue;
        }
        selectionModel.addSelectionInterval(row, row, level, level);
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
          var level = node.level;
          var row = node.row;
          var columnData = node.columnData;
          if (columnData.name.indexOf(result) < 0) {
            continue;
          }
          selectionModel.addSelectionInterval(row, row, level, level);
        }
      }, this, "");
    },

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _selectionAllCommandExecute : function(e)
    {
      if (0 == this._dataModel.getRowCount()) {
        return;
      }

      // 全选
      this._table.getSelectionModel().setSelectionInterval(0, this._dataModel.getRowCount() - 1, 1, 3);
    },

    // 编辑之前的判断

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _beforeEdit : function(e)
    {
      var table = this._table;
      table.cancelEditing();
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
    this._selectionAllCommand.dispose();

    // 去除多余的引用
    this._table = null;
    this._dataModel = null;
    this._selectionModel = null;
    this._actionPart = null;
    this._selectionAllCommand = null;
    this._tooltip = null;
    this._toolbar = null;
  }
});
