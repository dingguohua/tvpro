
/**
 * @author Administrator
 */

/* ************************************************************************
#asset(qx/icon/${qx.icontheme}/22/categories/*)
************************************************************************ */
qx.Class.define("tvproui.layout.LayoutVersionManagement",
{
  extend : tvproui.control.ui.window.Window,
  statics :
  {
    applicationName : "节目预排表版本管理",
    applicationIcon : "icon/22/categories/internet.png",
    canMultipleSupport : false
  },
  construct : function()
  {
    this.base(arguments);
    var gridLayout = new qx.ui.layout.Grid(10, 10);
    this.setLayout(gridLayout);
    gridLayout.setColumnWidth(0, 200);
    gridLayout.setColumnFlex(1, 1);
    gridLayout.setRowFlex(0, 1);

    /* 左右结构 */
    /* 左侧为资源树 */
    this._resourceTree = this._initResourceTree();
    this.add(this._resourceTree,
    {
      row : 0,
      column : 0
    });

    /* 右侧为版面管理视图 */
    this._layoutVersionView = new tvproui.layout.LayoutVersionTable(this);
    this.add(this._layoutVersionView,
    {
      row : 0,
      column : 1
    });

    /* 监听节点选择的变更 */
    this._resourceTree.getSelection().addListener("change", this._onResourceTreeSelect, this);
  },
  members :
  {
    _resourceTree : null,
    _layoutVersionView : null,


    /**
     * TODOC
     *
     */
    open : function()
    {
      this.base(arguments);
      this.maximize();
    },

    /* 构造资源树 */

    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    _initResourceTree : function()
    {

      /* 构造树, 最大层次1,禁止拖动禁止修改 */
      var tree = new tvproui.resourceTree.Tree(1, null, false, false);
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
     * @param e {Event} TODOC
     */
    _onResourceTreeSelect : function(e)
    {
      var view = this._layoutVersionView;

      /* 判断选中对象，更新界面 */
      this._resourceTree.getSelection().forEach(function(item) {
        switch (item.getType())
        {
          default :view.hide();
          break;
          case "channel":view.show();
          view.setChannelID(item.getID());
          view.setChannel(item.getName());
          view.setChannelICON(item.getPath());
          view.loadData();
          break;
        }
      }, this);
    },


    /**
     * TODOC
     *
     */
    refresh : function()
    {
      this._onResourceTreeSelect(null);
      this._resourceTree.loadData();
    }
  },

  // 界面之外的内容释放
  destruct : function()
  {

    // 释放非显示层级对象
    // 去除多余的引用
    this._resourceTree = null;
    this._layoutVersionView = null;
  }
});
