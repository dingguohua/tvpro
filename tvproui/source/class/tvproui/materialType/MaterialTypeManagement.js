
/**
 * @author Administrator
 */

/* ************************************************************************
#asset(qx/icon/${qx.icontheme}/22/mimetypes/*)
************************************************************************ */
qx.Class.define("tvproui.materialType.MaterialTypeManagement",
{
  extend : tvproui.control.ui.window.Window,
  statics :
  {
    applicationName : "素材类型管理",
    applicationIcon : "icon/22/mimetypes/office-contact.png",
    canMultipleSupport : false
  },
  construct : function()
  {
    var gridLayout = new qx.ui.layout.Grid(10, 10);
    this.base(arguments);
    this.setLayout(gridLayout);
    gridLayout.setColumnFlex(0, 1);
    gridLayout.setRowFlex(0, 1);

    /* 右侧为素材视图 */
    this._materialTypeTable = new tvproui.materialType.MaterialTypeTable();
    this.add(this._materialTypeTable,
    {
      row : 0,
      column : 0
    });
  },
  members :
  {
    _tagTable : null,

    /* 重载Close实现存盘 */

    /**
     * TODOC
     *
     * @param control {var} TODOC
     */
    close : function(control)
    {

      // 重新载入样式表
      tvproui.system.fileManager.getMaterialStyle(true);
      this.base(arguments);
    },


    /**
     * TODOC
     *
     */
    refresh : function() {
      this._materialTypeTable.loadData();
    }
  },

  // 界面之外的内容释放
  destruct : function() {

    // 释放非显示层级对象
    // 去除多余的引用
    this._materialTypeTable = null;
  }
});
