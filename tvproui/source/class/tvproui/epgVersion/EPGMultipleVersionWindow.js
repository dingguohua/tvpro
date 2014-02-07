
/**
 * @author Administrator
 */

/* ************************************************************************
#asset(tvproui/table/*)
************************************************************************ */
qx.Class.define("tvproui.epgVersion.EPGMultipleVersionWindow",
{
  extend: tvproui.control.ui.window.Window,
  statics:
  {
    applicationName: "多版本查看",
    applicationIcon: "tvproui/table/multipleVersion.png",
    canMultipleSupport: true
  },

  properties:
  {
    channelName:{
      check : "String"
    },
    channelICON :{
      check : "String"
    }
  },
  construct : function(data)
  {
    this._tableName = data.tableName;
    this.base(arguments, "多版本查看  - " + data.tableName);

    /* 网格化布局，第一行是表格，第二行是工具栏 */
    var gridLayout = new qx.ui.layout.Grid(10, 0);
    this.setLayout(gridLayout);

    gridLayout.setColumnFlex(0,1);

    gridLayout.setRowFlex(0,1);

    this._dataModel = data.tableModel;

    this._table = new qx.ui.table.Table(this._dataModel);
    this._table.setRowHeight(24);
    this.setHeight(300);
    this._table.addListener("cellDblclick",this._beforeEdit,this);

    this._selectionManager = this._table.getSelectionModel();
    this._selectionManager.setSelectionMode(qx.ui.table.selection.Model.SINGLE_SELECTION);

    this._table.setFocusCellOnMouseMove(true);

    this._initTableColumnRender(this._table.getTableColumnModel());
    // 增加功能选单
    this._initContextMenu();
    this._table.setContextMenuHandler(0, this._contextMenuHandler, this);
    this._table.setContextMenuHandler(1, this._contextMenuHandler, this);
    this._table.setContextMenuHandler(2, this._contextMenuHandler, this);
    this._table.setContextMenuHandler(3, this._contextMenuHandler, this);
    this._table.setContextMenuHandler(4, this._contextMenuHandler, this);

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
  },
  members :
  {
    _table : null,
    _dataModel : null,
    _tableName : null,
    _openEntry : null,
    _saveAsEntry : null,

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

      /* 默认打开版本号显示 */
      columnModel.setColumnVisible(1, true);
      columnModel.setColumnWidth(1, 50);

      /* 默认打开版本注释显示 */
      columnModel.setColumnVisible(2, true);
      columnModel.setColumnWidth(2, 170);

      /* 默认修订人显示  */
      columnModel.setColumnVisible(3, true);
      columnModel.setColumnWidth(3, 73);

      /* 默认修订时间显示  */
      columnModel.setColumnVisible(4, true);
      columnModel.setColumnWidth(4, 173);
    },


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

      var openButton = new qx.ui.toolbar.Button("打开","icon/22/actions/document-open.png");
      openButton.addListener("execute",this._onOpenButton,this);
      actionPart.add(openButton);

      var saveAsButton = new qx.ui.toolbar.Button("另存为", "icon/22/actions/document-save-as.png");
      saveAsButton.addListener("execute", this._onSaveAsButton, this);
      actionPart.add(saveAsButton);

      var undoButton = new  qx.ui.toolbar.Button("撤销至", "icon/22/actions/edit-undo.png");
      undoButton.addListener("execute", this._onUndoButton, this);
      actionPart.add(undoButton);

      return toolbar;
    },


    /**
     * TODOC
     *
     */
    _initContextMenu : function()
    {
      var undoEntry = new  qx.ui.menu.Button("撤销至", "icon/22/actions/edit-undo.png");
      undoEntry.addListener("execute", this._onUndoButton, this);
      this._undoEntry = undoEntry;

      var openEntry = new qx.ui.menu.Button("打开","icon/22/actions/document-open.png");
      openEntry.addListener("execute", this._onOpenButton, this);
      this._openEntry = openEntry;

      var saveAsEntry = new qx.ui.menu.Button("另存为", "icon/22/actions/document-save-as.png");
      saveAsEntry.addListener("execute", this._onSaveAsButton, this);
      this._saveAsEntry = saveAsEntry;  

    },

    // 打开日节目预排表

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
     _onUndoButton : function(e)
     {
        var table = this._table;
        table.cancelEditing();
        var model = this._dataModel;
        var rowData = this.getSelectedItem();
        if (!rowData) {
          return;
        }

        //copy
        var subVersionID = tvproui.AjaxPort.call("epgVersion/undoEPG",
        {
          "EPGVersionID" : model.getEPGVersionID(),
          "subVersionID" : parseInt(rowData.version)
        });

        //open new version
        var configuration =
        {
          EPGVersionID : model.getEPGVersionID(),
          subVersionID: parseInt(subVersionID),
          channelID : model.getChannelID(),
          channelName : this.getChannelName(),
          channelICON : this.getChannelICON(),
          broadcastdate : model.getBroadcastDate(),
          name : this._tableName + "(版本号" + subVersionID + ")"
        };

        tvproui.Application.desktop.loadWindow(tvproui.EPG.viewTable.EPGViewWindow, configuration);
     },

    _onOpenButton : function(e)
    {
      var table = this._table;
      table.cancelEditing();
      var model = this._dataModel;
      var rowData = this.getSelectedItem();
      if (!rowData) {
        return;
      }

      // 打开编辑窗口
      var configuration =
      {
        EPGVersionID : model.getEPGVersionID(),
        subVersionID: parseInt(rowData.version),
        channelID : model.getChannelID(),
        channelName : this.getChannelName(),
        channelICON : this.getChannelICON(),
        broadcastdate : model.getBroadcastDate(),
        name : this._tableName + "(版本号" + rowData.version + ")"
      };

      tvproui.Application.desktop.loadWindow(tvproui.EPG.viewTable.EPGViewWindow, configuration);
    },


    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onSaveAsButton : function(e)
    {
      var table = this._table;
      table.cancelEditing();
      var model = this._dataModel;
      var rowData = this.getSelectedItem();
      if (!rowData) {
        return;
      }
      tvproui.Application.desktop.loadWindow(tvproui.epgVersion.ExportEPGWindow,
      {
        tableName : this._tableName + "(版本号" + rowData.version + ")",
        channelID : model.getChannelID(),
        channelICON : this.getChannelICON(),
        channelName : this.getChannelName(),
        multiVersionID : rowData.ID
      });
    },


    /**
     * TODOC
     *
     * @return {null | void | var} TODOC
     */
    getSelectedItem : function()
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
      if ((0 !== selectPos) && (!selectPos)) {
        return null;
      }
      var model = this._dataModel;
      if (selectPos >= model.getRowCount()) {
        return;
      }

      // 打开具体的EPGVersion表格
      return model.getRowDataAsMap(selectPos);
    },


    /**
     * TODOC
     *
     */
    loadData : function()
    {

      /* 清除选区 */
      this._table.getSelectionModel().resetSelection();

      /* 数据模型 */
      var model = this._dataModel;
      model.loadData();
    },

    // 编辑之前的判断

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _beforeEdit : function(e) {
      this._onOpenButton();
    },


    /**
     * TODOC
     *
     */
    refresh : function() {
      this.loadData();
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
      contextMenu.add(this._saveAsEntry);
      contextMenu.add(this._undoEntry);
      return true;
    }
  },

  // 界面之外的内容释放
  destruct : function()
  {

    // 释放非显示层级对象
    this._dataModel.dispose();

    // 去除多余的引用
    this._table = null;
    this._dataModel = null;
    this._openEntry = null;
    this._saveAsEntry = null;
  }
});
