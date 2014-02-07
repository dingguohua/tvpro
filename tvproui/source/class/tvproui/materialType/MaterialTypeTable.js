
/**
 * @author Administrator
 */

/* ************************************************************************
#asset(qx/icon/${qx.icontheme}/22/actions/*)
#asset(qx/icon/${qx.icontheme}/22/categories/*)
#asset(tvproui/type/*)
************************************************************************ */
qx.Class.define("tvproui.materialType.MaterialTypeTable",
{
  extend : qx.ui.container.Composite,
  construct : function()
  {

    /* 网格化布局，第一行是表格，第二行是工具栏 */
    /*带工具栏的用grid*/
    var layout = new qx.ui.layout.Grid(10,0);
    this.base(arguments,layout);

    /* 水平方向随着窗口缩放 */
    layout.setColumnFlex(0, 1);

    /* 垂直方向，中间的表格随着窗口缩放 */
    layout.setRowFlex(0, 1);

    /* 频道数据模型初始化 */
    this._dataModel = new tvproui.materialType.MaterialTypeModel();

    /* 建立表格 */
    this._table = new qx.ui.table.Table(this._dataModel);
    this._table.setDataRowRenderer(new tvproui.materialType.DataRowRenderer());
    this._table.setRowHeight(24);
    this._table.addListener("dataEdited", this._onDataEdited, this);
    this._table.addListener("cellClick", this._switchState, this);
    this._table.setHeight(300);

    /* 配置多选模式 */
    this._selectionManager = this._table.getSelectionModel();
    this._selectionManager.setSelectionMode(qx.ui.table.selection.Model.MULTIPLE_INTERVAL_SELECTION);

    /* 配置拖拽，鼠标聚焦 */
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

    // 增加功能选单
    /*2~8列的popmenu*/
    this._initContextMenu();
    this._table.setContextMenuHandler(2,this._contextMenuHandler,this);
    this._table.setContextMenuHandler(3,this._contextMenuHandler,this);
    this._table.setContextMenuHandler(4,this._contextMenuHandler,this);
    this._table.setContextMenuHandler(5,this._contextMenuHandler,this);
    this._table.setContextMenuHandler(6,this._contextMenuHandler,this);
    this._table.setContextMenuHandler(7,this._contextMenuHandler,this);
    this._table.setContextMenuHandler(8,this._contextMenuHandler,this);


    /* 加载数据 */
    this.loadData();
  },
  members :
  {
    _table : null,
    _dataModel : null,
    _restoreButton : null,
    _undoButton : null,
    _redoButton : null,
    _selectionManager : null,
    _selectionAllCommand : null,

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

      /* 默认关闭图片ID显示 */
      columnModel.setColumnVisible(1, false);
      columnModel.setColumnWidth(1, 50);

      /* 默认打开图片显示 */
      columnModel.setColumnVisible(2, true);
      columnModel.setColumnWidth(2, 50);

      /* 默认类型显示 */
      columnModel.setColumnVisible(3, true);
      columnModel.setColumnWidth(3, 100);

      /* 默认打开背景色述显示 */
      columnModel.setColumnVisible(4, true);
      columnModel.setColumnWidth(4, 100);

      /* 默认字体大小显示 */
      columnModel.setColumnVisible(5, true);
      columnModel.setColumnWidth(5, 100);

      /* 默认字体颜色显示 */
      columnModel.setColumnVisible(6, true);
      columnModel.setColumnWidth(6, 100);

      /* 默认加粗显示 */
      columnModel.setColumnVisible(7, true);
      columnModel.setColumnWidth(7, 40);

      /* 默认斜体显示 */
      columnModel.setColumnVisible(8, true);
      columnModel.setColumnWidth(8, 40);

      /* 默认层次显示 */
      columnModel.setColumnVisible(9, true);
      columnModel.setColumnWidth(9, 60);

      /* 第二列使用图像渲染器 */
      columnModel.setDataCellRenderer(2, new qx.ui.table.cellrenderer.Image(22, 22));
      columnModel.setCellEditorFactory(2, new tvproui.control.ui.table.celleditor.ImageSelector());
      columnModel.setCellEditorFactory(4, new tvproui.control.ui.table.celleditor.ColorSelector());
      columnModel.setCellEditorFactory(6, new tvproui.control.ui.table.celleditor.ColorSelector());
      columnModel.setDataCellRenderer(7, new qx.ui.table.cellrenderer.Boolean());
      columnModel.setDataCellRenderer(8, new qx.ui.table.cellrenderer.Boolean());
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
      toolbar.add(editPart);

      /* 加入按钮到编辑分段中 */
      if (tvproui.user.LoginWindow.currentUsername == "admin")
      {
        var addButton = new qx.ui.toolbar.Button("增加", "icon/22/actions/list-add.png");
        addButton.addListener("execute", this._onAddButton, this);
        editPart.add(addButton);
      } else
      {

        /* 加入删除按钮到编辑分段中 */
        this._restoreButton = new qx.ui.toolbar.Button("复原", "icon/22/actions/list-remove.png");
        this._restoreButton.addListener("execute", this._onRestoreButton, this);
        editPart.add(this._restoreButton);
        this._restoreButton.setEnabled(false);
      }

      /* 监听事件决定是否启用删除按钮 */
      this._table.getSelectionModel().addListener("changeSelection", this._onChangeSelection, this);

      /* 工具栏的操作分段 */
      var actionPart = new qx.ui.toolbar.Part();
      toolbar.add(actionPart);

      /* 加入刷新按钮到编辑分段中 */
      var refreshButton = new qx.ui.toolbar.Button("刷新", "icon/22/actions/view-refresh.png");
      refreshButton.addListener("execute", this.loadData, this);
      actionPart.add(refreshButton);

      /* 加入撤销按钮到编辑分段中 */
      var undoCommand = new qx.ui.core.Command("Ctrl+Z");
      this._undoButton = new qx.ui.toolbar.Button("撤销", "icon/22/actions/edit-undo.png", undoCommand);
      this._undoButton.addListener("execute", this._onUndoButton, this);
      actionPart.add(this._undoButton);

      /* 监听事件决定是否启用撤销按钮 */
      this._dataModel.addListener("canUndo", this._onUndoListLengthChange, this);

      /* 监听事件决定是否启用撤销按钮 */
      this._dataModel.addListener("canRedo", this._onRedoListLengthChange, this);

      /* 加入重做按钮到编辑分段中 */
      var redoCommand = new qx.ui.core.Command("Ctrl+Y");
      this._redoButton = new qx.ui.toolbar.Button("重做", "icon/22/actions/edit-redo.png", redoCommand);
      this._redoButton.addListener("execute", this._onRedoButton, this);
      actionPart.add(this._redoButton);

      // 全选命令
      var selectionAllCommand = new qx.ui.core.Command("Ctrl+A");
      this._selectionAllCommand = selectionAllCommand;
      selectionAllCommand.addListener("execute", this._selectionAllCommandExecute, this);

      /* 默认关闭删除，保存, 撤销, 重做按钮功能 */
      this._undoButton.setEnabled(false);
      this._redoButton.setEnabled(false);
      return toolbar;
    },


    /**
     * TODOC
     *
     */
    _initContextMenu : function() {

      /* 加入按钮到编辑分段中 */
      if (tvproui.user.LoginWindow.currentUsername == "admin")
      {

        // 增加菜单
        var addEntry = new qx.ui.menu.Button("增加", "icon/22/actions/list-add.png");
        addEntry.addListener("execute", this._onAddButton, this);
        this._addEntry = addEntry;
      } else
      {

        // 删除按钮
        var restoreEntry = new qx.ui.menu.Button("删除", "icon/22/actions/list-remove.png");
        restoreEntry.addListener("execute", this._onRestoreButton, this);
        this.restoreEntry = restoreEntry;
      }
    },

    /* 当选取发生变化时处理一下 */

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onChangeSelection : function(e)
    {
      if (!this._restoreButton) {
        return;
      }
      this._restoreButton.setEnabled(e.getTarget().getSelectedCount() > 0);
    },

    /* 当按下了添加按钮 */

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onAddButton : function(e)
    {
      if (this._table.isEditing()) {
        this._table.stopEditing();
      }

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

      /* 获取最后一个节目的时间安排, 计算出新节目时间 */
      var imageID = 12;
      var path = tvproui.system.fileManager.path("uploads/images/ad.png");
      var backcolor = "#ffffff";
      var fontcolor = "#000000";
      var fontsize = 12;
      var bold = false;
      var italic = false;
      var level = 3;
      if (insertPos > 0)
      {
        var lastTag = model.getRowDataAsMap(insertPos - 1);
        imageID = lastTag.imageID;
        path = lastTag.path;
        backcolor = lastTag.backcolor;
        fontcolor = lastTag.fontcolor;
        fontsize = lastTag.fontsize;
        bold = lastTag.bold;
        italic = lastTag.italic;
        level = lastTag.level;
      }
      var ID = tvproui.utils.IDManager.getLocalTempID();

      /* 增加新的数据  */
      ID = model.addItem(
      {
        ID : ID,
        imageID : imageID,
        path : path,
        type : "新类型",
        backcolor : backcolor,
        fontcolor : fontcolor,
        fontsize : fontsize,
        bold : bold,
        italic : italic,
        level : level,
        alias : tvproui.user.LoginWindow.currentUserAlias
      }, insertPos);
      model.commitTrans();
      var insertPosAfterSort = model.getRowOfID(ID);

      /* 更改选区 ,并滚动到新增行 */
      selectionModel.setSelectionInterval(insertPosAfterSort, insertPosAfterSort);
      if (insertPos > 0)
      {
        var scroller = this._table.getPaneScroller(0);
        var height = insertPosAfterSort * this._table.getRowHeight();
        scroller.setScrollY(height, true);
      }
    },

    /* TODO:询问用户是否要自动更新后续时间表 */
    /* 编辑数据 */

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onDataEdited : function(e)
    {
      var data = e.getData();
      var model = this._dataModel;
      if (data.value == data.oldValue) {
        return;
      }
      model.updateItem(data.row, data.col, data.value, data.oldValue);
      model.commitUpdate();
      model.commitTrans();
      this._selectionManager.resetSelection();
    },

    /* 当按下删除按钮 */

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onRestoreButton : function(e)
    {

      /* 根据选择范围来删除 */
      var selectionModel = this._table.getSelectionModel();
      var selections = selectionModel.getSelectedRanges();
      var model = this._dataModel;

      // 加载默认配置
      var defaultTypes = tvproui.AjaxPort.call("materialType/load", {
        "default" : "true"
      });
      if (null == defaultTypes)
      {
        dialog.Dialog.error("对不起，加载默认素材类型时出错，该操作无法完成");
        return;
      }

      // 根据类型映射默认配置
      var defaultMap = {

      };
      for (var i = 0, l = defaultTypes.length; i < l; i++)
      {
        var row = defaultTypes[i];
        row.ID = parseInt(row.ID);
        row.imageID = parseInt(row.imageID);
        row.path = tvproui.system.fileManager.path(row.path);
        row.bold = row.bold == 1 ? true : false;
        row.italic = row.italic == 1 ? true : false;
        defaultMap[row.type] = row;
      }

      // 提交用户配置与默认配置的区别
      for (var i = 0, l = selections.length; i < l; i++)
      {
        var selection = selections[i];
        for (var row = selection.minIndex, k = selection.maxIndex; row <= k; row++)
        {
          var rowData = model.getRowDataAsMap(row);
          var defaultItem = defaultMap[rowData.type];
          model.updateItem(row, 1, defaultItem.imageID, rowData.imageID);
          model.updateItem(row, 2, defaultItem.path, rowData.path);
          model.updateItem(row, 3, defaultItem.type, rowData.type);
          model.updateItem(row, 4, defaultItem.backcolor, rowData.backcolor);
          model.updateItem(row, 5, defaultItem.fontsize, rowData.fontsize);
          model.updateItem(row, 6, defaultItem.fontcolor, rowData.fontcolor);
          model.updateItem(row, 7, defaultItem.bold, rowData.bold);
          model.updateItem(row, 8, defaultItem.italic, rowData.italic);
          model.updateItem(row, 9, defaultItem.level, rowData.level);
        }
      }

      // 提交修改过的配置
      model.commitUpdate();
      model.commitTrans();
      this._selectionManager.resetSelection();
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


    /**
     * TODOC
     *
     */
    loadData : function()
    {

      /* 默认关闭删除，保存按钮功能 */
      if (this._restoreButton) {
        this._restoreButton.setEnabled(false);
      }

      /* 清除选区 */
      this._table.getSelectionModel().resetSelection();

      /* 加载数据模型 */
      this._dataModel.loadData();
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
      this._table.getSelectionModel().setSelectionInterval(0, this._dataModel.getRowCount() - 1);
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

      /* 加入按钮到编辑分段中 */
      if (tvproui.user.LoginWindow.currentUsername == "admin") {
        contextMenu.add(this._addEntry);
      } else {
        contextMenu.add(this._deleteEntry);
      }
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
      var table = this._table;
      var focusRow = table.getFocusedRow();
      var focusCol = table.getFocusedColumn();
      if ((null == focusRow) || (focusRow >= model.getRowCount())) {
        return;
      }

      // 仅处理加粗和斜体
      if ((focusCol != 7) && (focusCol != 8)) {
        return;
      }
      var oldValue = model.getValue(focusCol, focusRow);
      model.updateItem(focusRow, focusCol, !oldValue, oldValue);

      // 提交修改过的配置
      model.commitUpdate();
      model.commitTrans();
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
    this._restoreButton = null;
    this._undoButton = null;
    this._redoButton = null;
    this._selectionManager = null;
    this._selectionAllCommand = null;
  }
});
