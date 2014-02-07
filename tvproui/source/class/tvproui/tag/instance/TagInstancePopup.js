
/**
 * @author Administrator
 */

/* ************************************************************************
#asset(qx/icon/${qx.icontheme}/22/actions/*)
#asset(qx/icon/${qx.icontheme}/22/categories/*)
#asset(tvproui/type/*)
************************************************************************ */
qx.Class.define("tvproui.tag.instance.TagInstancePopup",
{
  extend : qx.ui.popup.Popup,
  statics :
  {
    instance : null,


    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    getInstance : function()
    {
      if (!tvproui.tag.instance.TagInstancePopup.instance) {
        tvproui.tag.instance.TagInstancePopup.instance = new tvproui.tag.instance.TagInstancePopup();
      }
      return tvproui.tag.instance.TagInstancePopup.instance;
    }
  },
  construct : function()
  {

    /* 网格化布局，第一行是表格，第二行是工具栏 */
    var layout = new qx.ui.layout.VBox();
    this.base(arguments, layout);

    /* 频道数据模型初始化 */
    this._dataModel = new tvproui.tag.instance.TagInstanceModel();

    /* 建立表格 */
    this._table = new qx.ui.table.Table(this._dataModel);
    this._table.setRowHeight(24);
    this._table.setStatusBarVisible(false);
    this._table.setColumnVisibilityButtonVisible(false);

    /* 调整各列的渲染/编辑模式 */
    this._initTableColumnRender(this._table.getTableColumnModel());

    /* 将表格加入显示列表 */
    this.add(this._table);
    this.set(
    {
      backgroundColor : "#FFFAD3",
      padding : [2, 4],
      offset : 15,
      offsetBottom : 40
    });
  },
  members :
  {
    _table : null,
    _dataModel : null,

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
      columnModel.setColumnWidth(6, 60);

      /* 数据ID */
      columnModel.setColumnVisible(7, false);
      columnModel.setColumnWidth(7, 150);

      /* 第二列使用图像渲染器 */
      columnModel.setDataCellRenderer(2, new qx.ui.table.cellrenderer.Image(22, 22));
    },


    /**
     * TODOC
     *
     * @param tableController {var} TODOC
     * @return {boolean} TODOC
     */
    loadData : function(tableController)
    {
      var model = this._dataModel;
      var count = model.loadData(tableController, true);
      if (0 == count) {
        return false;
      }
      this._table.setHeight(count * 24 + 24);
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
  }
});
