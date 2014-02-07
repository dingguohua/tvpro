
/**
 * @author Administrator
 */

/*************************************************************************
#asset(qx/icon/${qx.icontheme}/22/actions/*)
#asset(qx/icon/${qx.icontheme}/22/categories/*)
************************************************************************ */
qx.Class.define("tvproui.column.DurationTable",
{
  extend : qx.ui.container.Composite,
  properties :
  {

    // 日节目预排表ID
    layoutVersionID : {
      check : "Integer"
    },

    // 频道ID
    channelID : {
      check : "Integer"
    }
  },
  construct : function(layoutVersionID, channelID, durationName, parentWindow)
  {

    /* 网格化布局，第一行周选择，第二行是表格，第三行是工具栏 */
    var layout = new qx.ui.layout.Grid(10, 0);
    this.base(arguments, layout);
    this._durationName = durationName;
    this._parentWindow = parentWindow;

    /* 水平方向随着窗口缩放 */
    layout.setColumnFlex(0, 1);

    /* 垂直方向，中间的表格随着窗口缩放 */
    layout.setRowFlex(0, 1);

    /* 频道数据模型初始化 */
    this.setLayoutVersionID(layoutVersionID);
    this.setChannelID(channelID);
    this._dataModel = new tvproui.column.DurationModel();

    /* 建立表格 */
    this._table = new qx.ui.table.Table(this._dataModel);
    this._table.setRowHeight(24);
    this._table.addListener("dataEdited", this._onDataEdited, this);
    this._table.addListener("cellClick", this._switchState, this);
    this._table.setHeight(300);

    /* 配置多选模式 */
    this._selectionManager = this._table.getSelectionModel();
    this._selectionManager.setSelectionMode(qx.ui.table.selection.Model.MULTIPLE_INTERVAL_SELECTION);

    /* 处理选中事件 */
    this._selectionManager.addListener("changeSelection", this._onSelectionChanged, this);

    /* 配置拖拽，鼠标聚焦 */
    this._table.setFocusCellOnMouseMove(true);

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

    /* 初始化标签系统 */
    this._initTagSystem();

    // 初始化拖出
    this._initDrag();

    // 初始化拖入
    this._initDrop();

    // 增加功能选单
    this._initContextMenu();
    this._table.setContextMenuHandler(2, this._contextMenuHandler, this);
    this._table.setContextMenuHandler(4, this._contextMenuHandler, this);
    this._table.setContextMenuHandler(5, this._contextMenuHandler, this);
    this._table.setContextMenuHandler(6, this._contextMenuHandler, this);
    this._table.setContextMenuHandler(7, this._contextMenuHandler, this);

    // 装载数据
    this._loadData();
  },
  members :
  {
    _indicator : null,
    _popUp : null,
    _table : null,
    _dataModel : null,
    _columnCellRenderer : null,
    _columnCellEditor : null,
    _deleteButton : null,
    _checkButton : null,
    _actionMenu : null,
    _durationName : null,
    _parentWindow : null,
    _editPart : null,
    _addEntry : null,
    _deleteEntry : null,
    _cutEntry : null,
    _copyEntry : null,
    _pasteEntry : null,


    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _openPopUP : function(e)
    {
      var popup = this._popUp;
      if (!popup.loadData(this._table))
      {
        popup.hide();
        return;
      }
      popup.placeToMouse(e);
      popup.show();
    },


    /**
     * TODOC
     *
     */
    _closePopUP : function()
    {
      var popup = this._popUp;
      popup.hide();
    },

    /* 初始化标签系统 */

    /**
     * TODOC
     *
     */
    _initTagSystem : function()
    {

      //表格模式4代表Weekly
      this._table.tableType = 4;
      var scroller = this._table.getPaneScroller(0);
      this._indicator = scroller.getChildControl("focus-indicator");
      this._indicator.addListener("mousemove", function(e)
      {
        if (8 != this._table.getFocusedColumn())
        {

          /* 关闭显示 */
          this._closePopUP();
          return;
        }
        this._openPopUP(e);
      }, this);
      this._indicator.addListener("mouseout", function(e) {
        this._closePopUP();
      }, this);

      //显示标签提示窗口
      this._popUp = tvproui.tag.instance.TagInstancePopup.getInstance();
    },

    // 拖出

    /**
     * TODOC
     *
     */
    _initDrag : function()
    {
      var table = this._table;
      table.setDraggable(true);

      //描述拖出数据范围，描述操作为复制
      table.addListener("dragstart", function(e)
      {

        /* 停止编辑行为 */
        if (this._table.isEditing()) {
          this._table.stopEditing();
        }
        e.addType("ColumnDuration");
        e.addAction("move");
      }, this);

      //拖动请求，准备数据格式
      table.addListener("droprequest", function(e)
      {
        var action = e.getCurrentAction();
        var type = e.getCurrentType();
        if (type != "ColumnDuration") {
          return;
        }
        if (action != "move") {
          return;
        }
        var model = this._dataModel;

        /* 决定复制项目 */
        var selectionModel = this._table.getSelectionModel();
        var selections = selectionModel.getSelectedRanges();
        var rowDataArray = [];
        for (var i = 0, l = selections.length; i < l; i++)
        {
          var section = selections[i];
          var minIndex = section.minIndex;
          var maxIndex = section.maxIndex;
          rowDataArray = rowDataArray.concat(model.getCopyData(minIndex, maxIndex));
        }
        e.addData("ColumnDuration", rowDataArray);
      }, this);
    },

    // 拖入

    /**
     * TODOC
     *
     */
    _initDrop : function()
    {
      var table = this._table;
      table.setDroppable(true);
      table.addListener("drop", function(e)
      {

        // 锁定后不允许拖动
        var model = this._dataModel;
        if (model.getLocked()) {
          return;
        }
        var type = e.supportsType("resourceTree");
        if (type)
        {
          this._onDropResourceTreeNode(table, e);
          return;
        }
        type = e.supportsType("ColumnDuration");
        if (type)
        {
          this._onDropColumnDurationNode(table, e);
          return;
        }
        dialog.Dialog.error("拖放类型不支持");
      }, this);
    },


    /**
     * TODOC
     *
     * @param table {var} TODOC
     * @param e {Event} TODOC
     */
    _onDropColumnDurationNode : function(table, e)
    {
      var model = this._dataModel;

      /* 获取剪切板中栏目数据 */
      var focusRow = table.getFocusedRow();
      if ((focusRow == null) || (focusRow >= model.getRowCount())) {
        return;
      }
      var sections = e.getData("ColumnDuration");
      if (null == sections) {
        return;
      }
      model.cleanChanged();
      model.moveItems(sections, focusRow + 1);
      model.followFix();
      model.commitUpdate();
      model.commitTrans();
      model.check();
    },


    /**
     * TODOC
     *
     * @param table {var} TODOC
     * @param e {Event} TODOC
     */
    _onDropResourceTreeNode : function(table, e)
    {
      var count = 1;
      var focusRow = table.getFocusedRow();

      /* 获取插入点位置 */
      var model = this._dataModel;
      var rowCount = model.getRowCount();
      if (!focusRow || (focusRow >= rowCount)) {
        focusRow = rowCount - 1;
      }
      model.cleanChanged();
      var treeNodes = e.getData("resourceTree");
      for (var i = 0, l = treeNodes.getLength(); i < l; i++)
      {
        var node = treeNodes.getItem(i);
        switch (node.getType())
        {
          case "channel":var children = node.getChildren();
          for (var j = 0, len = children.getLength(); j < len; j++)
          {
            var child = children.getItem(j);
            this._addColumn(focusRow + (count++), child.getID(), child.getName());
          }
          break;
          case "column":this._addColumn(focusRow + (count++), node.getID(), node.getName());
          break;
        }
      }
      model.followFix();
      model.commitUpdate();
      model.commitTrans();
      model.check();
    },

    /* 初始化 列渲染器 */

    /**
     * TODOC
     *
     * @param columnModel {var} TODOC
     */
    _initTableColumnRender : function(columnModel)
    {

      /* 默认关闭ID显示 */
      columnModel.setColumnVisible(0, false);
      columnModel.setColumnWidth(0, 50);

      /* 默认关闭表编号显示  */
      columnModel.setColumnVisible(1, false);
      columnModel.setColumnWidth(1, 50);

      /* 默认打开起始时间显示 */
      columnModel.setColumnVisible(2, true);
      columnModel.setColumnWidth(2, 73);

      /* 默认关闭结束时间显示 */
      columnModel.setColumnVisible(3, false);
      columnModel.setColumnWidth(3, 73);

      /* 默认打开时长显示 */
      columnModel.setColumnVisible(4, true);
      columnModel.setColumnWidth(4, 73);

      /* 默认打开栏目显示 */
      columnModel.setColumnVisible(5, true);
      columnModel.setColumnWidth(5, 220);

      /* 默认打开名称显示 */
      columnModel.setColumnVisible(6, true);
      columnModel.setColumnWidth(6, 220);

      /* 默认定时显示  */
      columnModel.setColumnVisible(7, true);
      columnModel.setColumnWidth(7, 38);

      /* 默认标签显示  */
      columnModel.setColumnVisible(8, true);
      columnModel.setColumnWidth(8, 170);

      /* 留白情况默认不显示 */
      columnModel.setColumnVisible(9, false);
      columnModel.setColumnWidth(9, 38);

      /* 交叠情况默认不显示 */
      columnModel.setColumnVisible(10, false);
      columnModel.setColumnWidth(10, 38);

      // 默认不显示变更列
      columnModel.setColumnVisible(11, false);
      columnModel.setColumnWidth(11, 38);

      /* 第二三四列都用时间渲染器 */
      columnModel.setDataCellRenderer(2, new tvproui.column.TimeCellRender());
      columnModel.setCellEditorFactory(2, new tvproui.control.ui.table.celleditor.TimeCellEditor());
      columnModel.setDataCellRenderer(3, new tvproui.column.TimeCellRender());
      columnModel.setCellEditorFactory(3, new tvproui.control.ui.table.celleditor.TimeCellEditor());
      columnModel.setDataCellRenderer(4, new tvproui.control.ui.table.cellrenderer.TimeCellRender());
      columnModel.setCellEditorFactory(4, new tvproui.control.ui.table.celleditor.TimeCellEditor());

      /* 第五列：栏目， 渲染ID->栏目名称 编辑栏目名称->ID */
      /* 渲染ID->栏目名称 */
      this._columnCellRenderer = new qx.ui.table.cellrenderer.Replace();
      columnModel.setDataCellRenderer(5, this._columnCellRenderer);

      /* 避免编辑后内容对齐失常 */
      this._columnCellRenderer.setUseAutoAlign(false);

      /* 编辑栏目名称->ID */
      this._columnCellEditor = new qx.ui.table.celleditor.SelectBox();
      columnModel.setCellEditorFactory(5, this._columnCellEditor);

      // 定时
      columnModel.setDataCellRenderer(7, new qx.ui.table.cellrenderer.Boolean());
      columnModel.setCellEditorFactory(7, new qx.ui.table.celleditor.CheckBox());

      /* 标签列使用标签渲染器和标签编辑器 */
      columnModel.setDataCellRenderer(8, new tvproui.control.ui.table.cellrenderer.TagRender(22, 22));
      columnModel.setCellEditorFactory(8, new tvproui.control.ui.table.celleditor.TagEditor());

      // 变更
      columnModel.setDataCellRenderer(11, new qx.ui.table.cellrenderer.Boolean());
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

      /* 工具栏的编辑分段 */
      var editPart = new qx.ui.toolbar.Part();
      this._editPart = editPart;
      toolbar.add(editPart);

      /* 加入按钮到编辑分段中 */
      var addButton = new qx.ui.toolbar.Button("增加", "icon/22/actions/list-add.png");
      addButton.addListener("execute", this._onAddButton, this);
      editPart.add(addButton);

      /* 加入删除按钮到编辑分段中 */
      this._deleteButton = new qx.ui.toolbar.Button("删除", "icon/22/actions/list-remove.png");
      this._deleteButton.addListener("execute", this._onDeleteButton, this);
      editPart.add(this._deleteButton);

      /* 监听事件决定是否启用删除按钮 */
      this._table.getSelectionModel().addListener("changeSelection", this._onChangeSelection, this);

      /* 加入撤销按钮到编辑分段中 */
      // 全选命令
      var undoCommand = new qx.ui.core.Command("Ctrl+Z");
      this._undoButton = new qx.ui.toolbar.Button("撤销", "icon/22/actions/edit-undo.png", undoCommand);
      this._undoButton.addListener("execute", this._onUndoButton, this);
      editPart.add(this._undoButton);

      /* 监听事件决定是否启用撤销按钮 */
      this._dataModel.addListener("canUndo", this._onUndoListLengthChange, this);

      /* 监听事件决定是否启用撤销按钮 */
      this._dataModel.addListener("canRedo", this._onRedoListLengthChange, this);

      /* 加入重做按钮到编辑分段中 */
      var redoCommand = new qx.ui.core.Command("Ctrl+Y");
      this._redoButton = new qx.ui.toolbar.Button("重做", "icon/22/actions/edit-redo.png", redoCommand);
      this._redoButton.addListener("execute", this._onRedoButton, this);
      editPart.add(this._redoButton);

      /* 增加一个操作菜单 */
      var actionMenu = new qx.ui.menu.Menu();
      this._checkButton = new qx.ui.menu.Button("检查", "icon/22/actions/check-spelling.png");
      this._checkButton.addListener("execute", this._onCheckButton, this);
      actionMenu.add(this._checkButton);
      actionMenu.addSeparator();
      this._actionMenu = actionMenu;
      var dataButton = new qx.ui.toolbar.MenuButton("操作", "icon/22/categories/development.png", actionMenu);
      editPart.add(dataButton);

      /* 工具栏的操作分段 */
      var actionPart = new qx.ui.toolbar.Part();
      toolbar.add(actionPart);

      /* 加入刷新按钮到编辑分段中 */
      var refreshButton = new qx.ui.toolbar.Button("刷新", "icon/22/actions/view-refresh.png");
      refreshButton.addListener("execute", this.loadData, this);
      actionPart.add(refreshButton);

      // 全选命令
      var selectionAllCommand = new qx.ui.core.Command("Ctrl+A");
      this._selectionAllCommand = selectionAllCommand;
      selectionAllCommand.addListener("execute", this._selectionAllCommandExecute, this);

      /* 默认关闭删除，保存, 撤销, 重做按钮功能 */
      this._deleteButton.setEnabled(false);
      this._undoButton.setEnabled(false);
      this._redoButton.setEnabled(false);
      return toolbar;
    },


    /**
     * TODOC
     *
     */
    _initContextMenu : function()
    {

      // 增加菜单
      var addEntry = new qx.ui.menu.Button("增加", "icon/22/actions/list-add.png");
      addEntry.addListener("execute", this._onAddButton, this);
      this._addEntry = addEntry;

      // 删除按钮
      var deleteEntry = new qx.ui.menu.Button("删除", "icon/22/actions/list-remove.png");
      deleteEntry.addListener("execute", this._onDeleteButton, this);
      this._deleteEntry = deleteEntry;

      // 剪切按钮
      var cutEntry = new qx.ui.menu.Button("剪切", "icon/22/actions/edit-cut.png");
      cutEntry.addListener("execute", this._onCutButton, this);
      this._cutEntry = cutEntry;

      // 复制按钮
      var copyEntry = new qx.ui.menu.Button("复制", "icon/22/actions/edit-copy.png");
      copyEntry.addListener("execute", this._onCopyButton, this);
      this._copyEntry = copyEntry;

      // 粘贴按钮
      var pasteEntry = new qx.ui.menu.Button("粘贴", "icon/22/actions/edit-paste.png");
      pasteEntry.addListener("execute", this._onPasteButton, this);
      this._pasteEntry = pasteEntry;
    },

    /* 剪切 */

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onCutButton : function(e)
    {

      /* 停止编辑行为 */
      if (this._table.isEditing()) {
        this._table.stopEditing();
      }

      /* 决定复制项目 */
      var model = this._dataModel;
      var selectionModel = this._table.getSelectionModel();
      var selections = selectionModel.getSelectedRanges();
      if (selections.length == 0) {
        return;
      }
      var copyDataArray = [];
      for (var i = 0, l = selections.length; i < l; i++)
      {
        var section = selections[i];
        var minIndex = section.minIndex;
        var maxIndex = section.maxIndex;
        copyDataArray = copyDataArray.concat(model.getCopyData(minIndex, maxIndex));
      }
      tvproui.utils.Clipper.putInto("ColumnDuration", copyDataArray);

      /* 根据选择范围来删除 */
      model.cleanChanged();
      model.deleteItems(selections);
      model.followFix();
      model.commitUpdate();
      model.commitTrans();
      model.check();

      /* 清除选区 */
      selectionModel.resetSelection();
    },

    /* 复制 */

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onCopyButton : function(e)
    {

      /* 停止编辑行为 */
      if (this._table.isEditing()) {
        this._table.stopEditing();
      }

      /* 决定复制项目 */
      var model = this._dataModel;
      var selectionModel = this._table.getSelectionModel();
      var selections = selectionModel.getSelectedRanges();
      var copyDataArray;
      if (selections.length == 0)
      {
        var count = model.getRowCount();
        copyDataArray = model.getCopyData(0, count - 1);
      } else
      {
        copyDataArray = [];
        for (var i = 0, l = selections.length; i < l; i++)
        {
          var section = selections[i];
          var minIndex = section.minIndex;
          var maxIndex = section.maxIndex;
          copyDataArray = copyDataArray.concat(model.getCopyData(minIndex, maxIndex));
        }
      }
      tvproui.utils.Clipper.putInto("ColumnDuration", copyDataArray);
    },

    /* 粘贴 */

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onPasteButton : function(e)
    {

      /* 停止编辑行为 */
      if (this._table.isEditing()) {
        this._table.stopEditing();
      }

      /* 决定复制项目 */
      var model = this._dataModel;
      var insertPos = model.getRowCount();
      var selectionModel = this._table.getSelectionModel();
      var selections = selectionModel.getSelectedRanges();
      for (var i = 0, l = selections.length; i < l; i++)
      {
        var section = selections[i];
        insertPos = section.maxIndex + 1;
      }

      /* 获取剪切板中栏目数据 */
      var columnDurations = tvproui.utils.Clipper.getLastProperItem("ColumnDuration");
      if (null == columnDurations) {
        return;
      }

      // 完成粘贴
      model.cleanChanged();
      model.putCopyChannelData(insertPos, columnDurations);
      model.followFix();
      model.commitUpdate();
      model.commitTrans();
      model.check();
    },

    /* 当选取发生变化时处理一下 */

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onChangeSelection : function(e) {
      this._deleteButton.setEnabled(e.getTarget().getSelectedCount() > 0);
    },


    /**
     * TODOC
     *
     * @param insertPos {var} TODOC
     * @param columnID {var} TODOC
     * @param columnName {var} TODOC
     */
    _addColumn : function(insertPos, columnID, columnName)
    {
      if (this._table.isEditing()) {
        this._table.stopEditing();
      }

      /* 配置栏目表 */
      var columnListData = this._setColumnList();
      if (0 == columnListData.length)
      {
        dialog.Dialog.warning("请新增栏目后，再新增加栏目时段!");
        return;
      }

      /* 获取插入点位置 */
      var model = this._dataModel;

      /* 获取最后一个节目的时间安排, 计算出新节目时间 */
      var beginTime = tvproui.utils.Time.fromString("07:00:00");
      var durationTime = tvproui.utils.Time.fromString("00:30:00");
      var endTime = tvproui.utils.Time.fromString("07:30:00");
      if (insertPos > 0)
      {
        var lastProgram = model.getRowDataAsMap(insertPos - 1);
        beginTime = lastProgram.endTime.clone();
        durationTime = lastProgram.durationTime.clone();
        endTime = beginTime.add(durationTime);
        if (!columnID) {
          columnID = lastProgram.resourcetree_id;
        }
      }
      var ID = tvproui.utils.IDManager.getLocalTempID();

      /* 增加新的数据  */
      ID = model.addItem(
      {
        ID : ID,
        beginTime : beginTime,
        endTime : endTime,
        durationTime : durationTime,
        resourcetree_id : columnID,
        name : columnName,
        layoutversionid : this.getLayoutVersionID(),
        spare : "",
        intersection : "",
        changed : true,
        fixed : false
      }, insertPos);
      var insertPosAfterSort = model.getRowOfID(ID);

      /* 更改选区 ,并滚动到新增行 */
      var selectionModel = this._table.getSelectionModel();
      selectionModel.setSelectionInterval(insertPosAfterSort, insertPosAfterSort);
      if (insertPos > 0)
      {
        var scroller = this._table.getPaneScroller(0);
        var height = insertPosAfterSort * this._table.getRowHeight();
        scroller.setScrollY(height, true);
      }
    },

    /* 当按下了添加按钮 */

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onAddButton : function(e)
    {

      /* 获取插入点位置 */
      var model = this._dataModel;
      var insertPos = model.getRowCount();
      var selectionModel = this._table.getSelectionModel();
      var selections = selectionModel.getSelectedRanges();
      for (var i = 0, l = selections.length; i < l; i++)
      {
        var section = selections[i];
        insertPos = section.maxIndex + 1;
      }

      /* 配置栏目表 */
      var columnListData = this._setColumnList();
      if (0 == columnListData.length)
      {
        dialog.Dialog.warning("请新增栏目后，再新增加栏目时段!");
        return;
      }
      var defaultColumnID = columnListData[0][2];
      this._addColumn(insertPos, defaultColumnID);
      model.followFix();
      model.commitUpdate();
      model.commitTrans();
      model.check();
    },

    /* 编辑数据 */

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onDataEdited : function(e)
    {
      var data = e.getData();
      if (data.value == data.oldValue) {
        return;
      }
      var model = this._dataModel;
      model.cleanChanged();
      model.updateItem(data.row, data.col, data.value, data.oldValue);
      model.followFix();
      model.commitUpdate();
      model.commitTrans();
      model.check();
    },

    /* 当按下删除按钮 */

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onDeleteButton : function(e)
    {

      /* 根据选择范围来删除 */
      var selectionModel = this._table.getSelectionModel();
      var selections = selectionModel.getSelectedRanges();
      var model = this._dataModel;
      model.cleanChanged();
      model.deleteItems(selections);
      model.followFix();
      model.commitUpdate();
      model.commitTrans();
      model.check();

      /* 清除选区 */
      selectionModel.resetSelection();
    },

    /* 撤销列表长度变化 */

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onUndoListLengthChange : function(e)
    {
      var canUndo = e.getData();
      if (canUndo) {
        this._undoButton.setEnabled(true);
      } else {
        this._undoButton.setEnabled(false);
      }
    },

    /* 重做列表长度变化 */

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onRedoListLengthChange : function(e)
    {
      var canRedo = e.getData();
      if (canRedo) {
        this._redoButton.setEnabled(true);
      } else {
        this._redoButton.setEnabled(false);
      }
    },

    /* 撤销按钮处理 */

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onUndoButton : function(e)
    {
      if (!this._undoButton.getEnabled()) {
        return;
      }
      this._dataModel.undo();
    },

    /* 撤销按钮处理 */

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onRedoButton : function(e)
    {
      if (!this._redoButton.getEnabled()) {
        return;
      }
      this._dataModel.redo();
    },

    /* 检查按钮处理 */

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     * @return {var} TODOC
     */
    _onCheckButton : function(e)
    {
      if (this._table.isEditing()) {
        this._table.stopEditing();
      }
      var spareList = [];
      var intersectionList = [];
      this._dataModel.check(spareList, intersectionList);
      var columnModel = this._table.getTableColumnModel();
      columnModel.setColumnVisible(9, spareList.length > 0);
      columnModel.setColumnVisible(10, intersectionList.length > 0);
      return spareList.length > 0 || intersectionList.length > 0;
    },


    /**
     * TODOC
     *
     */
    loadData : function()
    {

      /* 默认屏蔽 */
      this.setEnabled(true);
      this._loadData();
    },


    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    _loadData : function()
    {
      if (this._table.isEditing()) {
        this._table.stopEditing();
      }

      /* 默认关闭删除，保存按钮功能 */
      this._deleteButton.setEnabled(false);

      /* 清除选区 */
      this._table.getSelectionModel().resetSelection();

      /* 数据模型 */
      var model = this._dataModel;

      /* 配置栏目表 */
      this._setColumnList();

      /* 根据频道ID和星期几来加载数据 */
      var result = model.loadData(this.getLayoutVersionID());
      if (result.lock) {

        //this._editPart.setVisibility("hidden");
        this._parentWindow.setCaption("日预排表查看 - " + this._durationName + "(" + result.alias + " 正在编辑)");
      } else {

        //this._editPart.setVisibility("visible");
        this._parentWindow.setCaption("日预排表编辑  - " + this._durationName);
      }
      return result;
    },

    /* 配置栏目表 */

    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    _setColumnList : function()
    {
      var IDLabelMap = {

      };
      var LabelNullIDArray = [];
      tvproui.resourceTree.Node.getColumnMapList(this.getChannelID(), IDLabelMap, LabelNullIDArray);
      this._columnCellRenderer.setReplaceMap(IDLabelMap);
      this._columnCellEditor.setListData(LabelNullIDArray);
      return LabelNullIDArray;
    },

    /* 处理选中事件 */

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onSelectionChanged : function(e)
    {
      var selections = this._selectionManager.getSelectedRanges();
      this._table.setAdditionalStatusBarText(this._dataModel.sumDuration(selections));
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
      contextMenu.add(this._addEntry);
      contextMenu.add(this._deleteEntry);
      contextMenu.add(this._cutEntry);
      contextMenu.add(this._copyEntry);
      contextMenu.add(this._pasteEntry);
      return true;
    },


    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _switchState : function(e)
    {
      var model = this._dataModel;
      if (model.getLocked()) {
        return;
      }
      var table = this._table;
      var focusRow = table.getFocusedRow();
      var focusCol = table.getFocusedColumn();
      if ((null == focusRow) || (focusRow >= model.getRowCount())) {
        return;
      }

      // Just parse fixed column
      if (focusCol != 7) {
        return;
      }
      var row = model.getRowDataAsMap(focusRow);
      model.updateItem(focusRow, focusCol, !row.fixed, row.fixed);
      model.followFix();
      model.commitUpdate();
      model.commitTrans();
      model.check();
    },

    // 全选命令

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
    this._selectionAllCommand.dispose();

    // 去除多余的引用
    this._indicator = null;
    this._popUp = null;
    this._table = null;
    this._dataModel = null;
    this._columnCellRenderer = null;
    this._columnCellEditor = null;
    this._deleteButton = null;
    this._undoButton = null;
    this._redoButton = null;
    this._checkButton = null;
    this._actionMenu = null;
    this._durationName = null;
    this._parentWindow = null;
    this._editPart = null;
    this._addEntry = null;
    this._deleteEntry = null;
    this._cutEntry = null;
    this._copyEntry = null;
    this._pasteEntry = null;
    this._selectionAllCommand = null;
  }
});
