
/**
 * @author Administrator
 */

/* ************************************************************************
#asset(qx/icon/${qx.icontheme}/22/actions/*)
#asset(qx/icon/${qx.icontheme}/22/categories/*)
#asset(tvproui/type/*)
************************************************************************ */
qx.Class.define("tvproui.materialPackage.MaterialPackagePopup",
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
      if (!tvproui.materialPackage.MaterialPackagePopup.instance) {
        tvproui.materialPackage.MaterialPackagePopup.instance = new tvproui.materialPackage.MaterialPackagePopup();
      }
      return tvproui.materialPackage.MaterialPackagePopup.instance;
    }
  },
  construct : function(data)
  {

    /* 网格化布局，第一行是表格，第二行是工具栏 */
    var layout = new qx.ui.layout.VBox();
    this.base(arguments, layout);

    /* 频道数据模型初始化 */
    this._dataModel = new tvproui.materialPackage.MaterialPackageModel();

    /* 建立表格 */
    this._table = new qx.ui.table.Table(this._dataModel);
    this._table.setRowHeight(24);
    this._table.setStatusBarVisible(false);
    this._table.setColumnVisibilityButtonVisible(false);

    //表格模式2代表Material
    this._table.tableType = 2;

    // 指定tagID列
    this._table.tableIDColumn = 1;

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

      /* 默认关闭编号显示  */
      columnModel.setColumnVisible(7, false);
      columnModel.setColumnWidth(7, 73);

      /* 默认关闭上传用户名显示  */
      columnModel.setColumnVisible(8, false);
      columnModel.setColumnWidth(8, 73);

      /* 默认关闭打包用户名显示  */
      columnModel.setColumnVisible(9, false);
      columnModel.setColumnWidth(9, 73);

      /* 默认标签显示  */
      columnModel.setColumnVisible(10, false);
      columnModel.setColumnWidth(10, 170);

      /* 第二列使用图像渲染器 */
      columnModel.setDataCellRenderer(3, new tvproui.material.MaterialImage(22, 22));

      /* 第三四列都用时间渲染器 */
      columnModel.setDataCellRenderer(4, new tvproui.control.ui.table.cellrenderer.TimeCellRender());

      /* 标签列使用标签渲染器和标签编辑器 */
      columnModel.setDataCellRenderer(10, new tvproui.control.ui.table.cellrenderer.TagRender(22, 22));
    },


    /**
     * TODOC
     *
     * @param parentMaterialID {var} TODOC
     * @param broadcastDate {var} TODOC
     * @return {boolean} TODOC
     */
    loadData : function(parentMaterialID, broadcastDate)
    {
      var model = this._dataModel;
      var count = model.loadData(true, parentMaterialID, broadcastDate);
      if (0 == count) {
        return false;
      }
      count = count > 15 ? 15 : count;
      this._table.setHeight(count * 24 + 24);
      return true;
    }
  },

  // 界面之外的内容释放
  destruct : function()
  {

    //释放没有释放干净的对象
    this._dataModel.dispose();

    // 去除多余的引用
    this._table = null;
    this._dataModel = null;
  }
});
