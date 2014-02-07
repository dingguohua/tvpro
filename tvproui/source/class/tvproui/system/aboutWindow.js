
/*************************************************************************
#asset(tvproui/*)
#asset(tvproui/aboutUS/*)
************************************************************************* */
qx.Class.define('tvproui.system.aboutWindow',
{
  extend : tvproui.control.ui.window.Window,
  statics :
  {
    applicationName : "关于",
    applicationIcon : "tvproui/iconSmall.png",
    canMultipleSupport : true,
    developerList : ["项目总监: 成斌", "人员统筹: 唐陆峰 陈莉", "前台开发: 杨磊磊(实习) 张未波", "后台开发: 杨磊磊(实习) 程海天 丁国华", "美工: 嵇木子", "测试组: 程海天 谢灯红 张颖 刘娟 王亚男 芦婷婷", "长江龙新媒体公司版权所有"]
  },
  construct : function()
  {
    this.base(arguments);
    this.setWidth(300);
    this.setShowMaximize(false);
    this.setAllowMaximize(false);
    var winLayout = new qx.ui.layout.VBox();
    this.setLayout(winLayout);
    this.setAppearance("tvproAbout");
    var logocomposite = new qx.ui.container.Composite(new qx.ui.layout.HBox());
    logocomposite.setBackgroundColor("white");
    var logo = new qx.ui.basic.Image();
    logo.set(
    {
      source : 'tvproui/aboutUS/content.jpg',
      width : 273,
      height : 245
    });
    logocomposite.add(new qx.ui.core.Spacer(), {
      flex : 1
    });
    logocomposite.add(logo);
    logocomposite.add(new qx.ui.core.Spacer(), {
      flex : 1
    });
    var textcomposite = new qx.ui.container.Composite(new qx.ui.layout.HBox());
    var text = new qx.ui.basic.Label();
    text.set(
    {
      value : '<div style="font-size:20px;"><center>版本 1.0<br /><span style="font-size:9pt">$Revision: 2808 $</span><br /></center></div>',
      rich : true
    });
    textcomposite.add(new qx.ui.core.Spacer(), {
      flex : 1
    });
    textcomposite.add(text);
    textcomposite.add(new qx.ui.core.Spacer(), {
      flex : 1
    });
    textcomposite.setBackgroundColor("white");

    /* <span style="font-size:12px">长江龙新媒体公司版权所有</span> */
    var developerComposite = new qx.ui.container.Composite(new qx.ui.layout.HBox());
    var developer = new qx.ui.basic.Label("张未波 丁国华 嵇木子");
    developer.set(
    {
      value : '<div style="font-size:12px;"><center>' + tvproui.system.aboutWindow.developerList[0] + '</center></div>',
      rich : true
    });
    this._developer = developer;
    var timer = qx.util.TimerManager.getInstance();

    // 界面逻辑和数据逻辑分离timer
    this._timerID = timer.start(this._onTimer, 2000, this, 2000);


    developerComposite.add(new qx.ui.core.Spacer(), {
      flex : 1
    });
    developerComposite.add(developer);
    developerComposite.add(new qx.ui.core.Spacer(), {
      flex : 1
    });
    developerComposite.setBackgroundColor("white");
    this.add(logocomposite);
    this.add(textcomposite);
    this.add(developerComposite);
  },
  members : {
    _listPos : 0,
    _timerID: null,
    _developer: null,

    _onTimer: function(userData, timerId)
    {
      var list = tvproui.system.aboutWindow.developerList;
      if (this._listPos >= (list.length - 1))
      {
        var timer = qx.util.TimerManager.getInstance();
        timer.stop(timerId);
        return;
      }
      var content = list[(++this._listPos)];
      this._developer.setValue('<div style="font-size:12px;"><center>' + content + '</center></div>');
    }
  },

  // 界面之外的内容释放
  destruct : function()
  {

    // 释放非显示层级对象
    var timer = qx.util.TimerManager.getInstance();

    // 界面逻辑和数据逻辑分离timer
    timer.stop(this._timerID);

    // 去除多余的引用
    this._listPos = null;
    this._timerID = null;
    this._developer = null;
  }
});
