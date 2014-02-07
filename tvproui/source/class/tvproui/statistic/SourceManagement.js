
/**
 * @author Administrator
 */

/* ************************************************************************
#asset(qx/icon/${qx.icontheme}/22/categories/*)
************************************************************************ */
qx.Class.define("tvproui.statistic.SourceManagement",
{
  extend : tvproui.control.ui.window.Window,
  statics :
  {
    applicationName : "统计数据管理",
    applicationIcon : "icon/22/actions/mail-mark-read.png",
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
    var layout = new qx.ui.layout.Grid(4, 4);
    layout.setColumnWidth(0, 40);
    layout.setColumnFlex(1, 1);
    layout.setRowFlex(2, 1);
    layout.setColumnAlign(0, "left", "middle");
    layout.setSpacing(4);

    // apply spacing
    var container = new qx.ui.container.Composite(layout);

    /* 左右结构 */
    // 左上为日期选择
    container.add(new qx.ui.basic.Label("开始:"),
    {
      row : 0,
      column : 0
    });
    this._beginDate = new tvproui.control.ui.form.DateField();
    this._beginDate.setPlaceholder("播出始于");
    container.add(this._beginDate,
    {
      row : 0,
      column : 1
    });

    // 左上为日期选择
    container.add(new qx.ui.basic.Label("结束:"),
    {
      row : 1,
      column : 0
    });
    this._endDate = new tvproui.control.ui.form.DateField();
    this._endDate.setPlaceholder("播出止于");
    this._endDate.setMaxDate(new Date((new Date()).getTime() - 1000 * 60 * 60 * 24));
    container.add(this._endDate,
    {
      row : 1,
      column : 1
    });

    var now = new Date();
    this._beginDate.setValue(new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7));
    this._endDate.setValue(new Date(now.getTime() - 1000 * 60 * 60 * 24 * 1));
    this._beginDate.addListener("changeValue", this._onBeginDateChanged, this);
    this._endDate.addListener("changeValue", this._onEndDateChanged, this);

    /* 左侧为资源树 */
    this._resourceTree = this._initResourceTree(1);
    container.add(this._resourceTree,
    {
      row : 2,
      column : 0,
      colSpan : 2
    });
    this.add(container,
    {
      row : 0,
      column : 0
    });

    /* 右侧为版面管理视图 */
    this._EPGVersionModel = new tvproui.statistic.SourceModel();
    this._EPGVersionView = new tvproui.statistic.SourceTable(this._EPGVersionModel, this);
    this._EPGVersionView.setMinWidth(840);
    this.add(this._EPGVersionView,
    {
      row : 0,
      column : 1
    });

    /* 监听节点选择的变更 */
    this._resourceTree.getSelection().addListener("change", this._onResourceTreeSelect, this);
  },
  members :
  {
    _beginDate : null,
    _endDate: null,
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
          case "channel":
          view.show();
          model.setBeginDate(tvproui.utils.Time.formatDate(this._beginDate.getValue()));
          model.setEndDate(tvproui.utils.Time.formatDate(this._endDate.getValue()));
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
    _onBeginDateChanged : function(e)
    {
      var view = this._EPGVersionView;
      var model = this._EPGVersionModel;
      var beginDate = this._beginDate.getValue();
      var endDate = this._endDate.getValue();
      if(beginDate.getTime() > endDate.getTime())
      {
        this._endDate.setValue(beginDate);
      }

      model.setBeginDate(tvproui.utils.Time.formatDate(beginDate));

      if (!this._loaded) {
        return false;
      }
      
      view.loadData();
    },


    /**
     * TODOC
     *
     * @param e {Event} TODOC
     * @return {boolean} TODOC
     */
    _onEndDateChanged : function(e)
    {
      var view = this._EPGVersionView;
      var model = this._EPGVersionModel;
      var beginDate = this._beginDate.getValue();
      var endDate = this._endDate.getValue();
      if(endDate.getTime() < beginDate.getTime())
      {
        this._beginDate.setValue(endDate);
      }

      model.setEndDate(tvproui.utils.Time.formatDate(endDate));
      if (!this._loaded) {
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
    this._beginDate = null;
    this._endDate = null;
    this._resourceTree = null;
    this._EPGVersionModel = null;
    this._EPGVersionView = null;
    this._loaded = false;
  }
});
