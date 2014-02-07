
/*************************************************************************
#asset(qx/icon/${qx.icontheme}/22/actions/*)
#asset(qx/icon/${qx.icontheme}/48/places/*)
#asset(qx/icon/${qx.icontheme}/48/categories/*)
#asset(tvproui/startMenu/*)
************************************************************************* */
qx.Class.define('tvproui.system.taskPanel',
{
  'extend' : qx.ui.core.Widget,
  'construct' : function(desktop)
  {
    this.base(arguments);
    this._setLayout(new qx.ui.layout.HBox(0).set( {
      'alignY' : 'middle'
    }));
    this._desktop = desktop;
    this._applyPanelStyle();
    this._createShowDesktopButton();
    this._createCascadeWindowsButton();
    this._createSeparator();
    this._createTaskBar(desktop);
    this._createMenu();
    this._createMessagerButton();
    this._createClock();
    this.addListenerOnce("appear", this.onThisShow, this);
  },
  statics :
  {
    mailIcon : null,
    mailIconAnimate : null,
    mailWindow : null,
    messageMap : {

    },


    /**
     * TODOC
     *
     */
    shakeMessagerButton : function()
    {
      if (tvproui.system.taskPanel.mailWindow)
      {
        tvproui.system.taskPanel.mailWindow.refresh();
        return;
      }
      var mailIconAnimate = tvproui.system.taskPanel.mailIconAnimate;
      if (!mailIconAnimate)
      {
        var shake =
        {
          duration : 2000,
          repeat : "infinite",
          keyFrames :
          {
            0 : {
              translate : "0px"
            },
            10 : {
              translate : "-5px"
            },
            20 : {
              translate : "5px"
            },
            30 : {
              translate : "-5px"
            },
            40 : {
              translate : "5px"
            },
            50 : {
              translate : "-5px"
            },
            60 : {
              translate : "5px"
            },
            70 : {
              translate : "-5px"
            },
            80 : {
              translate : "5px"
            },
            90 : {
              translate : "-5px"
            },
            100 : {
              translate : "0px"
            }
          }
        };
        mailIconAnimate = qx.bom.element.Animation.animate(tvproui.system.taskPanel.mailIcon.getContainerElement().getDomElement(), shake);
        tvproui.system.taskPanel.mailIconAnimate = mailIconAnimate;
      }
      if (!mailIconAnimate.isPlaying()) {
        mailIconAnimate.play();
      }
    },
    showMessage : function()
    {
      if (!window.webkitNotifications) {
        return;
      }
      if (window.webkitNotifications.checkPermission() != 0)
      {

        // 0 is PERMISSION_ALLOWED
        window.webkitNotifications.requestPermission();
        return
      }
      var map = tvproui.system.taskPanel.messageMap;
      var result = tvproui.AjaxPort.call("Message/receiveMessage");
      for (var i = 0, l = result.length; i < l; i++)
      {
        var message = result[i];
        if (message.status == 1) {
          continue;
        }
        if (map[message.ID]) {
          continue;
        }
        map[message.ID] = true;
        window.webkitNotifications.createNotification('resource/tvproui/messager/nomail.png', message.alias + "@长江龙云编排平台 说:", message.subject).show();
        tvproui.AjaxPort.call("Message/setReadStatus", {
          ID : message.ID
        });
      }
    },


    /**
     * TODOC
     *
     */
    stopMessagerButton : function()
    {
      var mailIconAnimate = tvproui.system.taskPanel.mailIconAnimate;
      if (!mailIconAnimate) {
        return;
      }
      mailIconAnimate.pause();
    }
  },
  'members' :
  {

    // 按钮经过样式
    _decoratorSystemButtonMouseOver : null,

    // 显示桌面按钮
    _showDesktopButton : null,

    // 层叠桌面按钮
    _cascadeWindowsButton : null,

    // 菜单
    _menu : null,

    // 日期选择器
    _chooser : null,

    // 时钟
    _clock : null,

    //桌面
    _desktop : null,

    //关于窗口
    _aboutWindow : null,


    /**
     * TODOC
     *
     * @param element {var} TODOC
     */
    'add' : function(element) {
      this._add(element, {
        'flex' : 1
      });
    },


    /**
     * TODOC
     *
     */
    _applyPanelStyle : function()
    {
      this._decoratorSystemButtonMouseOver = new qx.ui.decoration.Single(1, null, "#ffffff");
      var decoratorTaskBar = new qx.ui.decoration.Background().set( {
        backgroundImage : 'tvproui/startMenu/bgTaskBar.png'
      });

      // Main style
      this.set(
      {
        backgroundColor : '#202020',
        padding : 0,
        height : 38,
        maxHeight : 38,
        paddingLeft : 8,
        decorator : decoratorTaskBar
      });
    },


    /**
     * TODOC
     *
     */
    _createShowDesktopButton : function()
    {
      this._showDesktopButton = new qx.ui.basic.Image('tvproui/startMenu/ShowDesktop.png');
      this._showDesktopButton.set(
      {
        focusable : false,
        keepFocus : true,
        padding : 0,
        height : 38,
        maxHeight : 38,
        width : 38,
        maxWidth : 38
      });
      var self = this;
      var desktop = this._desktop;
      var state = true;
      this._showDesktopButton.addListener('click', function() {
        if (state)
        {
          self._acceptWindowEvents = false;
          desktop.showDesktop();
          self._activeShowDesktop = true;
          state = false;
        } else
        {
          self._activeShowDesktop = false;
          desktop.restoreWindows();
          state = true;
        }
      });
      this._showDesktopButton.addListener('mouseover', function() {
        this.setSource('tvproui/startMenu/ShowDesktopDown.png');
      });
      this._showDesktopButton.addListener('mouseout', function() {
        this.setSource('tvproui/startMenu/ShowDesktop.png');
      });
      this.add(this._showDesktopButton);
    },


    /**
     * TODOC
     *
     */
    _createMessagerButton : function()
    {
      var mailIcon = tvproui.system.taskPanel.mailIcon;
      if (!mailIcon)
      {
        mailIcon = new qx.ui.basic.Image('tvproui/messager/nomail.png');
        mailIcon.set(
        {
          focusable : false,
          keepFocus : true,
          padding : [3, 0, 0, 0],
          height : 28,
          maxHeight : 28,
          width : 28,
          maxWidth : 28
        });
        mailIcon.addListener('click', function()
        {
          tvproui.system.taskPanel.stopMessagerButton();
          if (tvproui.system.taskPanel.mailWindow)
          {
            var manager = tvproui.system.desktop.instance.getWindowManager();
            manager.bringToFront(tvproui.system.taskPanel.mailWindow);
            tvproui.system.taskPanel.mailWindow.center();
            return;
          }
          tvproui.system.taskPanel.mailWindow = tvproui.Application.desktop.loadWindow(tvproui.messager.MessagerWindow);
          tvproui.system.taskPanel.mailWindow.addListenerOnce("close", function(e) {
            tvproui.system.taskPanel.mailWindow = null;
          }, this);
        });
        tvproui.system.taskPanel.mailIcon = mailIcon;
      }
      this.add(mailIcon);
    },


    /**
     * TODOC
     *
     */
    _createCascadeWindowsButton : function()
    {
      this._cascadeWindowsButton = new qx.ui.basic.Image('tvproui/startMenu/CascadeWindows.png');
      this._cascadeWindowsButton.set(
      {
        focusable : false,
        keepFocus : true,
        padding : 0,
        height : 38,
        maxHeight : 38,
        width : 38,
        maxWidth : 38
      });
      var self = this;
      var desktop = this._desktop;
      var state = true;
      this._cascadeWindowsButton.addListener('click', function() {
        if (state)
        {
          self._acceptWindowEvents = false;
          desktop.cascadeWindows();
          self._activeCascadeWindows = true;
          state = false;
        } else
        {
          desktop.restoreWindows();
          self._activeCascadeWindows = false;
          state = true;
        }
      });
      this._cascadeWindowsButton.addListener('mouseover', function() {
        this.setSource('tvproui/startMenu/CascadeWindowsDown.png');
      });
      this._cascadeWindowsButton.addListener('mouseout', function() {
        this.setSource('tvproui/startMenu/CascadeWindows.png');
      });
      this.add(this._cascadeWindowsButton);
    },


    /**
     * TODOC
     *
     */
    _createSeparator : function()
    {
      var separator = new qx.ui.basic.Image();
      separator.setSource('tvproui/startMenu/Separator_bar.png');
      separator.setPaddingRight(4);
      this.add(separator);
    },


    /**
     * TODOC
     *
     * @param desktop {var} TODOC
     */
    _createTaskBar : function(desktop)
    {
      this._taskBar = new tvproui.system.taskBar(desktop);
      this.add(this._taskBar);
    },


    /**
     * TODOC
     *
     */
    _createMenu : function()
    {
      var separator = new qx.ui.basic.Image();
      separator.setSource('tvproui/startMenu/Separator_bar.png');
      separator.setPaddingRight(4);
      this.add(separator);
      this.containerMenu = new qx.ui.container.Composite();
      this.containerMenu.setLayout(new qx.ui.layout.HBox());
      this.containerMenu.set( {
        allowGrowX : false
      });
      var menu = new qx.ui.menu.Menu();

      //desplazamiento 4px abajo, 270 grados, color negro 80%, dispersion 9px,
      //var decoratorWidgetMenu = new qx.ui.decoration.Beveled("#364a6a", "#364a88", 1);
      var decoratorWidgetMenu = new qx.ui.decoration.Single(1, null, "#364a88");
      menu.set(
      {
        'backgroundColor' : 'white',
        'padding' : 0,
        'paddingTop' : 4,
        'paddingBottom' : 4,
        'decorator' : decoratorWidgetMenu,
        'marginLeft' : 2,
        'minWidth' : 200,
        'blockerColor' : 'red'
      });

      // ----- events
      var buttonEvents = new qx.ui.menu.Button('事件', 'tvproui/startMenu/irc-voice.png');
      buttonEvents.getChildControl('icon').set(
      {
        'scale' : true,
        'height' : 22,
        'width' : 22
      });
      buttonEvents.set(
      {
        'paddingTop' : 7,
        'paddingBottom' : 7
      });


      /*
      buttonEvents.addListener('execute', function(e) {
          eyeos.execute('events', this.getUserData('checknum'));
      }, this);
      */
      // ----- About eyeOS
      var buttonAbout = new qx.ui.menu.Button('关于我们', 'icon/22/actions/help-about.png');
      buttonAbout.getChildControl('icon').set(
      {
        'scale' : true,
        'height' : 22,
        'width' : 22
      });
      buttonAbout.set(
      {
        'paddingTop' : 7,
        'paddingBottom' : 7
      });
      buttonAbout.addListener('execute', function(e) {
        tvproui.Application.desktop.loadWindow(tvproui.system.aboutWindow);
      }, this);

      // ----- Administration
      var buttonAdministration = new qx.ui.menu.Button('Administration', 'icon/22/actions/system-run.png');
      buttonAdministration.getChildControl('icon').set(
      {
        'scale' : true,
        'height' : 22,
        'width' : 22
      });
      buttonAdministration.set(
      {
        'paddingTop' : 7,
        'paddingBottom' : 7
      });


      /*
      buttonAdministration.addListener('execute', function(e) {
          eyeos.execute('usermanagement', this.getUserData('checknum'));
      }, this);
      */
      // ----- preferences
      var buttonPreferences = new qx.ui.menu.Button('用户配置', 'tvproui/startMenu/configure.png');
      buttonPreferences.getChildControl('icon').set(
      {
        'scale' : true,
        'height' : 22,
        'width' : 22
      });
      buttonPreferences.set(
      {
        'paddingTop' : 7,
        'paddingBottom' : 7
      });
      buttonPreferences.addListener('execute', function(e) {
        tvproui.Application.desktop.loadWindow(tvproui.user.UserPerference);
      }, this);

      // ----- sign out
      var buttonSignOut = new qx.ui.menu.Button('注销', 'icon/22/actions/dialog-close.png');
      buttonSignOut.getChildControl('icon').set(
      {
        'scale' : true,
        'height' : 22,
        'width' : 22
      });
      buttonSignOut.set(
      {
        'paddingTop' : 7,
        'paddingBottom' : 7
      });
      buttonSignOut.addListener('execute', function(e) {
        tvproui.Application.logout();
      }, this);


      /* TODO:完成事件功能后再开放事件功能
      menu.add(buttonEvents);
      menu.add(new qx.ui.menu.Separator());
      */
      menu.add(buttonAbout);
      if (this.getUserData('admin')) {
        menu.add(buttonAdministration);
      }
      menu.add(buttonPreferences);
      menu.add(buttonSignOut);
      menu.setOpener(this.containerMenu);
      this.menuImage = new qx.ui.basic.Image();
      this.menuImage.addListener('click', function(e)
      {
        e.stopPropagation();
        menu.open();
      }, this);
      this.menuImage.addListener('mouseover', function(e) {
        this.menuImage.setSource('tvproui/startMenu/Menu_open.png');
      }, this);
      this.menuImage.addListener('mouseout', function(e) {
        this.menuImage.setSource('tvproui/startMenu/Menu_closed.png');
      }, this);
      this.menuImage.setSource('tvproui/startMenu/Menu_closed.png');
      this.containerMenu.add(this.menuImage);
      this.add(this.containerMenu);
      var separator = new qx.ui.basic.Image();
      separator.setSource('tvproui/startMenu/Separator_bar.png');
      this._menu = menu;
    },


    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _tickTock : function(e)
    {
      var clock = this._clock;
      var d = new Date();
      var a_p = "";
      var curr_hour = d.getHours();
      if (curr_hour < 12) {
        a_p = "am";
      } else {
        a_p = "pm";
      }
      if (curr_hour == 0) {
        curr_hour = 12;
      }
      if (curr_hour > 12) {
        curr_hour = curr_hour - 12;
      }
      var curr_min = d.getMinutes();
      var day = d.getDay();
      switch (day)
      {
        case 0:day = '周日';
        break;
        case 1:day = '周一';
        break;
        case 2:day = '周二';
        break;
        case 3:day = '周三';
        break;
        case 4:day = '周四';
        break;
        case 5:day = '周五';
        break;
        case 6:day = '周六';
        break;
      }
      if (curr_min < 10) {
        curr_min = '0' + curr_min;
      }
      var hour = curr_hour + ':' + curr_min + a_p + '&nbsp;&nbsp; | &nbsp;&nbsp;' + day;
      clock.setValue('<span style="color:#ffffff;font-size:12px;font-family:Microsoft YaHei;font-weight:bold">' + hour + '</span>');
    },


    /**
     * TODOC
     *
     */
    _createClock : function()
    {
      var clock = new qx.ui.basic.Label();
      this._clock = clock;
      clock.set(
      {
        paddingRight : 15,
        marginTop : 5,
        rich : true,
        height : 38,
        minWidth : 136,
        paddingTop : 8,
        paddingLeft : 15
      });

      /* 初始化时钟 */
      this._tickTock.call(this);
      this.timer = new qx.event.Timer(2000);
      this.timer.addListener('interval', this._tickTock, this);
      this.timer.start();
      clock.addListener('click', function(e)
      {
        if (!this._chooser)
        {
          this._chooser = new qx.ui.control.DateChooser();
          qx.core.Init.getApplication().getRoot().add(this._chooser,
          {
            top : 38,
            right : 5
          });
          this._chooser.setUserData('shown', true);
          this._chooser.setValue(new Date());
          this._chooser.set( {
            zIndex : 90000
          });
          return;
        }
        if (this._chooser.getUserData("shown") == true)
        {
          this._chooser.hide();
          this._chooser.setUserData("shown", false);
        } else
        {
          this._chooser.show();
          this._chooser.setUserData("shown", true);
        }
      }, this);
      clock.addListener('resize', function(e)
      {
        var offset = clock.getBounds().width;
        this._menu.setOffsetLeft(offset);
      }, this);
      this.add(clock);
    },


    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    onThisShow : function(e) {
      qx.bom.element.Animation.animate(this.getContainerElement().getDomElement(),
      {
        duration : 200,
        alternate : true,
        keyFrames :
        {
          0 : {
            "top" : "-90px"
          },
          100 : {
            "top" : "0px"
          }
        }
      });
    }
  }
});
