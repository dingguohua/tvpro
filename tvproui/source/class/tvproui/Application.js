
/* ************************************************************************

   Copyright:

   License:

   Authors:

************************************************************************ */

/**
 * This is the main application class of your custom application "tvproui"
 */
qx.Class.define("tvproui.Application",
{
  extend : qx.application.Standalone,
  statics :
  {
    desktop : null,
    ctrlKey : false,
    connectionState : "init",
    logouted : false,


    /**
     * TODOC
     *
     */
    logout : function()
    {
      if (tvproui.Application.logouted) {
        return;
      }
      tvproui.Application.logouted = true;
      tvproui.Application.connectionState = "init";

      // 验证存盘
      tvproui.system.desktop.instance.closeAll();

      // 发送logout信号
      tvproui.AjaxPort.call("User/logout");

      // 刷新页面
      location = location;
    }
  },


  /*
  *****************************************************************************
  MEMBERS
  *****************************************************************************
  */
  members :
  {
    _loginWindow : null,


    /**
     * This method contains the initial application code and gets called
     * during startup of the application
     *
     * @lint ignoreDeprecated(alert)
     */
    main : function()
    {

      // Call super class
      this.base(arguments);

      // 将菜单处理能力加入表格
      qx.Class.include(qx.ui.table.Table, qx.ui.table.MTableContextMenu);
      qx.Class.include(tvproui.control.ui.spanTable.spanTable, qx.ui.table.MTableContextMenu);

      // Enable logging in debug variant
      if (qx.core.Environment.get("qx.debug"))
      {

        // support native logging capabilities, e.g. Firebug for Firefox
        qx.log.appender.Native;

        // support additional cross-browser console. Press F7 to toggle visibility
        qx.log.appender.Console;
      }

      /* 初始化语言环境为简体中文 */
      qx.locale.Manager.getInstance().setLocale("zh_Hans_CN");

      /* 初始化Ajax Xdebuger PHP调试支持 */
      tvproui.AjaxPort.initDebuger();


      /*
      -------------------------------------------------------------------------
          Below is your actual application code...
      -------------------------------------------------------------------------
      */
      // 浏览器补丁(For IE6)，提供trim函数
      if (typeof String.prototype.trim !== 'function') {


        /**
         * TODOC
         *
         * @return {var} TODOC
         */
        String.prototype.trim = function() {
          return this.replace(/^\s+|\s+$/g, '');
        };
      }
      this._orginErrorHandler = window.onerror;

      if (!qx.core.Environment.get("qx.debug"))
      {
          qx.event.GlobalError.setErrorHandler(this._errorHandler, this);
      }

      // 初始化日期工具
      tvproui.utils.Time.init();

      // 初始化本地化存储
      tvproui.utils.Storage.init();

      // 获取显示根
      var root = this.getRoot();

      // 建立一个屏幕组件，填充满所有的窗口，从上到下提供桌面和任务栏
      var desktop = new tvproui.system.desktop();
      tvproui.Application.desktop = desktop;
      desktop.addListener("desktop-inited", this.onDesktopReady, this);

      //screen.addListener("click", this.onDesktopReady, desktop);
      // 将屏幕层加入显示根
      root.add(desktop, {
        edge : 0
      });

      //全局处理键盘事件
      qx.bom.Event.addNativeListener(document.documentElement, "keydown", qx.lang.Function.bind(this.refreshKeyMap, this));
      qx.bom.Event.addNativeListener(document.documentElement, "keyup", qx.lang.Function.bind(this.refreshKeyMap, this));
    },

    /* end of main */

    /**
     * TODOC
     *
     * @param exception {var} TODOC
     */
    _errorHandler : function(exception)
    {
      var error = exception.toString();
      if (exception.getSourceException)
      {
        var source = exception.getSourceException();
        var stack = source.stack;
        tvproui.AjaxPort.call("common/recordError",
        {
          "error" : error,
          "stack" : stack
        });
      } else
      {
        tvproui.AjaxPort.call("common/recordError",
        {
          "error" : error,
          "stack" : "无记录"
        });
      }
      dialog.Dialog.error("用户界面出现运行错误, 请记录刚刚的操作步骤, 并且联系13913937708 张未波<br/ >" + error);
    },

    /* 刷新键盘映射 */

    /**
     * TODOC
     *
     * @param keyEvent {var} TODOC
     */
    refreshKeyMap : function(keyEvent)
    {
      tvproui.Application.ctrlKey = keyEvent.ctrlKey;

      //监控ctrl键弹起
      if (tvproui.Application.connectionState == "init") {
        return;
      }
      if ((keyEvent.keyCode == 116) || //屏蔽 F5 刷新键
      (keyEvent.ctrlKey && keyEvent.keyCode == 82))//Ctrl + R

      {
        qx.bom.Event.preventDefault(keyEvent);
        tvproui.system.desktop.instance.refreshAll();
        return;
      }
    },

    /* 当桌面初始化完毕 */

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    onDesktopReady : function(e)
    {

      // 加载登录界面
      this._loginWindow = tvproui.Application.desktop.loadWindow(tvproui.user.LoginWindow);
      var page = this.getRoot().getBounds();
      this._loginWindow.moveTo(Math.round((page.width - 522) / 2), Math.round((page.height - 324) / 2) + 20);
      this._loginWindow.addListener("login-success", this.onLoginSuccess, this);
    },

    /* 当登录成功 */

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    onLoginSuccess : function(e)
    {

      //卸载成功事件
      this._loginWindow.removeListener("login-success", this.onLoginSuccess, this);

      // 获取桌面
      var desktop = tvproui.Application.desktop;

      // 加载图标
      desktop.loadICON();

      // 加载任务栏
      var taskPanel = new tvproui.system.taskPanel(tvproui.system.desktop.instance);
      this.getRoot().add(taskPanel,
      {
        top : 0,
        width : "100%"
      });

      // 调整桌面大小
      desktop.setLayoutProperties( {
        top : taskPanel.getHeight()
      });

      // 桌面加载完毕以后开始
      taskPanel.addListenerOnce("appear", function(e)
      {

        //　开始KeepAlive
        var timer = qx.util.TimerManager.getInstance();
        timer.start(this.onKeepAlive, 30000, this, null, 0);
        this.onKeepAlive();
      }, this);

      // 处理窗体退出
      window.onbeforeunload = function() {
        tvproui.Application.logout();
      };
    },


    /**
     * TODOC
     *
     */
    onKeepAlive : function()
    {
      var result = tvproui.AjaxPort.call("User/keepAlive");
      if (null == result)
      {
        if (tvproui.Application.connectionState == "disconnected") {
          return;
        }
        dialog.Dialog.error("您的网络连接已经中断, 请等待网络恢复后再继续其他操作");
        tvproui.Application.connectionState = "disconnected";
        return;
      }
      if (tvproui.Application.connectionState != "connected")
      {
        if (tvproui.Application.connectionState != "init") {
          dialog.Dialog.alert("您的网络连接已经恢复，您可以继续操作");
        }
        tvproui.Application.connectionState = "connected";
      }
      if (result.forceLogout)
      {
        tvproui.Application.logout();
        return;
      }
      if (result.newMessage)
      {
        if (window.webkitNotifications) {
          tvproui.system.taskPanel.showMessage();
        } else {
          tvproui.system.taskPanel.shakeMessagerButton();
        }
        tvproui.system.desktop.instance.refreshAll();
      } else
      {
        if (!window.webkitNotifications) {
          tvproui.system.taskPanel.stopMessagerButton();
        }
      }
    }
  }

  /* end of members */
});
