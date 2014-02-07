qx.Class.define('tvproui.system.taskBar',
{
  extend : qx.ui.container.SlideBar,
  construct : function(desktop)
  {
    this.base(arguments);
    this._taskButtons = {

    };
    this._desktop = desktop;

    // 将已经出现的窗口加入显示, 一般来说是没有的
    var windowList = desktop.getWindows();
    for (var i = 0; i < windowList.length; ++i) {
      this.addWindow(windowList[i]);
    }

    // 新加入窗口显示
    desktop.addListener('windowAdded', function(data) {
      this.addWindow(data.getData());
    }, this);
  },
  members :
  {
    _desktop : null,
    _taskButtons : null,


    /**
     * TODOC
     *
     * @param taskButton {var} TODOC
     */
    addTaskButton : function(taskButton)
    {
      if (taskButton instanceof tvproui.system.taskBarButton) {
        this._taskButtons[taskButton.toHashCode()] = taskButton;
      }
      this.add(taskButton);
    },


    /**
     * TODOC
     *
     * @param window {var} TODOC
     */
    addWindow : function(window)
    {


      /**
       * The taskbar receives when a new window is created.
       *
       * If the application is in our favorites we loop through the current task favorite buttons and locate
       * the one that matches the application name, if this button has opened a window we create a new one,
       * if it's not we should convert the "fav button" that is currently in our taskbar. In both cases the
       * resulting button will be stored on this._taskButtons[hashCode]
       *
       * Then the listeners are added
       */
      var hashCode = window.toHashCode();
      var flag = false;
      this._taskButtons[hashCode] = new tvproui.system.taskBarButton(window.getCaption(), window.getIcon());
      this._taskButtons[hashCode]._window = window;

      //window._taskButton = this._taskButtons[hashCode];
      window.addListener('close', function() {
        this.removeWindow(window);
      }, this);


      /**
       * Due to the bug of qooxdoo with the window "focusin" here is a basic solution which selects/unselects a
       * button in the taskbar if the related window changes its active state.
       */
      window.addListener('changeActive', function() {
        if (this._taskButtons[hashCode]) {
          if (window.get('active')) {
            this.selectTaskButton(this._taskButtons[hashCode]);
          } else {
            this.unselectTaskButton(this._taskButtons[hashCode]);
          }
        }
      }, this);

      // click behavior
      this._taskButtons[hashCode].clickEvent = this._taskButtons[hashCode].addListener('click', function(e) {
        if (this.get('value'))
        {

          // Restore the window (maybe is minimized)
          window.show();

          // Give the focus to the window
          window.set('active', true);
          window.focus();
        } else
        {
          if (window.get('allowMinimize')) {
            window.minimize();
          }
        }
      });


      /**
       * We store this event in a variable due to we'll have to remove it to avoid false selections when closing windows
       */
      this._taskButtons[hashCode].checkedEvent = this._taskButtons[hashCode].addListener('changeValue', function(e) {
        if (this.isValue()) {
          this._buttonWithFocus();
        } else {
          this._buttonWithoutFocus();
        }
      });
      if (!flag) {
        this.addTaskButton(this._taskButtons[hashCode]);
      }
    },


    /**
     * TODOC
     *
     * @param taskButton {var} TODOC
     */
    removeTaskButton : function(taskButton) {
      this.remove(taskButton);
    },


    /**
     * TODOC
     *
     * @param window {var} TODOC
     */
    removeWindow : function(window)
    {
      var hashCode = window.toHashCode();
      if (this._taskButtons[hashCode])
      {
        this.removeTaskButton(this._taskButtons[hashCode]);
        delete this._taskButtons[hashCode];
      }
    },


    /**
     * TODOC
     *
     * @param taskButton {var} TODOC
     */
    selectTaskButton : function(taskButton) {
      taskButton.set('value', true);
    },


    /**
     * TODOC
     *
     * @param taskButton {var} TODOC
     */
    unselectTaskButton : function(taskButton) {
      taskButton.set('value', false);
    }
  }
});
