
/**
 * @author Administrator
 */

/* ************************************************************************
#asset(qx/icon/${qx.icontheme}/22/categories/*)
************************************************************************ */
qx.Class.define("tvproui.material.MaterialManagement",
{
  extend : tvproui.control.ui.window.Window,
  statics :
  {
    applicationName : "素材管理",
    applicationIcon : "icon/22/categories/multimedia.png",
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
    /* 左侧 第二排为 资源树 */
    this._resourceTree = this._initResourceTree();
    this.add(this._resourceTree,
    {
      row : 0,
      column : 0
    });

    /* 右侧为素材视图 */
    this._materialView = new tvproui.material.MaterialTable();
    this._materialView.setMinWidth(805);
    this.add(this._materialView,
    {
      row : 0,
      column : 1
    });

    //描述拖出数据范围，描述操作为复制
    this._resourceTree.addListener("dragover", function(e) {
      this._resourceTree.setQuickSelection(true);
    }, this);

    /* 监听节点选择的变更 */
    this._resourceTree.getSelection().addListener("change", this._onResourceTreeSelect, this);
  },
  members :
  {
    _resourceTree : null,
    _materialView : null,


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

      /* 构造树,无拖动，不可写 */
      var tree = new tvproui.resourceTree.Tree(null, null, false, false);
      tree.set(
      {
        width : 200,
        height : 300,
        backgroundColor : "rgb(228,228,228)",
        droppable : true
      });

      /* 移动结束，隐藏指示器 */
      tree.addListener("dragend", function(e) {
        this.setQuickSelection(false);
      }, this);
      tree.addListener("drop", function(e)
      {
        tree.setQuickSelection(false);
        var type = e.supportsType("material");
        if (type)
        {
          var materials = e.getData("material");
          if (materials.length == 0) {
            return;
          }
          var materialSetId = tree.getSelection().getItem(0).getID();
          for (var i = 0, l = materials.length; i < l; i++)
          {
            var material = materials[i];
            tvproui.AjaxPort.call("material/changeMaterialSet",
            {
              "id" : material.ID,
              "materialSetId" : materialSetId
            });
          }

          // 刷新页面
          this._onResourceTreeSelect(null);
          return;
        }
        dialog.Dialog.error("拖放类型不支持");
      }, this);
      return tree;
    },


    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onResourceTreeSelect : function(e)
    {
      var materialView = this._materialView;
      if (this._resourceTree.getQuickSelection()) {
        return;
      }

      /* 判断选中对象，更新界面 */
      this._resourceTree.getSelection().forEach(function(item)
      {
        materialView.setResourceID(item.getID());
        materialView.loadData();
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
    this._materialView = null;
  }
});
