
/**
 * @author Administrator
 */

/* ************************************************************************
#asset(qx/icon/${qx.icontheme}/22/actions/*)
************************************************************************ */
qx.Class.define("tvproui.tag.TagManagement",
{
  extend : tvproui.control.ui.window.Window,
  statics :
  {
    applicationName : "标签管理",
    applicationIcon : "icon/22/actions/mail-send.png",
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
    this._tagTable = new tvproui.tag.TagTable();
    this._tagTable.setMinWidth(502);
    this.add(this._tagTable,
    {
      row : 0,
      column : 0
    });
  },
  members :
  {
    _tagTable : null,


    /**
     * TODOC
     *
     */
    refresh : function() {
      this._tagTable.loadData();
    }
  },

  // 界面之外的内容释放
  destruct : function() {

    // 释放非显示层级对象
    // 去除多余的引用
    this._tagTable = null;
  }
});
