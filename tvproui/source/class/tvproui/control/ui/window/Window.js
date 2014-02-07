
/**
 * @author WeiboZhang
 */

/* ************************************************************************
#asset(qx/icon/${qx.icontheme}/22/actions/*)
************************************************************************ */
qx.Class.define("tvproui.control.ui.window.Window",
{
  extend : qx.ui.window.Window,
  statics :
  {
    instanceCountMap : {

    },
    applicationName : "默认窗口",
    applicationIcon : "icon/22/actions/window-new.png",
    canMultipleSupport : true,


    /**
     * TODOC
     *
     * @param newClass {var} TODOC
     * @return {boolean} TODOC
     */
    canCreateNew : function(newClass)
    {
      var map = tvproui.control.ui.window.Window.instanceCountMap;
      var application = newClass.applicationName;
      var count = map[application];
      count = count ? count : 0;
      if (count > 0 && !newClass.canMultipleSupport)
      {
        dialog.Dialog.error("对不起，本窗口不允许同时打开多个实例，请关闭后重新打开!");
        return false;
      }
      return true;
    }
  },
  construct : function(windowName)
  {
    var constructor = this.constructor;
    windowName = windowName ? windowName : constructor.applicationName;
    this.base(arguments, windowName, constructor.applicationIcon);
    this.addListenerOnce("appear", this._onShow, this);
    var map = tvproui.control.ui.window.Window.instanceCountMap;
    var application = this.constructor.applicationName;
    var count = map[application];
    count = count ? count : 0;

    /* 对目前窗口数量进行计数 */
    map[application] = ++count;

    /* 加入桌面 */
    tvproui.system.desktop.instance.add(this);
  },
  members :
  {

    /* 重载Close实现窗口计数器 */

    /**
     * TODOC
     *
     */
    close : function()
    {
      var map = tvproui.control.ui.window.Window.instanceCountMap;
      var application = this.constructor.applicationName;
      var count = map[application];
      if (count == 0)
      {
        dialog.Dialog.error("异常的窗口数量，请立即保存，汇报Bug，并刷新界面重新装载界面!");
        return;
      }

      /* 对目前窗口数量进行计数 */
      map[application] = --count;

      /* 从桌面卸载此窗口 */
      tvproui.system.desktop.instance.remove(this);
      var children = tvproui.system.desktop.instance.getWindows();
      if (children.length > 0) {
        children[children.length - 1].focus();
      }
      this.base(arguments);

      // 释放所有与界面相关的内容
      this.dispose();
    },


    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onShow : function(e)
    {
      if (qx.core.Environment.get("browser.name") != "chrome") {
        return;
      }
      var element = this.getChildControl("captionbar").getContainerElement().getDomElement();
      var captionBar = element.children[1];
      if (!captionBar) {
        return;
      }
      var captionBarStyle = captionBar.style;
      captionBarStyle["background-image"] = "-webkit-linear-gradient(270deg, rgba(27, 163, 185, 0.5) 30%, rgba(69, 186, 208, 0.5) 70%)";
    }
  }
});
