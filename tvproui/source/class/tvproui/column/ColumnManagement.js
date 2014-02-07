
/**
 * @author Administrator
 */

/* ************************************************************************
#asset(qx/icon/${qx.icontheme}/22/categories/*)
************************************************************************ */
qx.Class.define("tvproui.column.ColumnManagement",
{
  extend : tvproui.control.ui.window.Window,
  statics :
  {
    applicationName : "日预排表编辑",
    applicationIcon : "icon/22/categories/internet.png",
    canMultipleSupport : false
  },
  construct : function(data)
  {
    this.base(arguments);
    var gridLayout = new qx.ui.layout.Grid(10, 10);
    this.setLayout(gridLayout);
    gridLayout.setColumnWidth(0, 200);
    gridLayout.setColumnFlex(1, 1);
    gridLayout.setRowFlex(0, 1);

    /* 左右结构 */
    /* 左侧为资源树 */
    this._resourceTree = this._initResourceTree(data.channelID);
    this.add(this._resourceTree,
    {
      row : 0,
      column : 0
    });

    /* 右侧为频道视图 */
    this._channelView = new tvproui.column.DurationTable(data.layoutVersionID, data.channelID, data.name, this);
    this.add(this._channelView,
    {
      row : 0,
      column : 1
    });
  },
  members :
  {
    _resourceTree : null,
    _channelView : null,


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
     * 构造资源树
     *
     * @param rootID {var} TODOC
     * @return {var} TODOC
     */
    _initResourceTree : function(rootID)
    {

      /* 构造树 */
      var tree = new tvproui.resourceTree.Tree(2, rootID, true, false);
      tree.set(
      {
        width : 200,
        height : 300,
        backgroundColor : "rgb(228,228,228)"
      });
      return tree;
    },


    /**
     * TODOC
     *
     */
    refresh : function()
    {
      this._channelView.loadData();
      this._resourceTree.loadData();
    }
  },

  // 界面之外的内容释放
  destruct : function()
  {

    // 去除多余的引用
    this._resourceTree = null;
    this._channelView = null;
  }
});
