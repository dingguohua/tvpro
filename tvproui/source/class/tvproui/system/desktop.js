
/* ************************************************************************

   Copyright:

   License:

   Authors:

************************************************************************ */

/* ************************************************************************
#asset(qx/icon/${qx.icontheme}/48/actions/*)
#asset(qx/icon/${qx.icontheme}/48/places/*)
#asset(qx/icon/${qx.icontheme}/48/categories/*)
#asset(qx/icon/${qx.icontheme}/48/emotes/*)
#asset(qx/icon/${qx.icontheme}/48/apps/*)
#asset(qx/icon/${qx.icontheme}/48/mimetypes/*)
#asset(tvproui/*)
* ************************************************************************ */
qx.Class.define("tvproui.system.desktop",
{
  extend : qx.ui.container.Composite,
  events : {
    "desktop-inited" : "qx.event.type.Event"
  },
  construct : function()
  {

    //构造函数
    this.base(arguments, new qx.ui.layout.VBox(0));

    //建立桌面窗口区
    var windowManager = new qx.ui.window.Manager();
    var windowsArea = new tvproui.control.ui.window.Desktop(windowManager);

    // 将桌面加入，并且使得桌面尽量占据屏幕空间
    this.add(windowsArea, {
      flex : 1
    });

    //处理背景设置
    windowsArea.addListener("appear", this.initBackgroud, this);

    //大小改变后改变背景图片显示区域
    windowsArea.addListener('resize', this.resizeBackground, this);

    //保存桌面窗口区
    this._windowsArea = windowsArea;
    tvproui.system.desktop.instance = windowsArea;
  },
  statics :
  {
    instance : null,
    defaultBGColor : '#dfdfdf',
    defaultLoginImage : 'tvproui/background/login.png',
    defaultBGImage : 'tvproui/background/background.jpg'
  },


  /*
  *****************************************************************************
  MEMBERS
  *****************************************************************************
  */
  members :
  {
    _windowsArea : null,
    _taskPanel : null,
    _backgroundContainer : null,
    _backgroundImage : null,
    _iconLoaded : false,

    /* 初始化背景 */

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    initBackgroud : function(e)
    {

      // 背景和墙纸
      var container = new qx.ui.container.Composite(new qx.ui.layout.Canvas());
      var background = new qx.ui.basic.Image();

      // 初始化时设置为默认颜色和数据源
      background.setBackgroundColor(tvproui.system.desktop.defaultBGColor);
      background.setSource(tvproui.system.desktop.defaultLoginImage);

      //设定边框为整个屏幕
      var bounds = this._windowsArea.getBounds();
      var sizeObject =
      {
        width : bounds.width,
        height : bounds.height,
        allowGrowX : true,
        allowStretchX : true,
        allowStretchY : true,
        allowGrowY : true
      };
      container.set(sizeObject);
      background.set(sizeObject);

      //加入显示列表
      container.add(background);
      this._windowsArea.add(container);

      //清除选中项效果
      container.addListener('click', function(e) {
        tvproui.control.ui.section.Manager.getInstance().clearSelection();
      }, this);

      //设置背景永远靠后
      background.setZIndex(-10);

      //保存对象
      this._backgroundContainer = container;
      this._backgroundImage = background;

      //触发事件
      this.fireEvent("desktop-inited");
    },

    //刷新背景大小

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    resizeBackground : function(e)
    {
      if (this._backgroundContainer == undefined || this._backgroundImage == undefined) {
        return;
      }
      var bounds = this.getBounds();
      var sizeObject =
      {
        width : bounds.width,
        height : bounds.height
      };
      this._backgroundContainer.set(sizeObject);
      this._backgroundImage.set(sizeObject);

      // 刷新图标
      this.replaceIcons();
    },


    /**
     * TODOC
     *
     */
    replaceIcons : function()
    {
      if (!this._iconLoaded) {
        return;
      }
      var container = this._backgroundContainer;

      // 获取窗口高度，超高要考虑换行
      var h = 0;
      if (document.innerHeight) {
        h = document.innerHeight;
      } else if (document.documentElement.clientHeight) {
        h = document.documentElement.clientHeight;
      } else if (document.body) {
        h = document.body.clientHeight;
      }


      var childrens = container.getChildren();
      var positionX = 18;
      var positionY = 18;
      for (var i = 0, l = childrens.length; i < l; i++)
      {
        var child = childrens[i];
        if (child.classname != 'tvproui.system.icon') {
          continue;
        }
        child.setUserBounds(positionX, positionY, 100, 80);

        //行优先排列

        /*
        positionX = positionX + 102;

        if (positionX + 150 > w)
        {
          positionX = 18;
          positionY = positionY + 102;
        }
        */
        //列优先排列
        positionY = positionY + 102;

        //92 + 10
        if (positionY + 150 > h)
        {
          positionY = 18;
          positionX = positionX + 96;

          //76 + 20
        }
      }
    },

    // 增加图标，供加载图标内部调用

    /**
     * TODOC
     *
     * @param name {var} TODOC
     * @param image {var} TODOC
     * @param tooltiptext {var} TODOC
     * @param func {Function} TODOC
     * @param that {var} TODOC
     * @param argument {var} TODOC
     * @return {var} TODOC
     */
    _addICON : function(name, image, tooltiptext, func, that, argument)
    {
      var container = this._backgroundContainer;
      var icon = new tvproui.system.icon(name, image, tooltiptext, func, that, argument);


      /*
            // 获取窗口宽度，超宽要考虑换行
            var w = 0;

            if (document.innerWidth) {
              w = document.innerWidth;
            } else if (document.documentElement.clientWidth) {
              w = document.documentElement.clientWidth;
            } else if (document.body) {
              w = document.body.clientWidth;
            }

            w = w - 100;  //we need some extra space for bars etc
      */
      // 获取窗口高度，超高要考虑换行
      var h = 0;
      if (document.innerHeight) {
        h = document.innerHeight;
      } else if (document.documentElement.clientHeight) {
        h = document.documentElement.clientHeight;
      } else if (document.body) {
        h = document.body.clientHeight;
      }


      var childrens = container.getChildren();
      var positionX = 18;
      var positionY = 18;
      for (var i = 0, l = childrens.length; i < l; i++)
      {
        var child = childrens[i];
        if (child.classname != 'tvproui.system.icon') {
          continue;
        }

        //行优先排列

        /*
        positionX = positionX + 102;

        if (positionX + 150 > w)
        {
          positionX = 18;
          positionY = positionY + 102;
        }
        */
        //列优先排列
        positionY = positionY + 102;

        //92 + 10
        if (positionY + 150 > h)
        {
          positionY = 18;
          positionX = positionX + 96;

          //76 + 20
        }
      }
      icon.setUserBounds(positionX, positionY, 100, 80);
      container.add(icon);
      return icon;
    },


    /**
     * TODOC
     *
     * @param windowClass {var} TODOC
     * @param windowArgument {var} TODOC
     * @return {void | var} TODOC
     */
    loadWindow : function(windowClass, windowArgument)
    {
      if (!tvproui.control.ui.window.Window.canCreateNew(windowClass)) {
        return;
      }
      var newWindow = new windowClass(windowArgument);
      newWindow.open();
      newWindow.center();
      return newWindow;
    },


    /**
     * TODOC
     *
     * @param URL {var} TODOC
     */
    loadURL : function(URL)
    {
      var options =
      {
        width : 1024,
        height : 768,
        top : 50,
        left : 50,
        scrollbars : true,
        menubar : true,
        status : true
      };
      qx.bom.Window.open(URL, "问题提交系统", options);
    },


    /**
     * TODOC
     *
     */
    loadICON : function()
    {
      this._backgroundImage.setSource(tvproui.system.desktop.defaultBGImage);
      var icons = tvproui.AjaxPort.call("User/getDesktopIcon", null, true);
      if (null == icons)
      {
        dialog.Dialog.error("无法加载图标请联系管理员!");
        return;
      }
      var loadLib = [tvproui.column.ColumnManagement, tvproui.material.MaterialManagement, tvproui.system.PhpTestWindow, tvproui.user.UserManagement, tvproui.resourceTree.TreeManagement, tvproui.tag.TagManagement, tvproui.layout.LayoutVersionManagement, tvproui.materialType.MaterialTypeManagement, tvproui.epgVersion.EPGVersionManagement, tvproui.epgVersion.approval.EPGApprovalManagement, tvproui.statistic.DimensionalityManagement, tvproui.statistic.SourceManagement];
      for (var i = 0, l = icons.length; i < l; i++)
      {
        var icon = icons[i];
        var command = "this._addICON('" + icon.iconname + "', '" + icon.path + "', '" + icon.desc + "', " + icon.command + ")";
        eval(command);
      }

      // 让编译器高兴一下
      loadLib = null;
      this._iconLoaded = true;
    }
  }

  /* end of members */
});
