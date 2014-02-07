
/**
 * @author Administrator
 */

/* ************************************************************************
#asset(qx/icon/${qx.icontheme}/22/actions/*)
#asset(qx/icon/${qx.icontheme}/22/categories/*)
#asset(tvproui/type/*)
************************************************************************ */
qx.Class.define("tvproui.tag.instance.TagInstanceTable",
{
  extend : tvproui.control.ui.window.Window,
  statics :
  {
    applicationName : "标签实例管理",
    applicationIcon : "icon/22/actions/mail-send.png",
    canMultipleSupport : false
  },
  properties : {
    table : {
      init : null
    }
  },
  construct : function(tableControler)
  {

    /* 网格化布局，第一行是表格，第二行是工具栏 */
    this.base(arguments);
    var gridLayout = new qx.ui.layout.Grid(10, 0);
    this.setLayout(gridLayout);
    this.setTable(tableControler);

    /* 水平方向随着窗口缩放 */
    gridLayout.setColumnFlex(0, 1);

    /* 垂直方向，中间的表格随着窗口缩放 */
    gridLayout.setRowFlex(0, 1);

    /* 频道数据模型初始化 */
    this._dataModel = new tvproui.tag.instance.TagInstanceModel();

    /* 建立表格 */
    this._table = new qx.ui.table.Table(this._dataModel);
    this._table.setRowHeight(24);
    this._table.addListener("cellDblclick", this._beforeEdit, this);
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

    /* 加载数据 */
    this.loadData();

    //初始化拖放
    this._initDrag();
    this._initDrop();
  },
  members :
  {
    _table : null,
    _dataModel : null,
    _deleteButton : null,
    _selectionManager : null,
    _pathToID : null,
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

      /* 默认关闭标签ID显示 */
      columnModel.setColumnVisible(1, false);
      columnModel.setColumnWidth(1, 40);

      /* 默认打开图片显示 */
      columnModel.setColumnVisible(2, true);
      columnModel.setColumnWidth(2, 40);

      /* 默认打开描述显示 */
      columnModel.setColumnVisible(3, true);
      columnModel.setColumnWidth(3, 280);

      /* 默认用户名显示 */
      columnModel.setColumnVisible(4, true);
      columnModel.setColumnWidth(4, 60);

      /* 默认更新时间显示 */
      columnModel.setColumnVisible(5, false);
      columnModel.setColumnWidth(5, 150);

      /* 数据类型ID */
      columnModel.setColumnVisible(6, false);
      columnModel.setColumnWidth(6, 80);

      /* 数据ID */
      columnModel.setColumnVisible(7, false);
      columnModel.setColumnWidth(7, 80);

      /* 第二列使用图像渲染器 */
      columnModel.setDataCellRenderer(2, new qx.ui.table.cellrenderer.Image(22, 22));

      /* 使得类型可以选择编辑 */
      var tagCellEditor = new qx.ui.table.celleditor.SelectBox();
      var tags = tvproui.AjaxPort.call("tag/loadTagTypes");
      var typeNames = [];
      this._pathToID = {

      };
      for (var i = 0, l = tags.length; i < l; i++)
      {
        var tag = tags[i];
        var path = tvproui.system.fileManager.path(tag.path);
        typeNames[typeNames.length] = [tag.name, path, path];
        this._pathToID[path] = tag.ID;
      }
      tagCellEditor.setListData(typeNames);
      columnModel.setCellEditorFactory(2, tagCellEditor);
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

      // 粘贴按钮
      var pasteButton = new qx.ui.toolbar.Button("粘贴", "icon/22/actions/edit-paste.png");
      pasteButton.addListener("execute", this._onPasteButton, this);
      editPart.add(pasteButton);

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

    /* 初始化拖出 */

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
        if (table.isEditing()) {
          table.stopEditing();
        }
        e.addType("tagInstance");
        e.addAction("move");
      }, this);

      //拖动请求，准备数据格式
      table.addListener("droprequest", function(e)
      {
        var type = e.getCurrentType();
        if (type != "tagInstance")
        {
          dialog.Dialog.alert("数据类型不支持!");
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
        e.addData("tagInstance", rowDataArray);
      }, this);
    },

    // 初始化拖入

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

        /* 停止编辑行为 */
        if (table.isEditing()) {
          table.stopEditing();
        }

        // 支持material类型.
        var type = e.supportsType("tagInstance");
        if (type)
        {
          var tagInstances = e.getData("tagInstance");
          if (tagInstances.length == 0) {
            return;
          }
          this._moveInstance(tagInstances);
          return;
        }
        dialog.Dialog.error("拖放类型不支持");
      }, this);
    },


    /**
     * TODOC
     *
     * @param tagInstances {var} TODOC
     */
    _moveInstance : function(tagInstances)
    {

      /* 获取剪切板中栏目数据 */
      var model = this._dataModel;
      var focusRow = this._table.getFocusedRow();
      if ((null == focusRow) || (focusRow >= model.getRowCount())) {
        focusRow = model.getRowCount();
      } else {
        focusRow += 1;
      }
      for (var i = 0, l = tagInstances.length; i < l; i++)
      {
        var tagInstance = tagInstances[i];
        var ID = tagInstance.ID;
        model.moveItem(ID, focusRow);
        focusRow = model.getRowOfID(ID) + 1;
      }
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
      this._dataModel.deleteItems(selections);

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
     * @return {void | int} TODOC
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

      /* 获取数据类型和数据ID */
      var table = this.getTable();
      var dataType = table.tableType;
      var row = table.getFocusedRow();
      var tableModel = table.getTableModel();
      var dataID;

      // 判断焦点行是否可行
      if ((row !== 0) && (!row || row >= tableModel.getRowCount())) {
        return 0;
      }

      // 如果是EPG Table那么仅能加在第三层节点上面
      if (tableModel.getNodeIDByLevel) {
        dataID = tableModel.getNodeIDByLevel(3, row);
      } else {
        var col = table.tagIDColumn ? table.tagIDColumn : 0;
        dataID = tableModel.getValue(col, row);
        if (qx.lang.Type.isObject(dataID)) {
          dataID = dataID.nodeId;
        }
      }

      /* 根据显示模式来处理线面的工作 */
      model.putCopyData(insertPos, copyDatas, dataType, dataID);
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
     * @return {int} TODOC
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
      var tagType = 1;

      //播出
      var path = tvproui.system.fileManager.path("uploads/images/6.png");
      var dataType;
      var dataID;
      if (insertPos > 0)
      {
        var lastTag = model.getRowDataAsMap(insertPos - 1);
        tagType = lastTag.tagType;
        path = lastTag.path;
        dataType = lastTag.dataType;
        dataID = lastTag.dataID;
      } else
      {

        /* 获取数据类型和数据ID */
        var table = this.getTable();
        dataType = table.tableType;
        var row = table.getFocusedRow();
        var tableModel = table.getTableModel();

        // 判断焦点行是否可行
        if ((row !== 0) && (!row || row >= tableModel.getRowCount())) {
          return 0;
        }

        // 如果是EPG Table那么仅能加在第三层节点上面
        if (tableModel.getNodeIDByLevel) {
          dataID = tableModel.getNodeIDByLevel(3, row);
        } else {
          var col = table.tagIDColumn ? table.tagIDColumn : 0;
          dataID = tableModel.getValue(col, row);
          if (qx.lang.Type.isObject(dataID)) {
            dataID = dataID.nodeId;
          }
        }
      }
      var ID = tvproui.utils.IDManager.getLocalTempID();

      /* 增加新的数据  */
      ID = model.addItem(
      {
        ID : ID,
        tagType : tagType,
        path : path,
        tag : "",
        dataType : dataType,
        dataID : dataID,
        recordtime : tvproui.utils.Time.formatDateTime(),
        useralias : tvproui.user.LoginWindow.currentUserAlias
      }, insertPos);
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
      if (data.col == 2)
      {
        var iconCol = data.col - 1;
        var oldIconID = model.getValue(iconCol, data.row);
        var newIconID = this._pathToID[data.value];
        model.setValue(iconCol, data.row, newIconID);
        model.updateItemCols(data.row, [iconCol, data.col], [newIconID, data.value], [oldIconID, data.oldValue]);
        return;
      }
      model.updateItem(data.row, data.col, data.value, data.oldValue);
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
      var dataModel = this._dataModel;
      dataModel.deleteItems(selections);

      /* 清除选区 */
      selectionModel.resetSelection();
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
      model.loadData(this.getTable());
    },


    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    readData : function()
    {
      var model = this._dataModel;
      return model.getDataAsMapArray();
    },


    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    readTempDatas : function()
    {
      var model = this._dataModel;
      return model.getTempDatas();
    },


    /**
     * TODOC
     *
     */
    refresh : function() {
      this.loadData();
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
    _selectionAllCommandExecute : function(e)
    {
      if (0 == this._dataModel.getRowCount()) {
        return;
      }

      // 全选
      this._table.getSelectionModel().setSelectionInterval(0, this._dataModel.getRowCount() - 1);
    },


    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _beforeEdit : function(e)
    {
      var table = this._table;
      var dataModel = this._dataModel;
      var focusRow = table.getFocusedRow();
      if ((focusRow == null) || (focusRow >= dataModel.getRowCount()))
      {
        table.cancelEditing();
        return;
      }
    },


    /**
     * TODOC
     *
     */
    close : function()
    {
      if (this._table.isEditing()) {
        this._table.stopEditing();
      }
      this.base(arguments);

      // 释放所有与界面相关的内容
      this.dispose();
    }
  },

  // 界面之外的内容释放
  destruct : function()
  {

    // 释放非显示层级对象
    this._dataModel.dispose();
    this._selectionAllCommand.dispose();

    // 去除多余的引用
    this._table = null;
    this._dataModel = null;
    this._deleteButton = null;
    this._selectionManager = null;
    this._pathToID = null;
    this._selectionAllCommand = null;
  }
});
