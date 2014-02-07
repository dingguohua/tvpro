
/**
 * @author Administrator
 */

/* ************************************************************************
#asset(qx/icon/${qx.icontheme}/22/categories/*)
************************************************************************ */
qx.Class.define("tvproui.epgVersion.approval.EPGApprovalManagement",
{
  extend : tvproui.control.ui.window.Window,
  statics :
  {
    applicationName : "版本审核管理",
    applicationIcon : "icon/22/apps/utilities-log-viewer.png",
    canMultipleSupport : false
  },
  construct : function()
  {
    this.base(arguments);
    var gridLayout = new qx.ui.layout.Grid(10, 10);
    this.setLayout(gridLayout);
    gridLayout.setColumnFlex(0, 1);
    gridLayout.setRowFlex(0, 1);

    /* 右侧为版面管理视图 */
    this._EPGApprovalModel = new tvproui.epgVersion.approval.EPGApprovalModel();
    this._EPGApprovalView = new tvproui.epgVersion.approval.EPGApprovalTable(this._EPGApprovalModel, this);
    this.add(this._EPGApprovalView,
    {
      row : 0,
      column : 0
    });
    this._EPGApprovalView.loadData();
  },
  members :
  {
    _EPGApprovalModel : null,
    _EPGApprovalView : null,


    /**
     * TODOC
     *
     */
    open : function()
    {
      this.base(arguments);
      this.maximize();
    },


    /**
     * TODOC
     *
     */
    refresh : function() {
      this._EPGApprovalView.loadData();
    }
  },

  // 界面之外的内容释放
  destruct : function()
  {

    // 释放非显示层级对象
    // 去除多余的引用
    this._EPGApprovalModel = null;
    this._EPGApprovalView = null;
  }
});
