qx.Class.define('tvproui.control.ui.window.Desktop',
{
  'extend' : qx.ui.window.Desktop,
  'construct' : function()
  {
    this.base(arguments);
    this._windowListLastState = {

    };
  },
  'events' :
  {
    "windowAdded" : "qx.event.type.Data",
    "showDesktopComplete" : "qx.event.type.Event",
    "cascadeWindowsComplete" : "qx.event.type.Event"
  },
  'members' :
  {
    '_cascadeWindowsSemaphore' : 0,
    '_showDesktopSemaphore' : 0,


    /*
    Some functions, as "showDesktop", stores the current state of the window and then,
    the method "restoreWindows", restores the saved state into each window.

    This variable is an object that can contain 2 keys: "methodCalls" and "properties".
    Each key contains an object.

    The functions that store states, inserts the properties of the window in the key "properties"
    and the future method calls in the key "methodCalls".

    For example, a method that stores the current position and size of each window generates
    this content for _windowListLastState:

    _windowLastState = {
     1234567890: {				// This is the hash code of the window
      'properties': {
       'width': X,			// X is the current width of window that has the hash code 1234567890
       'height': Y			// Y is the current height of window that has the hash code 1234567890
      },
      'methodCalls': {
       'moveTo': [Z, W]	// Z is the current left of window that has the hash code 1234567890
            // W is the current height of window that has the hash code 1234567890
      }
     }
    }

    When "restoreWindows" is executed, calls the "set" method of each window to set the properties
    of the last state. Also, calls each method of "methodCalls" collection.

    For example, in this case, restoreWindows makes these calls:
    windowWithHashCode1234567890.set({
     'width': X,
     'height': Y
    });

    windowWithHashCode1234567890.moveTo(Z, W);
    */
    '_windowListLastState' : null,

    /* 覆盖了添加窗口方法 , 增加了窗口已经加入事件 */

    /**
     * TODOC
     *
     * @param element {var} TODOC
     */
    'add' : function(element)
    {
      arguments.callee.base.apply(this, arguments);
      if (element instanceof qx.ui.window.Window)
      {
        this.fireDataEvent('windowAdded', element);

        //				element.addListener('maximize', function () {
        //					this.set('marginTop', 32);
        //				});
        //				element.addListener('restore', function () {
        //					this.set('marginTop', 0);
        //				});
        /*  */
        element.addListener('move', function()
        {
          var bounds = element.getBounds();
          if (bounds.top < 0) {
            element.moveTo(bounds.left, 0);
          }
          var screenBounds = this.getApplicationRoot().getBounds();
          if (bounds.left + bounds.width > screenBounds.width) {
            element.moveTo(screenBounds.width - bounds.width, bounds.top);
          }
        }, this);
      }
    },


    /* element.addListener('close', function () {
     this.remove(element);
     delete element;
    }, this);
    */
    // 恢复窗口位置到保存位置

    /**
     * TODOC
     *
     */
    'restoreWindows' : function()
    {
      var windowList = this.getWindows();
      if (windowList.length > 0)
      {
        for (var i = windowList.length - 1; i >= 0; --i)
        {
          var hashCode = windowList[i].toHashCode();
          if (this._windowListLastState[hashCode])
          {
            if (this._windowListLastState[hashCode]['properties']) {
              windowList[i].set(this._windowListLastState[hashCode]['properties']);
            }
            if (this._windowListLastState[hashCode]['methodCalls']) {
              for (var methodName in this._windowListLastState[hashCode]['methodCalls']) {
                windowList[i][methodName].apply(windowList[i], this._windowListLastState[hashCode]['methodCalls'][methodName]);
              }
            }
          }
        }
        windowList[windowList.length - 1].set('active', true);
      }
    },

    //windowList[windowList.length - 1].focus();
    // 显示桌面

    /**
     * TODOC
     *
     */
    'showDesktop' : function()
    {
      this._windowListLastState = {

      };
      var windowList = this.getWindows();
      for (var i = windowList.length - 1; i >= 0; --i)
      {
        var mode = windowList[i].getMode();
        if (mode != 'minimized')
        {
          if (mode == 'maximized') {
            this._windowListLastState[windowList[i].toHashCode()] = {
              'methodCalls' : {
                'show' : []
              }
            };
          } else {
            this._windowListLastState[windowList[i].toHashCode()] = {
              'methodCalls' :
              {
                'restore' : [],
                'show' : []
              }
            };
          }
          ++this._showDesktopSemaphore;
          var self = this;
          windowList[i].addListenerOnce('minimize', function()
          {
            --self._showDesktopSemaphore;
            if (self._showDesktopSemaphore == 0) {
              self.fireEvent('showDesktopComplete');
            }
          });
          windowList[i].blur();
          windowList[i].minimize();
        }
      }
    },

    //关闭窗口

    /**
     * TODOC
     *
     */
    'closeAll' : function()
    {
      var windowList = this.getWindows();
      for (var i = windowList.length - 1; i >= 0; --i)
      {
        var w = windowList[i];
        if (w.focusClose) {
          w.focusClose();
        } else {
          w.close();
        }
      }
    },

    //关闭窗口

    /**
     * TODOC
     *
     */
    'refreshAll' : function()
    {
      var windowList = this.getWindows();
      for (var i = windowList.length - 1; i >= 0; --i)
      {
        var w = windowList[i];
        if (!w.refresh) {
          continue;
        }
        w.refresh();
      }
    },

    //层叠窗口

    /**
     * TODOC
     *
     */
    'cascadeWindows' : function()
    {
      this._windowListLastState = {

      };
      var windowList = this.getWindows();
      var len = windowList.length;
      if (len == 0) {
        return;
      }
      var parentBounds = this.getBounds();
      var currentXPosition = 20;
      var currentYPosition = 45;
      var distance = 40;
      for (var i = 0; i < len; ++i)
      {
        var Window = windowList[i];
        var mode = Window.getMode();
        var bounds = Window.getBounds();
        switch (mode)
        {
          case 'normal':this._windowListLastState[Window.toHashCode()] = {
            'methodCalls' : {
              'moveTo' : [bounds.left, bounds.top]
            }
          };
          break;
          case 'maximized':this._windowListLastState[Window.toHashCode()] = {
            'methodCalls' : {
              'maximize' : []
            }
          };
          Window.restore();
          break;
          case 'minimized':this._windowListLastState[Window.toHashCode()] = {
            'methodCalls' : {
              'minimize' : []
            }
          };
          Window.show();
          break;
        }
        if (bounds.left != currentXPosition || bounds.top != currentYPosition)
        {
          ++this._cascadeWindowsSemaphore;
          var self = this;
          Window.addListenerOnce('move', function()
          {
            --self._cascadeWindowsSemaphore;
            if (self._cascadeWindowsSemaphore == 0) {
              self.fireEvent('cascadeWindowsComplete');
            }
          });
          if (currentYPosition + bounds.height > parentBounds.height) {
            currentYPosition = parentBounds.height - bounds.height;
          }
          Window.moveTo(currentXPosition, currentYPosition);
        }
        currentXPosition += distance;
        currentYPosition += distance;
      }
      windowList[windowList.length - 1].set('active', true);
      windowList[windowList.length - 1].focus();
    }
  }
});
