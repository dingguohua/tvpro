
/**
 * @author Administrator
 */

/* ************************************************************************
#asset(qx/icon/${qx.icontheme}/22/actions/*)
#asset(qx/icon/${qx.icontheme}/22/categories/*)
#asset(tvproui/type/*)
************************************************************************ */
qx.Class.define("tvproui.tag.TagTable",
{
  extend : qx.ui.container.Composite,
  construct : function()
  {

    /* 网格化布局，第一行是表格，第二行是工具栏 */
    var layout = new qx.ui.layout.Grid(10, 0);
    this.base(arguments, layout);

    /* 水平方向随着窗口缩放 */
    layout.setColumnFlex(0, 1);

    /* 垂直方向，中间的表格随着窗口缩放 */
    layout.setRowFlex(0, 1);

    /* 频道数据模型初始化 */
    this._dataModel = new tvproui.tag.TagModel();

    /* 建立表格 */
    this._table = new qx.ui.table.Table(this._dataModel);
    this._table.setRowHeight(24);
    this._table.addListener("dataEdited", this._onDataEdited, this);
    this._table.setHeight(300);

    /* 配置多选模式 */
    this._selectionManager = this._table.getSelectionModel();
    this._selectionManager.setSelectionMode(qx.ui.table.selection.Model.MULTIPLE_INTERVAL_SELECTION);

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

    // 增加功能选单
    this._initContextMenu();
    this._table.setContextMenuHandler(2, this._contextMenuHandler, this);
    this._table.setContextMenuHandler(3, this._contextMenuHandler, this);
    this._table.setContextMenuHandler(4, this._contextMenuHandler, this);
    this._table.setContextMenuHandler(5, this._contextMenuHandler, this);

    /* 加载数据 */
    this.loadData();
  },
  members :
  {
    _table : null,
    _dataModel : null,
    _deleteButton : null,
    _undoButton : null,
    _redoButton : null,
    _selectionManager : null,
    _selectionAllCommand : null,
    _addEntry : null,
    _deleteEntry : null,
    _cutEntry : null,
    _copyEntry : null,
    _pasteEntry : null,

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

      /* 默认名称显示 */
      columnModel.setColumnVisible(3, true);
      columnModel.setColumnWidth(3, 140);

      /* 默认打开描述显示 */
      columnModel.setColumnVisible(4, true);
      columnModel.setColumnWidth(4, 240);

      /* 默认用户名显示 */
      columnModel.setColumnVisible(5, true);
      columnModel.setColumnWidth(5, 70);

      /* 第二列使用图像渲染器 */
      columnModel.setDataCellRenderer(2, new qx.ui.table.cellrenderer.Image(22, 22));
      columnModel.setCellEditorFactory(2, new tvproui.control.ui.table.celleditor.ImageSelector());
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
      var addButton = new qx.ui.toolbar.Button("增加", "icon/22/actions/list-add.png");
      addButton.addListener("execute", this._onAddButton, this);
      editPart.add(addButton);

      /* 加入删除按钮到编辑分段中 */
      this._deleteButton = new qx.ui.toolbar.Button("删除", "icon/22/actions/list-remove.png");
      this._deleteButton.addListener("execute", this._onDeleteButton, this);
      editPart.add(this._deleteButton);

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
      tvproui.utils.Clipper.putInto("Tag", copyDataArray);

      /* 根据选择范围来删除 */
      model.deleteItems(selections);
      model.commitTrans();

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
      tvproui.utils.Clipper.putInto("Tag", copyDataArray);
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
      var copyDatas = tvproui.utils.Clipper.getLastProperItem("Tag");
      if (null == copyDatas) {
        return;
      }

      /* 根据显示模式来处理线面的工作 */
      model.putCopyData(insertPos, copyDatas);
      model.commitTrans();
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
      var imageid = 6;
      var path = tvproui.system.fileManager.path("uploads/images/6.png");
      if (insertPos > 0)
      {
        var lastTag = model.getRowDataAsMap(insertPos - 1);
        imageid = lastTag.imageid;
        path = lastTag.path;
      }
      var ID = tvproui.utils.IDManager.getLocalTempID();

      /* 增加新的数据  */
      ID = model.addItem(
      {
        ID : ID,
        imageid : imageid,
        path : path,
        name : "新标签",
        desc : "",
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
      if (data.value == data.oldValue) {
        return;
      }
      var model = this._dataModel;
      model.updateItem(data.row, data.col, data.value, data.oldValue);
      model.commitUpdate();
      model.commitTrans();
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
      model.deleteItems(selections);
      model.commitTrans();

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


    /**
     * TODOC
     *
     */
    loadData : function()
    {

      /* 默认关闭删除，保存按钮功能 */
      this._deleteButton.setEnabled(false);

      /* 清除选区 */
      this._table.getSelectionModel().resetSelection();

      /* 数据模型 */
      var model = this._dataModel;
      model.loadData();
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
      contextMenu.add(this._addEntry);
      contextMenu.add(this._deleteEntry);
      contextMenu.add(this._cutEntry);
      contextMenu.add(this._copyEntry);
      contextMenu.add(this._pasteEntry);
      return true;
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
    this._deleteButton = null;
    this._undoButton = null;
    this._redoButton = null;
    this._selectionManager = null;
    this._selectionAllCommand = null;
    this._addEntry = null;
    this._deleteEntry = null;
    this._cutEntry = null;
    this._copyEntry = null;
    this._pasteEntry = null;
  }
});
