
/**
 * @author Administrator
 */

/* ************************************************************************
#asset(qx/icon/${qx.icontheme}/22/actions/*)
************************************************************************ */
qx.Class.define("tvproui.epgVersion.importer.ImportWindow",
{
  extend : tvproui.control.ui.window.Window,
  statics :
  {
    applicationName : "导入编播表",
    applicationIcon : "icon/22/categories/accessories.png",
    canMultipleSupport : false
  },
  construct : function(data)
  {
    var gridLayout = new qx.ui.layout.Grid(10, 10);
    this.base(arguments);
    this.setLayout(gridLayout);
    gridLayout.setColumnFlex(0, 1);
    gridLayout.setRowFlex(0, 1);

    /* 右侧为素材视图 */
    this._importModel = new tvproui.epgVersion.importer.ImportModel(data.channelID, data.channelName, data.channelICON);
    this._importTable = new tvproui.epgVersion.importer.ImportTable(this._importModel);
    this.add(this._importTable,
    {
      row : 0,
      column : 0
    });
  },
  members :
  {
    _importModel : null,
    _importTable : null,


    /**
     * TODOC
     *
     * @param fileName {var} TODOC
     * @param path {var} TODOC
     */
    addItem : function(fileName, path) {
      this._importModel.addItem(fileName, path);
    }
  },

  // 界面之外的内容释放
  destruct : function() {

    // 释放非显示层级对象
    // 去除多余的引用
    this._importTable = null;
  }
});
