
/**
 * @author Administrator
 */

/* ************************************************************************
#asset(qx/icon/${qx.icontheme}/22/categories/*)
************************************************************************ */
qx.Class.define("tvproui.epgVersion.EPGVersionManagement",
{
  extend: tvproui.control.ui.window.Window,
  statics:{
    applicationName:"编播表版本管理",
    applicationIcon:"icon/22/categories/accessories.png",
    canMultipleSupport:false
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
    var layout = new qx.ui.layout.Grid(4, 4);
    layout.setColumnWidth(0, 40);
    layout.setColumnFlex(1, 1);
    layout.setRowFlex(1, 1);
    layout.setColumnAlign(0, "left", "middle");
    layout.setSpacing(4);

    // apply spacing
    var container = new qx.ui.container.Composite(layout);
    /* 左右结构 */
    // 左上为日期选择
    container.add(new qx.ui.basic.Label("播出:"),{row:0,column:0});
    var now = new Date();
    this._workDate = new tvproui.control.ui.form.DateField();
    
    this._workDate.setValue(now);
    this._workDate.addListener("changeValue",this._onWorkDateChanged,this);
    container.add(this._workDate,{row:0,column:1});

    this.add(container,{row:0,column:0});

    this._resourceTree = this._initResourceTree(1);
    container.add(this._resourceTree,{row:1,column:0,colSpan:2});

    this._EPGVersionModel = new tvproui.epgVersion.EPGVersionModel();
    this._EPGVersionView = new tvproui.epgVersion.EPGVersionTable(this._EPGVersionModel,this);
    this.add(this._EPGVersionView,{row:0,column:1});

    this._resourceTree.getSelection().addListener("change",this._onResourceTreeSelect,this);
  },
  members :
  {
    _workDate : null,
    _resourceTree : null,
    _EPGVersionModel : null,
    _EPGVersionView : null,
    _loaded : false,


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
      var view = this._EPGVersionView;
      var model = this._EPGVersionModel;

      /* 判断选中对象，更新界面 */
      this._resourceTree.getSelection().forEach(function(item) {
        switch (item.getType())
        {
          default :view.hide();
          break;
          case "channel":view.show();
          model.setBroadcastDate(tvproui.utils.Time.formatDate(this._workDate.getValue()));
          model.setChannelID(item.getID());
          model.setChannel(item.getName());
          model.setChannelICON(item.getPath());
          view.loadData();
          this._loaded = true;
          break;
        }
      }, this);
    },

    /* 开始时间变换后将终止时间设定为开始时间 */

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     * @return {boolean} TODOC
     */
    _onWorkDateChanged : function(e)
    {
      var view = this._EPGVersionView;
      var model = this._EPGVersionModel;

      model.setBroadcastDate(tvproui.utils.Time.formatDate(this._workDate.getValue()));
      if(!this._loaded){
        return false;
      }
      view.loadData();
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
    this._workDate = null;
    this._resourceTree = null;
    this._EPGVersionModel = null;
    this._EPGVersionView = null;
    this._loaded = false;
  }
});
