
/**
 * @author Administrator
 */

/* ************************************************************************
#asset(qx/icon/${qx.icontheme}/22/actions/*)
#asset(qx/icon/${qx.icontheme}/22/categories/*)
#asset(tvproui/type/*)
************************************************************************ */
qx.Class.define("tvproui.materialPackage.MaterialPackageDivTable",
{
  extend : tvproui.control.ui.window.Window,
  events : {
    DIV_RESULT : "qx.event.type.Data"
  },
  statics :
  {
    applicationName : "素材包拆分点选择",
    applicationIcon : "tvproui/type/package.png",
    canMultipleSupport : true,
    lastSource : null
  },
  properties :
  {
    parentMaterialID : {
      check : "Integer"
    },
    broadcastDate : {
      check : "String"
    },

    /* 资源ID */
    resourceID :
    {
      nullable : false,
      check : "Integer"
    }
  },
  construct : function(data)
  {
    this.base(arguments, "素材包拆分点选择  - " + data.packageName);

    // 配置资源ID为当前素材集的
    this.setResourceID(data.resourceID);
    this.setParentMaterialID(data.parentMaterialID);
    this.setBroadcastDate(data.broadcastDate);

    /* 网格化布局，第一行是表格，第二行是工具栏 */
    var gridLayout = new qx.ui.layout.Grid(10, 0);
    this.setLayout(gridLayout);

    /* 水平方向随着窗口缩放 */
    gridLayout.setColumnFlex(0, 1);

    /* 垂直方向，中间的表格随着窗口缩放 */
    gridLayout.setRowFlex(1, 1);

    // 增加一行
    var rowContainer = new qx.ui.container.Composite();
    rowContainer.setPaddingBottom(5);
    var rowLayout = new qx.ui.layout.Grid(10, 10);
    rowLayout.setColumnAlign(0, "left", "middle");
    rowLayout.setColumnAlign(2, "left", "middle");
    rowLayout.setColumnAlign(3, "left", "middle");
    rowLayout.setColumnAlign(4, "left", "middle");
    rowLayout.setColumnAlign(5, "left", "middle");
    rowContainer.setLayout(rowLayout);

    // 播出日期
    rowContainer.add(new qx.ui.basic.Label("播出日期:"),
    {
      row : 0,
      column : 0
    });
    rowContainer.add(new qx.ui.basic.Label(data.broadcastDate),
    {
      row : 0,
      column : 1
    });

    // 素材包时长
    rowContainer.add(new qx.ui.basic.Label("时长:"),
    {
      row : 0,
      column : 2
    });
    this._timeLength = new qx.ui.basic.Label("00:00:00");
    rowContainer.add(this._timeLength,
    {
      row : 0,
      column : 3
    });

    // 素材包时长
    rowContainer.add(new qx.ui.basic.Label("硬广告:"),
    {
      row : 0,
      column : 4
    });
    this._ADtimeLength = new qx.ui.basic.Label("00:00:00");
    rowContainer.add(this._ADtimeLength,
    {
      row : 0,
      column : 5
    });
    this.add(rowContainer,
    {
      row : 0,
      column : 0
    });

    /* 频道数据模型初始化 */
    this._dataModel = new tvproui.materialPackage.MaterialPackageModel();

    /* 建立表格 */
    this._table = new qx.ui.table.Table(this._dataModel);
    this._table.setRowHeight(24);
    this._table.setHeight(240);
    this._table.addListener("cellDblclick", this._beforeEdit, this);

    /* 配置多选模式 */
    this._selectionManager = this._table.getSelectionModel();
    this._selectionManager.setSelectionMode(qx.ui.table.selection.Model.SINGLE_SELECTION);

    /* 配置拖拽，鼠标聚焦 */
    this._table.setFocusCellOnMouseMove(true);

    /* 调整各列的渲染/编辑模式 */
    this._initTableColumnRender(this._table.getTableColumnModel());

    /* 将表格加入显示列表第二行位置 */
    this.add(this._table,
    {
      row : 1,
      column : 0
    });

    // 初始化标签
    this._initTagSystem();
  },
  members :
  {
    _indicator : null,
    _popUp : null,
    _table : null,
    _dataModel : null,
    _timeLength : null,
    _ADtimeLength : null,


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

      //表格模式2代表Material
      this._table.tableType = 2;

      // 指定tagID列
      this._table.tableIDColumn = 1;
      var scroller = this._table.getPaneScroller(0);
      this._indicator = scroller.getChildControl("focus-indicator");
      this._indicator.addListener("mousemove", function(e)
      {
        if (10 != this._table.getFocusedColumn())
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

      /* 默认关闭ID显示 */
      columnModel.setColumnVisible(0, false);
      columnModel.setColumnWidth(0, 50);

      /* 默认关闭materialID显示 */
      columnModel.setColumnVisible(1, false);
      columnModel.setColumnWidth(1, 50);

      /* 默认打开名称显示 */
      columnModel.setColumnVisible(2, true);
      columnModel.setColumnWidth(2, 170);

      /* 默认类型显示 */
      columnModel.setColumnVisible(3, true);
      columnModel.setColumnWidth(3, 40);

      /* 默认时长显示 */
      columnModel.setColumnVisible(4, true);
      columnModel.setColumnWidth(4, 73);

      /* 默认关闭生效显示  */
      columnModel.setColumnVisible(5, false);
      columnModel.setColumnWidth(5, 100);

      /* 默认关闭失效显示  */
      columnModel.setColumnVisible(6, false);
      columnModel.setColumnWidth(6, 100);

      /* 默认编号显示  */
      columnModel.setColumnVisible(7, false);
      columnModel.setColumnWidth(7, 73);

      /* 默认上传用户名显示  */
      columnModel.setColumnVisible(8, false);
      columnModel.setColumnWidth(8, 73);

      /* 默认打包用户名显示  */
      columnModel.setColumnVisible(9, false);
      columnModel.setColumnWidth(9, 73);

      /* 默认标签显示  */
      columnModel.setColumnVisible(10, true);
      columnModel.setColumnWidth(10, 170);

      /* 第二列使用图像渲染器 */
      columnModel.setDataCellRenderer(3, new tvproui.material.MaterialImage(22, 22));

      /* 第三四列都用时间渲染器 */
      columnModel.setDataCellRenderer(4, new tvproui.control.ui.table.cellrenderer.TimeCellRender());
      columnModel.setCellEditorFactory(4, new tvproui.control.ui.table.celleditor.TimeCellEditor());
      columnModel.setCellEditorFactory(5, new tvproui.control.ui.table.celleditor.DateField());
      columnModel.setCellEditorFactory(6, new tvproui.control.ui.table.celleditor.DateField());

      /* 标签列使用标签渲染器和标签编辑器 */
      columnModel.setDataCellRenderer(10, new tvproui.control.ui.table.cellrenderer.TagRender(22, 22));
      columnModel.setCellEditorFactory(10, new tvproui.control.ui.table.celleditor.TagEditor());
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
      var result = model.loadData(true, this.getParentMaterialID(), this.getBroadcastDate());
      if (result < 2)
      {
        dialog.Dialog.alert("素材数量过少不能分割!");
        this.close();
        return;
      }

      // 更新总时长
      model.calcDuration(this._timeLength, this._ADtimeLength);
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
      table.cancelEditing();
      var row = table.getFocusedRow();
      var model = this._dataModel;
      if ((row == null) || (row >= model.getRowCount())) {
        return;
      }

      // 切割位置实际上应该是从第一行开始
      if (row == 0) {
        row = 1;
      }

      // 加载数据
      var rows = tvproui.AjaxPort.call("materialpackage/slice",
      {
        "parentMaterialID" : model.getParentMaterialID(),
        "broadcastDate" : model.getBroadcastDate(),
        "position" : row
      });

      // 切割完成事件
      if (null != rows) {
        this.fireDataEvent("DIV_RESULT", rows);
      }
      this.close();
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
     */
    close : function()
    {
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

    // 去除多余的引用
    this._indicator = null;
    this._popUp = null;
    this._table = null;
    this._dataModel = null;
    this._timeLength = null;
    this._ADtimeLength = null;
  }
});
