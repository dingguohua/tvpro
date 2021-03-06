
/**
 * @author Administrator
 */

/* ************************************************************************
#asset(qx/icon/${qx.icontheme}/22/actions/*)
#asset(qx/icon/${qx.icontheme}/22/categories/*)
#asset(tvproui/type/*)
************************************************************************ */
qx.Class.define("tvproui.EPG.materialCount.MaterialTable",
{
  extend : qx.ui.container.Composite,
  properties :
  {
    /* 截止期 */
    endTime :
    {
      nullable: false,
      check: "String"
    },

    /* 资源ID */
    resourceID :
    {
      nullable : false,
      check : "Integer"
    },

    // 类型
    type : {
      nullable : true
    }
  },
  construct : function(type)
  {
    /* 网格化布局，第一行是表格，第二行是工具栏 */
    var layout = new qx.ui.layout.Grid(10, 0);
    this.base(arguments, layout);
    if (type) {
      this.setType(type);
    }

    /* 水平方向随着窗口缩放 */
    layout.setColumnFlex(0, 1);

    /* 垂直方向，中间的表格随着窗口缩放 */
    layout.setRowFlex(0, 1);

    /* 频道数据模型初始化 */
    this._dataModel = new tvproui.EPG.materialCount.MaterialModel();

    /* 建立表格 */
    this._table = new qx.ui.table.Table(this._dataModel);
    this._table.setRowHeight(24);
    this._table.addListener("dataEdited", this._onDataEdited, this);

    /* 配置多选模式 */
    this._selectionManager = this._table.getSelectionModel();
    this._selectionManager.setSelectionMode(qx.ui.table.selection.Model.MULTIPLE_INTERVAL_SELECTION);

    /* 处理选中事件 */
    this._selectionManager.addListener("changeSelection", this._onSelectionChanged, this);

    /* 配置拖拽，鼠标聚焦 */
    this._table.setDraggable(true);
    this._table.setDroppable(true);
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

    /* 初始化拖动支持 */
    this._initDrag();
    this._initDrop();

    /* 默认屏蔽 */
    this.setEnabled(false);
  },
  members :
  {
    _popUp : null,
    _table : null,
    _dataModel : null,
    _deleteButton : null,
    _searchButton : null,
    _undoButton : null,
    _redoButton : null,
    _selectionManager : null,
    _lastLinkModel : null,
    _addEntry : null,
    _deleteEntry : null,
    _cutEntry : null,
    _copyEntry : null,
    _pasteEntry : null,
    _setEndTimeEntry: null,
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

      /* 默认打开名称显示 */
      columnModel.setColumnVisible(1, true);
      columnModel.setColumnWidth(1, 170);

      /* 默认类型显示 */
      columnModel.setColumnVisible(2, true);
      columnModel.setColumnWidth(2, 38);

      /* 默认时长显示 */
      columnModel.setColumnVisible(3, true);
      columnModel.setColumnWidth(3, 73);

      /* 默认失效隐藏  */
      columnModel.setColumnVisible(4, false);
      columnModel.setColumnWidth(4, 100);

      /* 默认引用显示 */
      columnModel.setColumnVisible(5, true);
      columnModel.setColumnWidth(5, 38);

      /* 默认编号不显示  */
      columnModel.setColumnVisible(6, false);
      columnModel.setColumnWidth(6, 73);

      /* 默认用户名显示  */
      columnModel.setColumnVisible(7, false);
      columnModel.setColumnWidth(7, 73);

      /* 默认资源ID隐藏  */
      columnModel.setColumnVisible(8, false);
      columnModel.setColumnWidth(8, 40);

      /* 使得类型可以选择编辑 */
      columnModel.setCellEditorFactory(2, tvproui.material.MaterialTable.getMaterialTypeSelector(this.getType()));

      /* 第二列使用图像渲染器 */
      columnModel.setDataCellRenderer(2, new tvproui.material.MaterialImage(22, 22));

      /* 第三列都用时间渲染器 */
      columnModel.setDataCellRenderer(3, new tvproui.control.ui.table.cellrenderer.TimeCellRender());
      columnModel.setCellEditorFactory(3, new tvproui.control.ui.table.celleditor.TimeCellEditor());
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

      /* 监听事件决定是否启用删除按钮 */
      this._table.getSelectionModel().addListener("changeSelection", this._onChangeSelection, this);

      /* 工具栏的操作分段 */
      var infoPart = new qx.ui.toolbar.Part();
      toolbar.add(infoPart);
      var searchButton = new qx.ui.toolbar.CheckBox("搜索", "tvproui/selection/byname.png");
      searchButton.addListener("execute", this._onFilterByName, this);
      this._searchButton = searchButton;
      infoPart.add(searchButton);

      // 全选命令
      var selectionAllCommand = new qx.ui.core.Command("Ctrl+A");
      this._selectionAllCommand = selectionAllCommand;
      selectionAllCommand.addListener("execute", this._selectionAllCommandExecute, this);

      /* 默认关闭删除功能 */
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

      // 增加菜单
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

      // 设置失效日期
      var setEndTimeEntry = new qx.ui.menu.Button("设置失效期", "icon/22/actions/go-last.png");
      setEndTimeEntry.addListener("execute", this._onSetEndTimeButton, this);
      this._setEndTimeEntry = setEndTimeEntry;
    },

    /* 初始化拖出 */

    /**
     * TODOC
     *
     */
    _initDrag : function()
    {
      var table = this._table;

      //描述拖出数据范围，描述操作为复制
      table.addListener("dragstart", function(e)
      {
        e.addType("material");
        e.addAction("copy");
      }, this);

      //拖动请求，准备数据格式
      table.addListener("droprequest", function(e)
      {
        var table = this._table;
        var action = e.getCurrentAction();
        var type = e.getCurrentType();
        if (type != "material") {
          return;
        }
        if (action != "copy") {
          return;
        }
        var selections = table.getSelectionModel().getSelectedRanges();
        if (selections.length == 0) {
          return;
        }
        var model = this._dataModel;
        var copyDataArray = [];
        for (var i = 0, l = selections.length; i < l; i++)
        {
          var section = selections[i];
          var minIndex = section.minIndex;
          var maxIndex = section.maxIndex;
          copyDataArray = copyDataArray.concat(model.getCopyData(minIndex, maxIndex));
        }

        // 增加数据
        e.addData(type, copyDataArray);
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
        var type = e.supportsType("material");
        if (type)
        {
          this._onDropMaterial(table, e);
          return;
        }
        dialog.Dialog.error("拖放类型不支持");
      }, this);
    },


    /**
     * 处理素材拖动
     *
     * @param table {var} TODOC
     * @param e {Event} TODOC
     */
    _onDropMaterial : function(table, e)
    {

      /* 获取剪切板中栏目数据 */
      var model = this._dataModel;
      var focusRow = table.getFocusedRow();
      if ((focusRow == null) || (focusRow >= model.getRowCount())) {
        return;
      }
      var materials = e.getData("material");
      if (null == materials) {
        return;
      }

      // 移动素材
      var selectionModel = this._selectionManager;
      selectionModel.resetSelection();
      for (var i = 0, l = materials.length; i < l; i++)
      {
        var materialID = materials[i].ID;
        model.moveItem(materialID, focusRow + 1);
        focusRow = model.getRowOfID(materialID);
        selectionModel.addSelectionInterval(focusRow, focusRow);
      }

      // 提交更新
      model.commitUpdate();

      // 提交事务
      model.commitTrans();
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
      tvproui.utils.Clipper.putInto("Material", copyDataArray);

      /* 根据选择范围来删除 */
      model.deleteItems(selections);

      // 提交事务
      model.commitTrans();

      /* 清除选区 */
      selectionModel.resetSelection();
    },


    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    getSelectionCopy : function()
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
      return copyDataArray;
    },

    /* 复制 */

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onCopyButton : function(e) {
      tvproui.utils.Clipper.putInto("Material", this.getSelectionCopy());
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

      /* 决定粘贴项目及其位置 */
      var model = this._dataModel;
      var insertPos = model.getRowCount();

      /* 获取剪切板中栏目数据 */
      var copyDatas = tvproui.utils.Clipper.getLastProperItem("Material");
      if (null == copyDatas) {
        return;
      }

      /* 根据显示模式来处理线面的工作 */
      model.putCopyData(insertPos, copyDatas);

      // 提交事务
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

      /* 更新频道渲染器以及编辑选择器数据 */
      var resourceID = this.getResourceID();

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
      var type = this.getType();
      if (!type) {
        type = "硬广告";
      }
      var duration = tvproui.utils.Time.fromOffset(60);
      var endTime = "0000-00-00"
      var materialName = "新素材";
      if (insertPos > 0)
      {
        var lastProgram = model.getRowDataAsMap(insertPos - 1);
        type = lastProgram.type;
        duration = lastProgram.duration.clone();
        materialName = lastProgram.name;
        var nameContext = materialName.match(/\-\d$/);
        if (null == nameContext) {
          materialName += "-2";
        } else {
          var head = materialName.substr(0, nameContext.index + 1);
          materialName = head + (parseInt(materialName.substr(nameContext.index + 1)) + 1);
        }
      }
      
      var ID = tvproui.utils.IDManager.getLocalTempID();

      /* 增加新的数据  */
      if (!tvproui.material.MaterialTable.checkDuplicateName(resourceID, materialName)) {
        materialName += " (重名)";
      }
      ID = model.addItem(
      {
        ID : ID,
        name : materialName,
        type : type,
        duration : duration,
        reference : 0,
        endTime : endTime,
        resourceID : resourceID,
        artId : "",
        alias : tvproui.user.LoginWindow.currentUserAlias
      }, insertPos);

      // 提交事务
      model.commitTrans();
      var insertPosAfterSort = model.getRowOfID(ID);
      if(undefined === insertPosAfterSort)
      {
        return;
      }
      
      /* 更改选区 ,并滚动到新增行 */
      selectionModel.setSelectionInterval(insertPosAfterSort, insertPosAfterSort);
      if (insertPos > 0)
      {
        var scroller = this._table.getPaneScroller(0);
        var height = insertPosAfterSort * this._table.getRowHeight();
        scroller.setScrollY(height, true);
      }
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
      switch (data.col)
      {

        // 名称验证
        case 1:var rowData = model.getRowDataAsMap(data.row);

        // 修改名称的重名验证
        if (!tvproui.material.MaterialTable.checkDuplicateName(rowData.resourceID, data.value)) {
          data.value += " (重名)";
        }
        break;

        // 时长不小屋5秒
        case 3:if (data.value.getTime() < 5)
        {
          dialog.Dialog.error("播出最小时间单位为5秒，不允许出现更短的素材!");
          model.setValue(data.col, data.row, data.oldValue);
          return;
        }
        break;
      }
      model.updateItem(data.row, data.col, data.value, data.oldValue);

      // 提交更新
      model.commitUpdate();

      // 提交事务
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

      // 提交事务
      model.commitTrans();

      /* 清除选区 */
      selectionModel.resetSelection();

      // 清除焦点
      var table = this._table;
      var rowCount = this._dataModel.getRowCount();
      if (rowCount > 0) {
        table.setFocusedCell(table.getFocusedColumn(), rowCount - 1);
      } else {
        table.setFocusedCell(null, null);
      }
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
     * @param e {Event} TODOC
     */
    _onSelectionChanged : function(e)
    {
      var selections = this._selectionManager.getSelectedRanges();
      this._table.setAdditionalStatusBarText(this._dataModel.sumDuration(selections));
    },


    /**
     * TODOC
     *
     */
    loadData : function()
    {

      /* 默认屏蔽 */
      this.setEnabled(true);

      /* 加载数据更新视图 */
      this._loadData();
    },


    /**
     * TODOC
     *
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

      // 更新数据
      model.loadData(this.getEndTime(), this.getResourceID(), this.getType());
    },


    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onMaterialChange : function(e) {
      this._calcuteReferenceCount(e.getData());
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
      contextMenu.add(this._setEndTimeEntry);
      return true;
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
    },


    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onFilterByName : function(e)
    {
      var model = this._dataModel;
      var target = e.getTarget();
      model.resetHiddenRows();
      if (target.getValue()) {
        dialog.Dialog.prompt("请输入搜索关键词", function(result)
        {
          if (!result) {
            return;
          }
          model.addNotRegex(result, "name");
          model.applyFilters();
        }, this, "");
      }
    },


    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onSetEndTimeButton : function(e)
    {
      if (this._table.isEditing()) {
        this._table.stopEditing();
      }
      var model = this._dataModel;
      var selectionModel = this._table.getSelectionModel();
      var selections = selectionModel.getSelectedRanges();
      if (!selections || !selections.length)
      {
        dialog.Dialog.error("请首先选中需要批量修改的素材!");
        return;
      }
      var rowDatas = {

      };
      for (var i = 0, l = selections.length; i < l; i++)
      {
        var section = selections[i];
        for (var j = section.minIndex; j <= section.maxIndex; j++)
        {
          var rowData = model.getRowDataAsMap(j);
          rowDatas[j] = rowData;
        }
      }
      var partEditWindow = tvproui.Application.desktop.loadWindow(tvproui.material.PartEditWindow, "失效期");
      partEditWindow.addListenerOnce("PartEdited", function(e)
      {
        var endTime = e.getData();
        var value = tvproui.utils.Time.formatDate(endTime);
        for (var row in rowDatas)
        {
          if (parseInt(row) != row) {
            continue;
          }
          var rowData = rowDatas[row];
          row = parseInt(row);
          model.updateItem(row, 4, value, rowData.endTime);
        }

        // 提交更新
        model.commitUpdate();

        // 提交事务
        model.commitTrans();

        // 刷新界面显示
        this.loadData();

        if(this._lastLinkModel)
        {
          this._calcuteReferenceCount(this._lastLinkModel.materialMap);
        }

        // 关闭窗口
        partEditWindow.close();
      }, this);
    },

    // 计算引用计数

    /**
     * TODOC
     *
     * @param dataMap {var} TODOC
     */
    _calcuteReferenceCount : function(dataMap)
    {
      var model = this._dataModel;
      for (var ID in dataMap)
      {
        var count = dataMap[ID];
        var row = model.getRowOfID(ID);
        if (null == row) {
          continue;
        }
        model.setValue(5, row, count);
      }
    },

    // 注册监听EPG表素材变更的事件

    /**
     * TODOC
     *
     * @param model {var} TODOC
     */
    link : function(model)
    {
      model.addListener("MaterialChange", this._onMaterialChange, this);
      this._calcuteReferenceCount(model.materialMap);
      this._lastLinkModel = model;
    },

    // 卸载监听EPG表素材变更的事件

    /**
     * TODOC
     *
     * @param model {var} TODOC
     */
    unlink : function(model) {
      model.removeListener("MaterialChange", this._onMaterialChange, this);
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
    this._popUp = null;
    this._table = null;
    this._dataModel = null;
    this._deleteButton = null;
    this._searchButton = null;
    this._undoButton = null;
    this._redoButton = null;
    this._selectionManager = null;
    this._lastLinkModel = null;
    this._addEntry = null;


    /*
        this._packageEntry = null;
        this._splitEntry = null;
    */
    this._deleteEntry = null;
    this._cutEntry = null;
    this._copyEntry = null;
    this._pasteEntry = null;
    this._setEndTimeEntry = null;
    this._selectionAllCommand = null;
  }
});
