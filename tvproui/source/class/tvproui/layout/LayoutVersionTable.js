
/**
 * @author Administrator
 */

/* ************************************************************************
#asset(qx/icon/${qx.icontheme}/22/actions/*)
#asset(qx/icon/${qx.icontheme}/22/devices/*)
#asset(qx/icon/${qx.icontheme}/22/categories/*)
#asset(tvproui/layout/*)
#asset(tvproui/*)
************************************************************************ */
qx.Class.define("tvproui.layout.LayoutVersionTable",
{
  extend : qx.ui.container.Composite,
  properties :
  {
    channelID : {
      check : "Integer"
    },
    channel : {
      check : "String"
    },
    channelICON : {
      check : "String"
    }
  },
  statics : {

    /* 一周日期名称 */
    dayNames : ["无效", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"]
  },
  construct : function(parentWindow)
  {

    /* 网格化布局，第一行是表格，第二行是工具栏 */
    var layout = new qx.ui.layout.Grid(10, 10);
    this.base(arguments, layout);
    this._parentWindow = parentWindow;

    /* 水平方向随着窗口缩放 */
    layout.setColumnFlex(0, 1);

    /* 垂直方向，中间的表格随着窗口缩放 */
    layout.setRowFlex(0, 1);

    /* 频道数据模型初始化 */
    this._dataModel = new tvproui.layout.LayoutVersionModel();

    /* 建立表格 */
    this._table = new qx.ui.treevirtual.TreeVirtual(["名称", "星期", "频道", "用户名", "更新日期", "标签"], {
      dataModel : this._dataModel
    });
    this._table.setRowHeight(24);
    this._table.addListener("dataEdited", this._onDataEdited, this);
    this._table.addListener("cellDblclick", this._beforeEdit, this);
    this._table.setHeight(300);

    /* 配置多选模式 */
    this._selectionModel = this._table.getSelectionModel();
    this._selectionModel.setSelectionMode(qx.ui.table.selection.Model.SINGLE_SELECTION);

    /* 处理选中事件 */
    this._selectionModel.addListener("changeSelection", this._onSelectionChanged, this);

    /* 配置拖拽，鼠标聚焦 */
    this._table.setDraggable(true);
    this._table.setDroppable(true);
    this._table.setFocusCellOnMouseMove(true);

    // 初始化菜单
    this._initContextMenu();

    // 增加功能选单
    this._table.setContextMenuHandler(0, this._contextMenuHandler, this);
    this._table.setContextMenuHandler(1, this._contextMenuHandler, this);
    this._table.setContextMenuHandler(2, this._contextMenuHandler, this);
    this._table.setContextMenuHandler(3, this._contextMenuHandler, this);
    this._table.setContextMenuHandler(4, this._contextMenuHandler, this);
    this._table.setContextMenuHandler(5, this._contextMenuHandler, this);

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

    /* 初始化拖出 */
    this._initDrag();

    /* 初始化放置 */
    this._initDrop();

    /* 初始化标签系统 */
    this._initTagSystem();
  },
  members :
  {
    _popUp : null,
    _indicator : null,
    _table : null,
    _dataModel : null,
    _selectionModel : null,
    _deleteButton : null,
    _parentWindow : null,
    _editPart : null,
    _addDayTableButton : null,
    _addEntry : null,
    _renameEntry : null,
    _deleteEntry : null,
    _cutEntry : null,
    _copyEntry : null,
    _pasteEntry : null,
    _exportEntry : null,


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

      //表格模式3代表layoutVersion
      this._table.tableType = 3;
      var scroller = this._table.getPaneScroller(1);
      this._indicator = scroller.getChildControl("focus-indicator");
      this._indicator.addListener("mousemove", function(e)
      {
        if (5 != this._table.getFocusedColumn())
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

      /* 星期几，渲染ID->星期几 编辑 星期几->ID */
      columnModel.setColumnVisible(1, true);
      behavior.setWidth(1, 73);

      /* 将第一列数字星期几替换为中文显示 */
      var dayNames = tvproui.layout.LayoutVersionTable.dayNames;
      var dayCellRenderer = new qx.ui.table.cellrenderer.Replace();
      dayCellRenderer.setReplaceMap(dayNames);
      columnModel.setDataCellRenderer(1, dayCellRenderer);

      /* 生成表格星期几编辑时中文到数字星期几的对应关系 */
      var dayNames2ID = [];
      for (var i = 1, l = dayNames.length; i < l; i++)
      {
        var dayName = dayNames[i];
        dayNames2ID[dayNames2ID.length] = [dayName, null, i];
      }

      /* 使得星期几可以通过选项来编辑，并且会被自动替换为相应的数字 */
      var dayCellEditor = new qx.ui.table.celleditor.SelectBox();
      dayCellEditor.setListData(dayNames2ID);
      columnModel.setCellEditorFactory(1, dayCellEditor);

      /* 默认打开频道显示 */
      columnModel.setColumnVisible(2, true);
      behavior.setWidth(2, 73);

      /* 默认打开用户显示 */
      columnModel.setColumnVisible(3, true);
      behavior.setWidth(3, 73);

      /* 默认打开更新日期显示 */
      columnModel.setColumnVisible(4, true);
      behavior.setWidth(4, 90);

      /* 默认打开标签显示 */
      columnModel.setColumnVisible(5, true);
      behavior.setWidth(5, 170);

      /* 标签列使用标签渲染器和标签编辑器 */
      columnModel.setDataCellRenderer(5, new tvproui.control.ui.table.cellrenderer.TagRender(22, 22));
      columnModel.setCellEditorFactory(5, new tvproui.control.ui.table.celleditor.TagEditor());
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

      /* 增加菜单，可以用于增加预排表或日播出计划以及修改添加方向 */
      var addMenu = new qx.ui.menu.Menu();
      var addVersionButton = new qx.ui.menu.Button("预排表版本", "icon/22/actions/format-justify-fill.png");
      var addDayTableButton = new qx.ui.menu.Button("日播出计划", "icon/22/actions/format-indent-more.png");
      this._addDayTableButton = addDayTableButton;
      addDayTableButton.setEnabled(false);
      addMenu.add(addVersionButton);
      addMenu.add(addDayTableButton);

      /* 处理增加栏目按钮事件 */
      addVersionButton.addListener("execute", this._onAddVersionButton, this);

      /* 处理添加日节目预排表按钮事件 */
      addDayTableButton.addListener("execute", this._onAddDayTableButton, this);
      var addButton = new qx.ui.toolbar.MenuButton("增加", "icon/22/actions/list-add.png", addMenu);
      actionPart.add(addButton);

      /* 加入打开按钮到编辑分段中 */
      this._openButton = new qx.ui.toolbar.Button("打开", "icon/22/actions/document-open.png");
      this._openButton.addListener("execute", this._onOpenButton, this);
      actionPart.add(this._openButton);

      /* 监听事件决定是否启用删除按钮 */
      this._table.getSelectionModel().addListener("changeSelection", this._onChangeSelection, this);

      /* 刷新按钮 */
      this._refreshButton = new qx.ui.toolbar.Button("刷新", "icon/22/actions/view-refresh.png");
      this._refreshButton.addListener("execute", this.loadData, this);
      actionPart.add(this._refreshButton);

      /* 导出按钮 */
      var exportMenu = new qx.ui.menu.Menu();
      this._exportExcelButton = new qx.ui.menu.Button("Excel", "icon/22/apps/office-spreadsheet.png");
      this._exportExcelButton.addListener("execute", this._onExportExcel, this);
      this._exportEPGButton = new qx.ui.menu.Button("编播表", "icon/22/categories/accessories.png");
      this._exportEPGButton.addListener("execute", this._onExportEPG, this);
      exportMenu.add(this._exportExcelButton);
      exportMenu.add(this._exportEPGButton);
      this._exportButton = new qx.ui.toolbar.MenuButton("导出", "icon/22/actions/go-down.png", exportMenu);
      actionPart.add(this._exportButton);

      /* 导入按钮 */

      /*
                 var importMenu = new qx.ui.menu.Menu();
                 this._importExcelButton = new com.zenesis.qx.upload.UploadToolbarButton("导入", "icon/22/actions/go-up.png");
                 this._initUpload(this._importExcelButton);


                 this._importButton = new qx.ui.toolbar.MenuButton("导入", "", importMenu);
                 actionPart.add(this._importExcelButton);
      */
      /* 工具栏的编辑分段 */
      var editPart = new qx.ui.toolbar.Part();
      this._editPart = editPart;
      toolbar.add(editPart);

      // 加入删除按钮到编辑分段中
      this._deleteButton = new qx.ui.toolbar.Button("删除", "icon/22/actions/list-remove.png");
      this._deleteButton.addListener("execute", this._onDeleteButton, this);
      editPart.add(this._deleteButton);

      /* 默认关闭删除按钮功能 */
      this._deleteButton.setEnabled(false);
      return toolbar;
    },


    /**
     * TODOC
     *
     */
    _initContextMenu : function()
    {

      /* 增加菜单，可以用于增加预排表或日播出计划以及修改添加方向 */
      var addMenu = new qx.ui.menu.Menu();
      var addVersionButton = new qx.ui.menu.Button("预排表版本", "icon/22/actions/format-justify-fill.png");
      var addDayTableButton = new qx.ui.menu.Button("日播出计划", "icon/22/actions/format-indent-more.png");
      addMenu.add(addVersionButton);
      addMenu.add(addDayTableButton);

      /* 处理增加栏目按钮事件 */
      addVersionButton.addListener("execute", this._onAddVersionButton, this);

      /* 处理添加子节目预排表按钮事件 */
      addDayTableButton.addListener("execute", this._onAddDayTableButton, this);
      var addEntry = new qx.ui.menu.Button("增加", "icon/22/actions/list-add.png", null, addMenu);
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

      // 重命名
      var renameEntry = new qx.ui.menu.Button("重命名", "icon/22/categories/accessories.png");
      renameEntry.addListener("execute", this._onRenameButton, this);
      this._renameEntry = renameEntry;

      /* 导出按钮 */
      var exportMenu = new qx.ui.menu.Menu();
      var exportExcelButton = new qx.ui.menu.Button("Excel", "icon/22/apps/office-spreadsheet.png");
      exportExcelButton.addListener("execute", this._onExportExcel, this);
      var exportEPGButton = new qx.ui.menu.Button("编播表", "icon/22/categories/accessories.png");
      exportEPGButton.addListener("execute", this._onExportEPG, this);
      exportMenu.add(exportExcelButton);
      exportMenu.add(exportEPGButton);
      this._exportEntry = new qx.ui.menu.Button("导出", "icon/22/actions/go-down.png", null, exportMenu);
    },


    /**
     * TODOC
     *
     * @param uploadButton {var} TODOC
     */
    _initUpload : function(uploadButton)
    {
      var uploader = new com.zenesis.qx.upload.UploadMgr(uploadButton, "../../controller.php/layoutVersion/importLayoutVersion");

      //addButton.addListener("execute", this._addNewUser, this);
      uploader.setAutoUpload(true);

      //uploader.setParam("subDirectory", "images");
      uploader.addListener("addFile", function(evt)
      {
        var file = evt.getData();
        var stateListenerId = file.addListener("changeState", function(evt)
        {
          var state = evt.getData();
          if (state == "uploaded")
          {
            var target = evt.getTarget();
            var fileNames = tvproui.AjaxPort.responseParse("../../controller.php/layoutVersion/importLayoutVersion", target.getResponse(), false);
            for (var i = 0, l = fileNames.length; i < l; i++) {

              //var fileName = fileNames[i];
              //file.getFilename()
              this.loadData();
            }
          }
          if (state == "uploaded" || state == "cancelled") {
            file.removeListenerById(stateListenerId);
          }
        }, this);
      }, this);
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
        e.addType("layoutVersion");
        e.addAction("move");
      }, this);

      //拖动请求，准备数据格式
      table.addListener("droprequest", function(e)
      {
        var table = this._table;
        var action = e.getCurrentAction();
        var type = e.getCurrentType();
        if (type != "layoutVersion") {
          return;
        }
        if (action != "move") {
          return;
        }
        var selections = table.getSelectionModel().getSelectedRanges();
        if (selections.length == 0) {
          return;
        }
        var model = this._dataModel;
        var copyData = model.sectionToTree(selections);

        // 增加数据
        e.addData(type, copyData);
      }, this);
    },

    /* 初始化拖放 */

    /**
     * TODOC
     *
     */
    _initDrop : function()
    {
      var table = this._table;
      table.addListener("drop", function(e)
      {
        var type = e.supportsType("layoutVersion");
        if (!type) {
          dialog.Dialog.error("拖放类型不支持");
        }
        var layoutVersions = e.getData("layoutVersion");
        this._moveLayoutVersion(layoutVersions);
      }, this);
    },

    // 添加版本

    /**
     * TODOC
     *
     * @param weekday {var} TODOC
     * @param versionName {var} TODOC
     * @param tag {var} TODOC
     * @return {var} TODOC
     */
    _addVersion : function(weekday, versionName, tag)
    {
      var model = this._dataModel;
      return model.addVersion(0, weekday, versionName, tag);
    },

    // 添加日播表

    /**
     * TODOC
     *
     * @param weekday {var} TODOC
     * @param dayTableName {var} TODOC
     * @param tag {var} TODOC
     * @return {void | var} TODOC
     */
    _addDayTable : function(weekday, dayTableName, tag)
    {

      // 获取选中的版本表节点
      var versionRow = this.getSelectedItem(2);
      var parentID;
      var position;
      var model = this._dataModel;
      if (!versionRow)
      {
        versionRow = this.getSelectedItem(1);
        if (!versionRow) {
          return;
        }
        parentID = versionRow.nodeId;
        position = versionRow.children.length;
      } else
      {
        parentID = versionRow.parentNodeId;
        var children = model.getNodeByNodeId(parentID).children;
        position = children.length;
      }
      return model.addDayTable(parentID, position, weekday, dayTableName, tag);
    },

    /* 移动处理 */

    /**
     * TODOC
     *
     * @param layoutVersions {var} TODOC
     * @return {void | boolean} TODOC
     */
    _moveLayoutVersion : function(layoutVersions)
    {
      var table = this._table;
      var model = table.getTableModel();
      var focusRow = table.getFocusedRow();
      var selectionModel = this._selectionModel;
      selectionModel.resetSelection();
      if ((null == focusRow) || (focusRow >= model.getRowCount())) {
        return;
      }

      /* 现在知道选中的目标节点，循环当前需要移动的源节点 */
      for (var i = 0, l = layoutVersions.length; i < l; i++)
      {
        var sourceItem = layoutVersions[i].item;
        var sourceID = sourceItem.nodeId;
        var sourceParentID = sourceItem.parentNodeId;
        var parentID;
        var position;
        switch (sourceItem.level)
        {

          /* 版本 将版本移动至当前版本/日预排表之后 */
          case 1:var beforeVersion = this.getLevelItem(focusRow, 1);
          if (null == beforeVersion)
          {
            dialog.Dialog.error("找不到合适的前向节点");
            continue;
          }
          var beforeVersionInfo = model.getNodeInfo(beforeVersion.ID);
          parentID = beforeVersionInfo.parentNode.nodeId == -1 ? 0 : beforeVersionInfo.parentNode.nodeId;
          position;
          if ((sourceParentID == parentID) && (layoutVersions.length == 1)) {
            position = beforeVersionInfo.position;
          } else {
            position = beforeVersionInfo.position + 1;
          }
          break;

          /* 日预排表， 目标为版本则移动至版本之首，目标为日预排表则排至日预排表之后 */
          case 2:/* 获取目标位置的前一个日预排表 */
          var beforeDayTable = this.getLevelItem(focusRow, 2);

          /* 未获取到，则查找第一个版本，并且移动到相应日预排表首部 */
          if (null == beforeDayTable)
          {
            var focusColumn = this.getLevelItem(focusRow, 1);
            if (null == focusColumn)
            {
              dialog.Dialog.error("找不到合适栏目节点进行移动");
              continue;
            }
            parentID = focusColumn.ID;
            position = 0;
          } else
          {

            /* 或得到则移动到选定目标之后 */
            var beforeDayTableInfo = model.getNodeInfo(beforeDayTable.ID);
            parentID = beforeDayTableInfo.parentNode.nodeId == -1 ? 0 : beforeDayTableInfo.parentNode.nodeId;
            if ((sourceParentID == parentID) && (layoutVersions.length == 1)) {
              position = beforeDayTableInfo.position;
            } else {
              position = beforeDayTableInfo.position + 1;
            }
          }
          break;
          default :dialog.Dialog.error("异常的周播表层次， 请联系长江龙");
          return false;
          break;
        }
        model.moveItem(sourceID, parentID, position);
        focusRow = model.getRowFromNodeId(sourceID);
        selectionModel.addSelectionInterval(focusRow, focusRow);
      }
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
      var selectedNode = dataModel.getRowData(row);
      var selectedRow = selectedNode[0].columnData.row;
      var findParentLength = selectedRow.level - level;
      if (findParentLength < 0) {
        return null;
      }

      /* 递归向父级前进 */
      for (var i = 0; i < findParentLength; i++)
      {
        var selectNode = dataModel.getNodeByNodeId(selectedRow.parentID);
        selectedRow = selectNode.columnData.row;
      }
      return selectedRow;
    },

    /* 添加节目预排版本 */

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onAddVersionButton : function(e) {
      dialog.Dialog.prompt("请输入名称", function(result)
      {
        if (!result) {
          return;
        }
        this._addVersion(1, result);
      }, this, "新节目预排版本");
    },

    /* 添加日节目预排 */

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onAddDayTableButton : function(e) {
      dialog.Dialog.prompt("请输入名称", function(result)
      {
        if (!result || (result == "")) {
          return this._addDayTable();
        }
        this._addDayTable(undefined, result);
      }, this);
    },

    /* 当按下删除按钮 */

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onDeleteButton : function(e) {
      dialog.Dialog.confirm("您真的要删除吗，不可以撤销哦?", function(result)
      {

        /* 根据选择范围来删除 */
        var selectionModel = this._table.getSelectionModel();
        var selections = selectionModel.getSelectedRanges();
        this._dataModel.deleteItems(selections);

        /* 清除选区 */
        selectionModel.resetSelection();
      }, this);
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
      var copyData = model.copyTree(selections);
      tvproui.utils.Clipper.putInto("layoutVersion", copyData);

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
      if (selections.length == 0) {
        return;
      }
      var copyData = model.copyTree(selections);
      tvproui.utils.Clipper.putInto("layoutVersion", copyData);
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

      /* 获取剪切板中栏目数据 */
      var copyDatas = tvproui.utils.Clipper.getLastProperItem("layoutVersion");
      if (null == copyDatas) {
        return;
      }
      for (var i = 0, l = copyDatas.length; i < l; i++)
      {
        var child = copyDatas[i];
        var row = child.item.columnData.row;
        switch (child.item.level)
        {
          case 1://建立版面
          var parentID = this._addVersion(row.weekday, row.name + " 副本", child.item.columnData[5]);

          //复制日表
          var children = child.children;
          if (children) {
            for (var i = 0, l = children.length; i < l; i++)
            {
              var subChild = children[i];
              this._copyDayTable(subChild, parentID, i);
            }
          }
          break;
          case 2://复制日表
          this._copyDayTable(child);
          break;
        }
      }
    },

    // 复制日表

    /**
     * TODOC
     *
     * @param child {var} TODOC
     * @param parentID {var} TODOC
     * @param position {var} TODOC
     */
    _copyDayTable : function(child, parentID, position)
    {
      var row = child.item.columnData.row;
      var newID;

      //增加新的日表
      if (!parentID) {
        newID = this._addDayTable(row.weekday, row.name, child.item.columnData[5]);
      } else {
        var model = this._dataModel;
        newID = model.addDayTable(parentID, position, row.weekday, row.name, child.item.columnData[5]);
      }

      //从旧有日预排表中读取数据
      var dayItems = tvproui.AjaxPort.call("column/loadChannelDuration", {
        "layoutversionid" : row.ID
      });
      if (!dayItems) {
        return;
      }

      //将旧数据插入新表
      for (var i = 0, l = dayItems.length; i < l; i++)
      {
        var item = dayItems[i];
        var duration = tvproui.utils.Duration.fromStartEnd(item.beginTime, item.endTime);
        item.beginTime = duration.getStartTime();
        item.endTime = duration.getEndTime();
        item.resourcetree_id = parseInt(item.resourcetree_id);
        item.layoutversionid = newID;
        item.fixed = item.fixed == 1 ? true : false;
        tvproui.column.command.AddCommand.executeServer(item);
      }
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

    // 导出为Excel周播表格式

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onExportExcel : function(e)
    {
      var item = this.getSelectedItem(1);
      if (null == item) {
        return;
      }
      qx.bom.Window.open("../../controller.php/layoutVersion/exportLayoutVersion?ID=" + item.nodeId);
    },

    // 导出为编播表

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onExportEPG : function(e)
    {
      var item = this.getSelectedItem(2);
      if (null == item) {
        return;
      }
      var row = item.columnData.row;
      tvproui.Application.desktop.loadWindow(tvproui.layout.ExportEPGWindow,
      {
        layoutVersionID : item.nodeId,
        channelID : row.channelID,
        channelName : row.channelName,
        channelICON : this.getChannelICON()
      });
    },

    // 打开日节目预排表

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onOpenButton : function(e)
    {
      var item = this.getSelectedItem(2);
      if (null == item) {
        return;
      }
      var row = item.columnData.row;
      var model = this._dataModel;
      var parent = model.getNodeByNodeId(item.parentNodeId);
      tvproui.Application.desktop.loadWindow(tvproui.column.ColumnManagement,
      {
        layoutVersionID : item.nodeId,
        channelID : row.channelID,
        name : parent.label + " > " + row.name
      });
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
      var model = this._dataModel;
      if (model.getTreeColumn() == data.col)
      {
        data.value = data.value.label;
        data.oldValue = data.oldValue.label;
      }
      if (data.value == data.oldValue) {
        return;
      }
      model.updateItem(data.row, data.col, data.value, data.oldValue);
      model.commitUpdate();
    },


    /**
     * TODOC
     *
     */
    loadData : function()
    {

      /* 停止编辑行为 */
      if (this._table.isEditing()) {
        this._table.stopEditing();
      }

      /* 默认屏蔽 */
      this.setEnabled(true);
      var result = this._loadData();
      if (result.lock)
      {
        this._editPart.setVisibility("hidden");
        this._parentWindow.setCaption("节目预排表版本查看 - " + this.getChannel() + "(" + result.alias + " 正在编辑)");
      } else
      {
        this._editPart.setVisibility("visible");
        this._parentWindow.setCaption("节目预排表版本管理  - " + this.getChannel());
      }
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
      return model.loadData(this.getChannelID(), this.getChannel());
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
      var focusRow = table.getFocusedRow();
      var focusCol = table.getFocusedColumn();
      var dataModel = this._dataModel;
      if ((null == focusRow) || (focusRow >= dataModel.getRowCount()))
      {
        table.cancelEditing();
        return;
      }
      if (focusCol == 0)
      {
        table.cancelEditing();
        this._onOpenButton();
        return;
      }
      var node = dataModel.getNodeFromRow(focusRow);
      switch (node.level)
      {
        case 1:switch (focusCol)
        {
          case 1:table.cancelEditing();
          break;
        }
        break;
      }
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
      var dataModel = this._dataModel;
      contextMenu.add(this._addEntry);
      contextMenu.add(this._renameEntry);
      if (!dataModel.getLocked())
      {
        contextMenu.add(this._deleteEntry);
        contextMenu.add(this._cutEntry);
      }
      contextMenu.add(this._copyEntry);
      contextMenu.add(this._pasteEntry);
      contextMenu.add(this._exportEntry);
      return true;
    },


    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onRenameButton : function(e)
    {
      var model = this._dataModel;
      var selectionModel = this._selectionModel;
      var selections = selectionModel.getSelectedRanges();
      var row = null;
      for (var i = 0, l = selections.length; i < l; i++)
      {
        var section = selections[i];
        row = section.maxIndex;
        break;
      }
      var node = model.getNodeFromRow(row);
      var rowData = node.columnData.row;
      dialog.Dialog.prompt("请输入名称", function(result)
      {
        if (!result) {
          return;
        }
        model.updateItem(row, 0, result, rowData.name);
        model.commitUpdate();
      }, this, rowData.name);
    },


    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onSelectionChanged : function(e)
    {

      /* 获取选中栏目层级选中节点 */
      var columnRow = this.getSelectedItem(1);

      /* 新栏目也是没有数据的 */
      if (!columnRow) {
        this._addDayTableButton.setEnabled(false);
      } else {
        this._addDayTableButton.setEnabled(true);
      }
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
    this._popUp = null;
    this._indicator = null;
    this._table = null;
    this._dataModel = null;
    this._selectionModel = null;
    this._deleteButton = null;
    this._parentWindow = null;
    this._editPart = null;
    this._addDayTableButton = null;
    this._addEntry = null;
    this._renameEntry = null;
    this._deleteEntry = null;
    this._cutEntry = null;
    this._copyEntry = null;
    this._pasteEntry = null;
    this._exportEntry = null;
  }
});
