
/**
 * @author Administrator
 */

/* ************************************************************************
#asset(qx/icon/${qx.icontheme}/22/categories/*)
************************************************************************ */
qx.Class.define("tvproui.EPG.viewTable.EPGViewWindow",
{
  extend : tvproui.control.ui.window.Window,
  statics :
  {
    applicationName : "编播单查看",
    applicationIcon : "tvproui/layout/version.png",
    canMultipleSupport : true
  },
  construct : function(data)
  {
    this.base(arguments, "编播单查看 - " + data.name);
    this._init(data);
  },
  members :
  {
    _EPGView : null,
    _orginWidth : null,


    /**
     * TODOC
     *
     * @param data {var} TODOC
     */
    _init : function(data)
    {
      var gridLayout = new qx.ui.layout.Grid(10, 10);
      this.setLayout(gridLayout);
      gridLayout.setColumnFlex(0, 1);
      gridLayout.setRowFlex(0, 1);
      var splitPane = new qx.ui.splitpane.Pane("horizontal");
      this.add(splitPane,
      {
        row : 0,
        column : 0
      });

      /* 右侧为编播单内容 */
      var model = new tvproui.EPG.viewTable.EPGViewModel(data.EPGVersionID, data.subVersionID, data.channelID, data.broadcastdate);

      // 初始化流程信息页面
      var commandListModel = new tvproui.EPG.commandList.commandListModel(data.EPGVersionID, data.subVersionID);
      var commandListTable = new tvproui.EPG.commandList.commandListTable(commandListModel);
      splitPane.add(commandListTable, 0);
      commandListTable.loadData();

      splitPane.getBlocker().addListener("dblclick", function(e)
      {
        var currentWidth = commandListTable.getBounds().width;
        if (currentWidth > 0)
        {
          commandListTable.setMaxWidth(0);
          this._orginWidth = currentWidth;
        } else
        {
          commandListTable.setMaxWidth(null);
          commandListTable.setWidth(this._orginWidth);
        }
      }, this);

      this._EPGView = new tvproui.EPG.viewTable.EPGViewTable(model);
      this._EPGView.setMinWidth(672);
      splitPane.add(this._EPGView, 1);

      // 界面逻辑和数据逻辑分离timer
      var timer = qx.util.TimerManager.getInstance();
      timer.start(function(userData, timerId)
      {

        /* 加载数据 */
        if (!this._EPGView.loadData())
        {
          dialog.Dialog.error("编播单加载失败!请联系管理员");
          this.close();
          return;
        }
        this.setEnabled(true);
      }, 0, this, 150);
    },


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
    refresh : function()
    {
      return;
    }
  },

  // 界面之外的内容释放
  destruct : function()
  {

    // 去除多余的引用
    this._EPGView = null;
    this._orginWidth = null;
  }
});
