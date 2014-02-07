
/**
 * @author Administrator
 */

/* ************************************************************************
#asset(qx/icon/${qx.icontheme}/22/actions/*)
#asset(qx/icon/${qx.icontheme}/22/categories/*)
#asset(tvproui/type/*)
************************************************************************ */
qx.Class.define("tvproui.epgVersion.importer.ImportTable",
{
  extend : qx.ui.container.Composite,
  construct : function(dataModel)
  {

    /* 网格化布局，第一行是表格，第二行是工具栏 */
    var layout = new qx.ui.layout.Grid(10, 0);
    this.base(arguments, layout);

    /* 水平方向随着窗口缩放 */
    layout.setColumnFlex(0, 1);

    /* 垂直方向，中间的表格随着窗口缩放 */
    layout.setRowFlex(0, 1);

    /* 频道数据模型初始化 */
    this._dataModel = dataModel;

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
    this._table.addListener("cellDblclick", this._beforeEdit, this);

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
    this._table.setContextMenuHandler(0, this._contextMenuHandler, this);
    this._table.setContextMenuHandler(1, this._contextMenuHandler, this);
    this._table.setContextMenuHandler(2, this._contextMenuHandler, this);
    this._table.setContextMenuHandler(3, this._contextMenuHandler, this);
    this._table.setContextMenuHandler(4, this._contextMenuHandler, this);
    this._table.setContextMenuHandler(5, this._contextMenuHandler, this);
  },
  members :
  {
    _table : null,
    _dataModel : null,
    _selectionManager : null,
    _selectionAllCommand : null,
    _importEntry : null,
    _openEntry : null,
    _importButton : null,

    /* 初始化 列渲染器 */

    /**
     * TODOC
     *
     * @param columnModel {var} TODOC
     */
    _initTableColumnRender : function(columnModel)
    {

      /* 默认打开文件名显示 */
      columnModel.setColumnVisible(0, true);
      columnModel.setColumnWidth(0, 150);

      /* 默认关闭路径显示 */
      columnModel.setColumnVisible(1, false);
      columnModel.setColumnWidth(1, 200);

      /* 默认打开标题显示 */
      columnModel.setColumnVisible(2, true);
      columnModel.setColumnWidth(2, 150);

      /* 默认播出日期显示 */
      columnModel.setColumnVisible(3, true);
      columnModel.setColumnWidth(3, 100);

      /* 默认打开文件格式显示 */
      columnModel.setColumnVisible(4, true);
      columnModel.setColumnWidth(4, 100);

      /* 默认关闭EPGVersionID显示 */
      columnModel.setColumnVisible(5, false);
      columnModel.setColumnWidth(5, 50);

      // 设定第三列编辑器为日期
      columnModel.setCellEditorFactory(3, new tvproui.control.ui.table.celleditor.DateField());
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
      var importButton = new qx.ui.toolbar.Button("导入", "icon/22/actions/go-up.png");
      importButton.addListener("execute", this._onImportButton, this);
      this._importButton = importButton;
      editPart.add(importButton);

      /* 加入打开按钮到编辑分段中 */
      var openButton = new qx.ui.toolbar.Button("打开", "icon/22/actions/document-open.png");
      openButton.addListener("execute", this._onOpenButton, this);
      editPart.add(openButton);

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

      // 增加菜单
      var importEntry = new qx.ui.menu.Button("导入", "icon/22/actions/go-up.png");
      importEntry.addListener("execute", this._onImportButton, this);
      this._importEntry = importEntry;

      // 删除按钮
      var openEntry = new qx.ui.menu.Button("打开", "icon/22/actions/document-open.png");
      openEntry.addListener("execute", this._onOpenButton, this);
      this._openEntry = openEntry;
    },


    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onImportButton : function(e)
    {
      if (this._table.isEditing()) {
        this._table.stopEditing();
      }
      this._importButton.setEnabled(false);

      /* 获取插入点位置 */
      var model = this._dataModel;
      model.upload();
    },

    // 打开日节目预排表

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onOpenButton : function(e)
    {
      var selectionModel = this._selectionManager;
      var selections = selectionModel.getSelectedRanges();
      var selectPos = null;
      for (var i = 0, l = selections.length; i < l; i++)
      {
        var section = selections[i];
        selectPos = section.maxIndex;
        break;
      }
      if (null === selectPos) {
        return;
      }
      var model = this._dataModel;
      var item = model.getRowDataAsMap(selectPos);
      if (-1 == item.EPGVersionID)
      {
        dialog.Dialog.alert("请先导入后再尝试打开");
        return;
      }

      var currentEPG = tvproui.epgVersion.EPGVersionTable.currentEPG;
      if (currentEPG[item.EPGVersionID])
      {
        currentEPG[item.EPGVersionID].maximize();
        return;
      }

      // 检查服务器checkout状态，若被其他人检出，则status = false，subversion当前版本号，检出机器ID, 检出机器名称，若未被检出或检出人是自己，则status = true，subversion当前版本号，当前机器ID, 当前机器名称
      var EPGVersionID = item.EPGVersionID;
      var checkoutResult = tvproui.AjaxPort.call("epgVersion/checkoutByEPGVersionID",
      {
         "ID" : EPGVersionID
      });

      if(!checkoutResult)
      {
        dialog.Dialog.error(item.title + " 检出时出现错误!");
        return;
      }

      var readonly;

      // 被检出，且检出主机不是自己
      if(!checkoutResult.status && checkoutResult.hostid != tvproui.user.LoginWindow.currentHostID)
      {
        dialog.Dialog.alert(item.title + " 已经被检出在 " + checkoutResult.hostname + " 所以，在尚未提交之前，仅能以只读模式查看!");
        readonly = true;
      }
      else
      {
        // 若已经未被检出或检出主机是自己，写模式
        readonly = false;

        // TODO修改目前表格的检出状态
      }

      // 打开编辑窗口
      var configuration =
      {
        EPGVersionID : item.EPGVersionID,
        subVersionID: parseInt(checkoutResult.subversion),
        channelID : model.getChannelID(),
        channelName : model.getChannelName(),
        channelICON : model.getChannelICON(),
        broadcastdate : item.broadcastDate,
        name : item.title + " (" + item.broadcastDate + ")"
      };
      var epgWindow = null;
      if (readonly) {

        // 只读模式
        epgWindow = tvproui.Application.desktop.loadWindow(tvproui.EPG.viewTable.EPGViewWindow, configuration);
      } else {
        epgWindow = tvproui.Application.desktop.loadWindow(tvproui.EPG.editTable.EPGEditWindow, configuration);
      }
      currentEPG[item.nodeId] = epgWindow;
      epgWindow.addListener("close", function(e) {
        delete currentEPG[item.nodeId];
      }, this);
    },


    /**
     * 用户来打开窗口
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
      if (!this._importButton.getEnabled())
      {
        table.cancelEditing();
        this._onOpenButton();
        return;
      }
      var focusCol = table.getFocusedColumn();
      switch (focusCol)
      {
        case 0:case 4:table.cancelEditing();
        this._onOpenButton();
        break;
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
      model.setValue(data.col, data.row, data.value);
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
      contextMenu.add(this._importEntry);
      contextMenu.add(this._openEntry);
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
    this._importEntry = null;
    this._openEntry = null;
    this._selectionManager = null;
    this._selectionAllCommand = null;
    this._importButton = null;
  }
});
