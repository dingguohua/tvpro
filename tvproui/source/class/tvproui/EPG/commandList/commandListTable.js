
/**
 * @author Administrator
 */

/* ************************************************************************
#asset(qx/icon/${qx.icontheme}/22/actions/*)
#asset(qx/icon/${qx.icontheme}/22/categories/*)
#asset(tvproui/type/*)
************************************************************************ */
qx.Class.define("tvproui.EPG.commandList.commandListTable",
{
  extend : qx.ui.container.Composite,
  construct : function(model)
  {

    /* 网格化布局，第一行是表格，第二行是工具栏 */
    this.base(arguments);
    var gridLayout = new qx.ui.layout.Grid(10, 0);
    this.setLayout(gridLayout);

    /* 水平方向随着窗口缩放 */
    gridLayout.setColumnFlex(0, 1);

    /* 垂直方向，中间的表格随着窗口缩放 */
    gridLayout.setRowFlex(0, 1);

    /* 频道数据模型初始化 */
    this._dataModel = model;

    /* 建立表格 */
    this._table = new qx.ui.table.Table(this._dataModel);
    this._table.setRowHeight(24);
    var columnModel = this._table.getTableColumnModel();
    var init = false;
    this._table.addListener("resize", function(e)
    {
      if (!init)
      {
        init = true;
        return;
      }
      var width = this.getWidth();
      columnModel.setColumnWidth(1, width - 5);
    }, this);

    /* 配置多选模式 */
    this._selectionManager = this._table.getSelectionModel();
    this._selectionManager.setSelectionMode(qx.ui.table.selection.Model.MULTIPLE_INTERVAL_SELECTION);

    /* 配置拖拽，鼠标聚焦 */
    this._table.setFocusCellOnMouseMove(true);

    /* 调整各列的渲染/编辑模式 */
    this._initTableColumnRender(columnModel);

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

      /* 默认关闭标签ID显示 */
      columnModel.setColumnVisible(1, true);
      columnModel.setColumnWidth(1, 400);
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

      /* 加入刷新按钮到编辑分段中 */
      var refreshButton = new qx.ui.toolbar.Button("刷新", "icon/22/actions/view-refresh.png");
      refreshButton.addListener("execute", this.loadData, this);
      actionPart.add(refreshButton);

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
    loadData : function()
    {

      /* 清除选区 */
      this._table.getSelectionModel().resetSelection();

      /* 数据模型 */
      var model = this._dataModel;
      model.loadData();
    },


    /**
     * TODOC
     *
     */
    refresh : function() {
      this.loadData();
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
    this._selectionManager = null;
    this._selectionAllCommand = null;
  }
});
