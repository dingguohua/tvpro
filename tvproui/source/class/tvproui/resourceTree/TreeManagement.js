
/**
 * @author Administrator
 */

/* ************************************************************************
 * #asset(qx/icon/${qx.icontheme}/48/places/*)
 * #asset(qx/icon/${qx.icontheme}/22/places/*)
************************************************************************ */
qx.Class.define("tvproui.resourceTree.TreeManagement",
{
  extend : tvproui.control.ui.window.Window,
  statics :
  {
    applicationName : "资源结构管理",
    applicationIcon : "icon/22/places/user-home.png",
    canMultipleSupport : false
  },
  construct : function()
  {
    this.base(arguments);
    this.setWidth(300);
    this.setHeight(500);
    var gridLayout = new qx.ui.layout.Grid(10, 10);
    this.setLayout(gridLayout);
    gridLayout.setColumnFlex(0, 1);
    gridLayout.setRowFlex(0, 1);

    /* 左右结构 */
    /* 左侧为资源树 */
    this._resourceTree = this._initResourceTree();
    this.add(this._resourceTree,
    {
      row : 0,
      column : 0
    });
  },
  members :
  {
    _resourceTree : null,

    /* 构造资源树 */

    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    _initResourceTree : function()
    {

      /* 构造树, 无指定起始点 */
      var tree = new tvproui.resourceTree.Tree(null, null, true, true);
      tree.set(
      {
        width : 200,
        backgroundColor : "rgb(228,228,228)"
      });
      tree.addListenerOnce("loaded", this._onLoaded, this);
      return tree;
    },


    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onLoaded : function(e)
    {
      var tree = e.getTarget();
      var lock = tree.getLocked();
      var editingAlias = tree.getEditingAlias();
      if (lock) {
        this.setCaption("资源结构管理 - (" + editingAlias + " 正在编辑)");
      }
    },


    /**
     * TODOC
     *
     */
    refresh : function() {
      this._resourceTree.loadData();
    }
  },

  // 界面之外的内容释放
  destruct : function() {

    // 去除多余的引用
    this._resourceTree = null;
  }
});
