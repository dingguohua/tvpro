
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
qx.Class.define("tvproui.epgVersion.EPGVersionTable",
{
  extend: qx.ui.container.Composite,

  construct: function(model,parentWindow)
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
    this._table = new qx.ui.treevirtual.TreeVirtual(["名称", "类型", "审核状态", "检出机器", "播出日期", "频道", "创建者", "更新时间", "标签"], {
      dataModel : this._dataModel
    });
    this._table.setRowHeight(24);
    this._table.addListener("dataEdited", this._onDataEdited, this);
    this._table.addListener("cellDblclick", this._beforeEdit, this);
    this._table.setHeight(300);

    /* 配置多选模式 */
    this._selectionModel = this._table.getSelectionModel();
    this._selectionModel.setSelectionMode(qx.ui.table.selection.Model.MULTIPLE_INTERVAL_SELECTION);
    this._selectionModel.addListener("changeSelection", this._onSelectionChanged, this);

    /* 配置拖拽，鼠标聚焦 */
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
    this._initTagSystem();

    // 启动拖出
    this._initDrag();

    // 初始化当前EPG
    this._currentEPG = {};
  },
  members :
  {
    _currentEPG: null,
    _popUp : null,
    _indicator : null,
    _table : null,
    _dataModel : null,
    _selectionModel : null,
    _columnCellRenderer : null,
    _columnCellEditor : null,
    _deleteButton : null,
    _editPart : null,
    _parentWindow : null,
    _addEntry : null,
    _renameEntry : null,
    _deleteEntry : null,
    _copyEntry : null,
    _pasteEntry : null,
    _exportEntry : null,
    _submitApprovalEntry : null,
    _versionEntry : null,

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
        e.addType("EPGVersion");
        e.addAction("move");
      }, this);

      //拖动请求，准备数据格式
      table.addListener("droprequest", function(e)
      {
        if (this._table.isEditing()) {
          this._table.stopEditing();
        }
        var table = this._table;
        var action = e.getCurrentAction();
        var type = e.getCurrentType();
        if (type != "EPGVersion") {
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
        var copyData =
        {
          icon : model.getChannelICON(),
          data : model.sectionToTree(selections)
        };

        // 增加数据
        e.addData(type, copyData);
      }, this);
    },


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

      //表格模式5代表
      this._table.tableType = 5;
      var scroller = this._table.getPaneScroller(1);
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

      /* 送审状态 */
      columnModel.setColumnVisible(2, true);
      behavior.setWidth(2, 73);

      /* 检出状态 */
      columnModel.setColumnVisible(3, true);
      behavior.setWidth(3, 100);

      /* 播出日期 */
      columnModel.setColumnVisible(4, true);
      behavior.setWidth(4, 100);

      /* 默认打开频道显示 */
      columnModel.setColumnVisible(5, true);
      behavior.setWidth(5, 73);

      /* 默认打开用户显示 */
      columnModel.setColumnVisible(6, true);
      behavior.setWidth(6, 73);

      /* 默认打开更新时间显示 */
      columnModel.setColumnVisible(7, true);
      behavior.setWidth(7, 170);

      /* 默认打开标签显示 */
      columnModel.setColumnVisible(8, true);
      behavior.setWidth(8, 170);

      columnModel.setCellEditorFactory(4, new tvproui.control.ui.table.celleditor.DateField());

      /* 标签列使用标签渲染器和标签编辑器 */
      columnModel.setDataCellRenderer(8, new tvproui.control.ui.table.cellrenderer.TagRender(22, 22));
      columnModel.setCellEditorFactory(8, new tvproui.control.ui.table.celleditor.TagEditor());
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
      var actionPart = new qx.ui.toolbar.Part();

      toolbar.add(actionPart);

      var addMenu = new qx.ui.menu.Menu();
      var addEPGButton = new qx.ui.menu.Button("日播表","tvproui/layout/version.png");
      var addCaptionsButton = new qx.ui.menu.Button("字幕表","tvproui/layout/subtitle.png");
      addMenu.add(addEPGButton);

      addEPGButton.addListener("execute", this._onAddEPGButton, this);

      /* 处理添加子表按钮事件 */
      addCaptionsButton.addListener("execute", this._onAddCaptionsButton, this);
      var addButton = new qx.ui.toolbar.MenuButton("增加", "icon/22/actions/list-add.png", addMenu);
      actionPart.add(addButton);

      var openButton = new qx.ui.toolbar.Button("打开","icon/22/actions/document-open.png");
      openButton.addListener("execute",this._onOpenButton,this);
      actionPart.add(openButton);


      var submitApprovalButton = new qx.ui.toolbar.Button("送审","icon/22/apps/utilities-log-viewer.png");
      submitApprovalButton.addListener("execute",this._onSubmitApprovalButton,this);
      actionPart.add(submitApprovalButton);

      var refreshButton = new qx.ui.toolbar.Button("刷新","icon/22/actions/view-refresh.png");
      refreshButton.addListener("execute",this.loadData,this);
      actionPart.add(refreshButton);

      var exportMenu = new qx.ui.menu.Menu();
      var exportExcelButton = new qx.ui.menu.Button("Excel","icon/22/apps/office-spreadsheet.png");
      exportExcelButton.addListener("execute",this._onExportExcel,this);
      var exportEPGButton = new qx.ui.menu.Button("日节目预排","icon/22/categories/accessories.png");
      exportEPGButton.addListener("execute",this._onExportDayColumnTable,this);
      exportMenu.add(exportExcelButton);
      exportMenu.add(exportEPGButton);
      var exportButton = new qx.ui.toolbar.MenuButton("导出","icon/22/actions/go-down.png",exportMenu);
      actionPart.add(exportButton);


      // 导入按钮
      this._importExcelButton = new com.zenesis.qx.upload.UploadToolbarButton("导入", "icon/22/actions/go-up.png");
      this._initUpload(this._importExcelButton);
      actionPart.add(this._importExcelButton);
      var versionButton = new qx.ui.toolbar.Button("版本", "tvproui/table/multipleVersion.png");
      versionButton.addListener("execute", this._onVersionButton, this);
      actionPart.add(versionButton);

      /* 工具栏的编辑分段 */
      var editPart = new qx.ui.toolbar.Part();
      toolbar.add(editPart);
      this._editPart = editPart;

      /* 加入删除按钮到编辑分段中 */
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
      var addEPGButton = new qx.ui.menu.Button("编播表", "tvproui/layout/version.png");
      addMenu.add(addEPGButton);

      /* 处理增加栏目按钮事件 */
      addEPGButton.addListener("execute", this._onAddEPGButton, this);
      var addEntry = new qx.ui.menu.Button("增加", "icon/22/actions/list-add.png", null, addMenu);
      this._addEntry = addEntry;

      // 删除按钮
      var deleteEntry = new qx.ui.menu.Button("删除", "icon/22/actions/list-remove.png");
      deleteEntry.addListener("execute", this._onDeleteButton, this);
      this._deleteEntry = deleteEntry;

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
      var exportDayColumnTableButton = new qx.ui.menu.Button("日节目预排", "icon/22/categories/accessories.png");
      exportDayColumnTableButton.addListener("execute", this._onExportDayColumnTable, this);
      exportMenu.add(exportExcelButton);
      exportMenu.add(exportDayColumnTableButton);
      this._exportEntry = new qx.ui.menu.Button("导出", "icon/22/actions/go-down.png", null, exportMenu);

      // 增加送审按钮
      this._submitApprovalEntry = new qx.ui.menu.Button("送审", "icon/22/apps/utilities-log-viewer.png");
      this._submitApprovalEntry.addListener("execute", this._onSubmitApprovalButton, this);
      this._versionEntry = new qx.ui.menu.Button("版本", "tvproui/table/multipleVersion.png");
      this._versionEntry.addListener("execute", this._onVersionButton, this);
    },


    /**
     * TODOC
     *
     * @param uploadButton {var} TODOC
     */
    _initUpload : function(uploadButton)
    {
      var uploader = new com.zenesis.qx.upload.UploadMgr(uploadButton, "../../controller.php/file/upload");
      uploader.setAutoUpload(true);
      uploader.setParam("subDirectory", "importEPGs");
      uploader.addListener("addFile", function(evt)
      {
        var file = evt.getData();
        var stateListenerId = file.addListener("changeState", function(evt)
        {
          var state = evt.getData();
          if (state == "uploaded")
          {
            var target = evt.getTarget();
            var fileNames = tvproui.AjaxPort.responseParse("../../controller.php/file/upload", target.getResponse(), false, "subDirectory=importEPGs");
            for (var i = 0, l = fileNames.length; i < l; i++)
            {
              var path = fileNames[i];
              var fileName = file.getFilename();
              this._addFileToImportWindow(fileName, path);
            }
          } else if (state == "cancelled") {
          }

          if (state == "uploaded" || state == "cancelled") {
            file.removeListenerById(stateListenerId);
          }
        }, this);
      }, this);
    },


    /**
     * TODOC
     *
     * @param fileName {var} TODOC
     * @param path {var} TODOC
     */
    _addFileToImportWindow : function(fileName, path)
    {
      var importWindow = this._importWindow;
      if (importWindow)
      {
        importWindow.addItem(fileName, path);
        return;
      }
      var model = this._dataModel;
      var configuration =
      {
        channelID : model.getChannelID(),
        channelName : model.getChannel(),
        channelICON : model.getChannelICON()
      };
      importWindow = tvproui.Application.desktop.loadWindow(tvproui.epgVersion.importer.ImportWindow, configuration);
      this._importWindow = importWindow;
      importWindow.addListener("close", function(e) {
        this._importWindow = null;
      }, this);
      importWindow.addItem(fileName, path);
    },

    // 添加编播表

    /**
     * TODOC
     *
     * @param name {var} TODOC
     * @param tag {var} TODOC
     * @return {var} TODOC
     */
    _addEPG : function(name, tag)
    {
      var model = this._dataModel;
      return model.addEPG(0, model.getBroadcastDate(), name, tag);
    },

    // 添加在线包装表格

    /**
     * TODOC
     *
     * @param name {var} TODOC
     * @param tag {var} TODOC
     * @param type {var} TODOC
     * @return {void | var} TODOC
     */
    _addWrapper : function(name, tag, type)
    {

      // 获取选中的版本表节点
      var row = this.getSelectedItem(2);
      var parentID;
      var position;
      var model = this._dataModel;
      if (!row)
      {
        row = this.getSelectedItem(1);
        if (!row) {
          return;
        }
        parentID = row.nodeId;
        position = row.children.length;
      } else
      {
        parentID = row.parentNodeId;
        var children = model.getNodeByNodeId(parentID).children;
        position = children.length;
      }
      return model.addWrapper(parentID, position, name, tag, type);
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
     * @param level {var} TODOC
     * @return {void | var} TODOC
     */
    getSelectedItems : function(level)
    {
      if ((level < 0) || (level > 3))
      {
        dialog.Dialog.error("无效的选择范围");
        return;
      }
      var selectionModel = this._selectionModel;
      var selections = selectionModel.getSelectedRanges();
      var result = [];
      for (var i = 0, l = selections.length; i < l; i++)
      {
        var section = selections[i];
        for (var m = section.minIndex, n = section.maxIndex; m <= n; m++)
        {
          var node = this.getLevelNode(m, level);
          if (!node) {
            continue;
          }
          result.push(node);
        }
      }
      return result;
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

    /* 添加节目预排版本 */

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onAddEPGButton : function(e) {
      dialog.Dialog.prompt("请输入名称", function(result)
      {
        if (!result) {
          return;
        }
        this._addEPG(result);
      }, this, "新编播表");
    },

    /* 添加日节目预排 */

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onAddCaptionsButton : function(e)
    {
      dialog.Dialog.prompt("请输入名称", function(result)
      {
        if (!result) {
          return;
        }
        this._addWrapper(result, null, "字幕表");
      }, this, "新字幕表");
      return;
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
        if (!result) {
          return;
        }

        /* 根据选择范围来删除 */
        var selectionModel = this._table.getSelectionModel();
        var selections = selectionModel.getSelectedRanges();
        this._dataModel.deleteItems(selections);

        /* 清除选区 */
        selectionModel.resetSelection();
      }, this);
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
      tvproui.utils.Clipper.putInto("EPGVersion", copyData);
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
      var copyDatas = tvproui.utils.Clipper.getLastProperItem("EPGVersion");
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
          var parentID = this._addEPG(row.name + " 副本", child.item.columnData[7]);
          tvproui.AjaxPort.call("epgVersion/copyByEPGVersionID",
          {
            "ID" : child.item.nodeId,
            "newID" : parentID
          });

          //复制子表
          var children = child.children;
          if (children) {
            for (var i = 0, l = children.length; i < l; i++)
            {
              var subChild = children[i];
              this._copySubTable(subChild, parentID, i);
            }
          }
          break;
          case 2://复制子表
          this._copySubTable(child);
          break;
        }
      }
    },

    // 复制子表, 一期尚未启用

    /**
     * TODOC
     *
     * @param child {var} TODOC
     * @param parentID {var} TODOC
     * @param position {var} TODOC
     */
    _copySubTable : function(child, parentID, position) {
    },

    // 导出为编播表

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onExportExcel : function(e)
    {
      var items = this.getSelectedItems(1);
      if ((null == items) || (items.length == 0))
      {
        dialog.Dialog.error("请选择一个或多个需要导出的编播表表格!");
        return;
      }
      for (var i = 0, l = items.length; i < l; i++)
      {
        var item = items[i];
        qx.bom.Window.open("../../controller.php/checkout/exportOfflineEPGVersion?ID=" + item.nodeId);
      }
    },

    // 导出为编播表

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onExportDayColumnTable : function(e)
    {
      var items = this.getSelectedItems(1);
      if ((null == items) || (items.length == 0))
      {
        dialog.Dialog.error("请选择一个或多个需要导出的编播表表格!");
        return;
      }
      var channelID;
      var epgVersionIDs = [];
      for (var i = 0, l = items.length; i < l; i++)
      {
        var item = items[i];
        var row = item.columnData.row;
        epgVersionIDs.push({epgVersionID: item.nodeId, subVersionID:row.subversion});
        channelID = row.channelID;
      }
      tvproui.Application.desktop.loadWindow(tvproui.epgVersion.ExportDayColumnWindow,
      {
        epgVersionIDs : epgVersionIDs,
        channelID : channelID
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
      // 判断窗口是否已经打开过，如果已经打开过直接切换至响应窗口
      var item = this.getSelectedItem(1);
      if(null == item)
      {
        return;
      }

      var EPGVersionID = item.nodeId;
      var model = this._dataModel;
      if (null == item) {
        return;
      }
      var row = item.columnData.row;
      var currentEPG = this._currentEPG;
      if (currentEPG[EPGVersionID])
      {
        currentEPG[EPGVersionID].maximize();
        return;
      }

      var readonly;
      var subversion;

      // 已送审之后，不检查checkout状态，直接只读
      if (row.status == "已送审") {
        readonly = true;
        subversion = parseInt(tvproui.AjaxPort.call("epgVersion/getLastestSubVersionByEPGVersionID",
        {
           "ID" : EPGVersionID
        }));
      }
      else
      {
        // 检查服务器checkout状态，若被其他人检出，则status = false，subversion当前版本号，检出机器ID, 检出机器名称，若未被检出或检出人是自己，则status = true，subversion当前版本号，当前机器ID, 当前机器名称
        var checkoutResult = tvproui.AjaxPort.call("epgVersion/checkoutByEPGVersionID",
        {
           "ID" : EPGVersionID
        });

        if(!checkoutResult)
        {
          dialog.Dialog.error(row.name + " 检出时出现错误!");
          return;
        }

        subversion = parseInt(checkoutResult.subversion);

        // 被检出，且检出主机不是自己
        if(!checkoutResult.status && checkoutResult.hostid != tvproui.user.LoginWindow.currentHostID)
        {
          dialog.Dialog.alert(row.name + " 已经被检出在 " + checkoutResult.hostname + " 所以，在尚未提交之前，仅能以只读模式查看!");
          readonly = true;
        }
        else
        {
          // 若已经未被检出或检出主机是自己，写模式
          readonly = false;

          // TODO修改目前表格的检出状态
        }
      }

      // 打开编辑窗口
      var configuration =
      {
        EPGVersionID : EPGVersionID,
        subVersionID: subversion,
        channelID : row.channelID,
        channelName : row.channelName,
        channelICON : model.getChannelICON(),
        broadcastdate : row.broadcastdate,
        name : row.name + " (" + row.broadcastdate + ")"
      };
      var epgWindow = null;
      if (readonly) {

        // 只读模式
        epgWindow = tvproui.Application.desktop.loadWindow(tvproui.EPG.viewTable.EPGViewWindow, configuration);
      } else {
        epgWindow = tvproui.Application.desktop.loadWindow(tvproui.EPG.editTable.EPGEditWindow, configuration);
      }
      currentEPG[item.nodeId] = epgWindow;
      epgWindow.closeListenID = epgWindow.addListenerOnce("close", function(e)
      {
        delete currentEPG[EPGVersionID];
        // 修改检出状态为未检出
        row.checkout = "未检出";
        model.setColumnData(EPGVersionID, 3, row.checkout);
        model.setData();
      }, this);

      // 修改检出状态为本机
      row.checkout = tvproui.user.LoginWindow.currentHostName;
      model.setColumnData(EPGVersionID, 3, row.checkout);
      model.setData();
    },

    /**
     * TODOC
     *
     */
    _onSubmitApprovalButton : function()
    {
      // 处理所有的选中项
      var item = this.getSelectedItem(1);
      if (null == item) {
        return;
      }

      var model = this._dataModel;
      var row = item.columnData.row;
      var name = row.type + " 《" + row.name + "》";

      // TODO 如果当前表格未提交，则要求用户提交后继续

      if (row.status == "已送审")
      {
        dialog.Dialog.error(name + "已经送审, 请您等待审核结果!");
        return;
      }
      var formData = {
        'description' :
        {
          'type' : "TextArea",
          'label' : "备注(可选)",
          'lines' : 4,
          'value' : ""
        }
      };
      dialog.Dialog.form(name + " 将被送审", formData, function(result)
      {
        if (!result)
        {
          dialog.Dialog.alert(name + " 送审被取消");
          return;
        }

        // 发送请求
        var rowID = item.nodeId;
        var serverResult = tvproui.AjaxPort.call("approvalflow/commitofflineflow",
        {
          "epgversionid" : rowID,
          "description" : result.description
        });
        if (!serverResult)
        {
          dialog.Dialog.error(name + " 无法送审，请检查文件是否已经关闭!");
          return;
        }

        // 获取审核用户
        var auditUsers = tvproui.AjaxPort.call("Message/getAuditUsers", {
          nothing : true
        });

        // 发送送审通知
        tvproui.messager.messenger.MessageModel.sendMessage(name + " (" + row.broadcastdate + ") 已经送审 " + result.description, auditUsers, "没有附件");

        // 修改已送审状态
        row.status = "已送审";
        model.setColumnData(rowID, 2, row.status);
        model.setData();
      }, this);
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
     * @return {var} TODOC
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
      var model = this._dataModel;
      if (result.lock)
      {
        this._editPart.setVisibility("hidden");
        this._parentWindow.setCaption("编播表版本查看 - " + model.getChannel() + "(" + result.alias + " 正在编辑)");
      } else
      {
        this._editPart.setVisibility("visible");
        this._parentWindow.setCaption("编播表版本管理  - " + model.getChannel());
      }
      return result;
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
      var table = this._table;
      var dataModel = this._dataModel;
      var focusRow = table.getFocusedRow();
      if ((focusRow == null) || (focusRow >= dataModel.getRowCount()))
      {
        table.cancelEditing();
        return;
      }
      var focusCol = table.getFocusedColumn();
      switch (focusCol)
      {
        case 0:table.cancelEditing();
        this._onOpenButton();
        break;
      }
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
      var selectedNode = dataModel.getRowData(row)[0];
      var rowData = selectedNode.columnData.row;
      contextMenu.add(this._addEntry);
      if (rowData.status != "已送审")
      {
        contextMenu.add(this._renameEntry);
        if (!dataModel.getLocked()) {
          contextMenu.add(this._deleteEntry);
        }
      }
      contextMenu.add(this._copyEntry);
      contextMenu.add(this._pasteEntry);
      contextMenu.add(this._exportEntry);
      if (rowData.status != "已送审") {
        contextMenu.add(this._submitApprovalEntry);
      }
      contextMenu.add(this._versionEntry);
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
    _onVersionButton : function(e)
    {
      var item = this.getSelectedItem(1);
      if (null == item) {
        return;
      }
      var model = this._dataModel;
      var row = item.columnData.row;
      var dataModel = new tvproui.epgVersion.EPGMultipleVersionModel(item.nodeId, row.channelID, row.broadcastdate);
      var epgWindow = tvproui.Application.desktop.loadWindow(tvproui.epgVersion.EPGMultipleVersionWindow,
      {
        tableName : row.name,
        tableModel : dataModel
      });
      epgWindow.set(
      {
        channelName : model.getChannel(),
        channelICON : model.getChannelICON()
      });
    },


    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onSelectionChanged : function(e)
    {

      /* 更新选中项目时长计算 */
      var model = this._dataModel;
      var selectionModel = this._table.getSelectionModel();
      var selections = selectionModel.getSelectedRanges();

      /* 获取选中栏目层级选中节点 */
      for (var i = 0, l = selections.length; i < l; i++)
      {
        var section = selections[i];
        for (var m = section.minIndex, n = section.maxIndex; m <= n; m++)
        {
          var selectedNode = model.getRowData(m)[0];
          var row = selectedNode.columnData.row;
          if (row.status == "已送审")
          {
            this._deleteButton.setEnabled(false);
            return;
          }
        }
      }
      this._deleteButton.setEnabled(e.getTarget().getSelectedCount() > 0);
    }
  },

  // 界面之外的内容释放
  destruct : function()
  {
    if (this._table.isEditing()) {
      this._table.stopEditing();
    }

    // 去除更新本窗口数据的事件监听器
    var currentEPG = this._currentEPG;
    for(var epgID in currentEPG)
    {
      var epgWindow = currentEPG[epgID];
      epgWindow.removeListenerById(epgWindow.closeListenID);
    }

    // 释放非显示层级对象
    this._dataModel.dispose();

    // 去除多余的引用
    this._currentEPG = null;
    this._popUp = null;
    this._indicator = null;
    this._table = null;
    this._dataModel = null;
    this._selectionModel = null;
    this._deleteButton = null;
    this._editPart = null;
    this._parentWindow = null;
    this._addEntry = null;
    this._renameEntry = null;
    this._deleteEntry = null;
    this._copyEntry = null;
    this._pasteEntry = null;
    this._exportEntry = null;
    this._submitApprovalEntry = null;
    this._versionEntry = null;
  }
});
