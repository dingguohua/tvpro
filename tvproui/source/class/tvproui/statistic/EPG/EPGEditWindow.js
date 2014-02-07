
/**
 * @author Administrator
 */

/* ************************************************************************
#asset(qx/icon/${qx.icontheme}/22/categories/*)
************************************************************************ */
qx.Class.define("tvproui.statistic.EPG.EPGEditWindow",
{
  extend : tvproui.EPG.viewTable.EPGViewWindow,
  statics :
  {
    applicationName : "编播单编辑",
    applicationIcon : "tvproui/layout/version.png",
    canMultipleSupport : true
  },
  construct : function(data) {
    this.base(arguments, data);
    this.setCaption("编播单编辑 - " + data.name);
  },
  members :
  {
    _EPGModel : null,
    _EPGView: null,

    /**
     * TODOC
     *
     * @param data {var} TODOC
     */
    _init : function(data)
    {
      this.setEnabled(false);
      var gridLayout = new qx.ui.layout.Grid(10, 10);
      this.setLayout(gridLayout);
      gridLayout.setColumnFlex(0, 1);
      gridLayout.setRowFlex(0, 1);

      /* 左侧为编播单内容 */
      var model = new tvproui.statistic.EPG.EPGEditModel(data.EPGVersionID, data.subVersionID, -1, data.broadcastdate);
      this._EPGModel = model;
      this._EPGView = new tvproui.statistic.EPG.EPGEditTable(model, this);
      this._EPGView.setMinWidth(672);
      this.add(this._EPGView, {
        row : 0,
        column : 0
      });

      /* 加载数据 */
      var result = this._EPGView.loadData();
      if (!result)
      {
        dialog.Dialog.error("编播单加载失败!请联系管理员");
        this.close();
        return;
      }

      this.setEnabled(true);
    },

    /* 重载Close实现存盘 */

    /**
     * TODOC
     *
     * @param focus {var} TODOC
     */
    close : function(focus)
    {
      if (focus)
      {
        this.base(arguments);
        return;
      }

      //保存EPG版本
      var model = this._EPGModel;

      // 若文件无需保存，直接checkin然后删除本地存储记录
      if (!model.needSaveVersion())
      {
        this.base(arguments);
        return;
      }

      // 提交本版本
      model.saveNetwork();
      this.base(arguments);
    },


    /**
     * TODOC
     *
     */
    focusClose : function()
    {
      //保存EPG版本
      this.close(true);
    }
  },

  // 界面之外的内容释放
  destruct : function()
  {

    // 去除多余的引用
    this._EPGView = null;
    this._EPGModel = null;
  }
});
