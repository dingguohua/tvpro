
/**
 * @author Administrator
 */

/* ************************************************************************
#asset(qx/icon/${qx.icontheme}/22/categories/*)
************************************************************************ */
qx.Class.define("tvproui.EPG.editTable.EPGEditWindow",
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
    _resourceTree : null,
    _EPGModel : null,
    _EPGView  : null,
    _lastLinkedControl : null,
    _lastControl : null,


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
      var splitPane = new qx.ui.splitpane.Pane("horizontal");
      this.add(splitPane,
      {
        row : 0,
        column : 0
      });

      /* 左侧为编播单内容 */
      var model = new tvproui.EPG.editTable.EPGEditModel(data.EPGVersionID, data.subVersionID, data.channelID, data.broadcastdate);
      this._EPGModel = model;
      this._EPGView = new tvproui.EPG.editTable.EPGEditTable(model, this);
      this._EPGView.setMinWidth(672);
      splitPane.add(this._EPGView, 1);

      /* 右侧为可用素材清单 */
      var tabView = new qx.ui.tabview.TabView();
      tabView.setBarPosition("right");
      tabView.setContentPadding(2, 2, 2, 2);
      this._resourceTree = new tvproui.resourceTree.Tree(2, data.channelID, true, false);
      this._lastControl = this._resourceTree;
      var pageResourceTreeLayout = new qx.ui.layout.Grid();
      pageResourceTreeLayout.setColumnFlex(0, 1);
      pageResourceTreeLayout.setRowFlex(0, 1);
      var pageResourceTree = new qx.ui.tabview.Page("栏目", "icon/22/places/user-home.png");
      pageResourceTree.setLayout(pageResourceTreeLayout);
      pageResourceTree.add(this._resourceTree,
      {
        row : 0,
        column : 0
      });
      tabView.add(pageResourceTree);
      splitPane.add(tabView, 0);
      splitPane.getBlocker().addListener("dblclick", function(e)
      {
        var currentWidth = tabView.getBounds().width;
        if (currentWidth > 0)
        {
          tabView.setMaxWidth(0);
          this._orginWidth = currentWidth;
        } else
        {
          tabView.setMaxWidth(this._orginWidth);
        }
      }, this);

      // 界面逻辑和数据逻辑分离timer
      var materialConfiguration =
      {
        resourceID : data.channelID,
        endTime: data.broadcastdate
      };

      // 频道素材，引用计数
      this._channelView = new tvproui.EPG.materialCount.MaterialTable();
      this._channelView.set(materialConfiguration);
      var pageChannelLayout = new qx.ui.layout.Grid();
      pageChannelLayout.setColumnFlex(0, 1);
      pageChannelLayout.setRowFlex(0, 1);
      var pageChannel = new qx.ui.tabview.Page("所有素材", data.channelICON);
      pageChannel.setLayout(pageChannelLayout);
      pageChannel.add(this._channelView,
      {
        row : 0,
        column : 0
      });
      tabView.add(pageChannel);

      // 实现所有类型表格
      var typeNames = tvproui.system.fileManager.getSelectorData();
      for (var i = 0, l = typeNames.length; i < l; i++)
      {
        var typeName = typeNames[i];
        var typeView = new tvproui.EPG.materialCount.MaterialTable(typeName[0]);
        typeView.set(materialConfiguration);
        var typePage = new qx.ui.tabview.Page(typeName[0], typeName[1]);
        var typeLayout = new qx.ui.layout.Grid();
        typeLayout.setColumnFlex(0, 1);
        typeLayout.setRowFlex(0, 1);
        typePage.setLayout(typeLayout);
        typePage.add(typeView,
        {
          row : 0,
          column : 0
        });
        tabView.add(typePage);
      }
      tabView.addListener("changeSelection", this._onChangeSelectionTab, this);

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

    // 更换了Tab

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onChangeSelectionTab : function(e)
    {
      var tabView = e.getTarget();
      var selection = tabView.getSelection()[0];
      var control = selection.getChildren()[0];

      // 如果之前的控件具备链接功能，则卸载之
      if (this._lastLinkedControl != null) {
        this._lastLinkedControl.unlink(this._EPGModel);
      }
      control.loadData();
      this._lastControl = control;

      // 如果当前控件具备链接功能，则装载之
      if (control.link)
      {
        this._lastLinkedControl = control;
        control.link(this._EPGModel);
      }
    },


    /**
     * TODOC
     *
     * @return {null | var} TODOC
     */
    getCurrentControl : function()
    {
      if (!(this._lastControl instanceof tvproui.EPG.materialCount.MaterialTable)) {
        return null;
      }
      return this._lastControl;
    },


    /**
     * TODOC
     *
     */
    refresh : function()
    {


      /*
      this.base(arguments);
      this._lastControl.loadData();
      */
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
        // 如果是可写模式，提交引用的EPGVersion
        var result = tvproui.AjaxPort.call("epgVersion/checkinByEPGVersionID", {
          "ID" : model.getEPGVersionID()
        });

        if(result)
        {
          model.removeState();
        }

        this.base(arguments);
        return;
      }

      var formData = {
        'description' :
        {
          'type' : "TextArea",
          'label' : "版本描述",
          'lines' : 4,
          'value' : "进行了修改"
        }
      };
      var that = this;
      var lastArguments = arguments;
      dialog.Dialog.form("提交版本记录", formData, function(result)
      {
        if (!result) {
          return;
        }

        // 提交本版本
        model.saveNetwork(result.description);

        // 若文件无需保存，直接checkin然后删除本地存储记录
        var result = tvproui.AjaxPort.call("epgVersion/checkinByEPGVersionID", {
          "ID" : model.getEPGVersionID()
        });

        if(result)
        {
          model.removeState();
        }

        that.base(lastArguments);
      }, this);
    },


    /**
     * TODOC
     *
     */
    focusClose : function()
    {
      //保存EPG版本
      var model = this._EPGModel;
      this.close(true);
    }
  },

  // 界面之外的内容释放
  destruct : function()
  {

    // 去除多余的引用
    this._resourceTree = null;
    this._EPGModel = null;
    this._EPGView = null;
    this._lastLinkedControl = null;
    this._lastControl = null;
  }
});
