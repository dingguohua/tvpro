
/**
 * @author Administrator
 */

/* ************************************************************************
#asset(qx/icon/${qx.icontheme}/22/actions/*)
************************************************************************ */
qx.Class.define("tvproui.system.ColorSelectorWindow",
{
  extend : tvproui.control.ui.window.Window,
  statics :
  {
    applicationName : "选择颜色",
    applicationIcon : "icon/22/places/network-server.png",
    canMultipleSupport : true
  },
  construct : function(value)
  {
    this.base(arguments);
    var layout = new qx.ui.layout.Grid(10, 10);
    layout.setColumnAlign(1, "right", "middle");
    layout.setColumnFlex(0, 1);
    this.setLayout(layout);
    var selector = new qx.ui.control.ColorSelector();
    if (value)
    {
      selector.setValue(value);
      this._selectedColor = value;
    } else
    {
      this._selectedColor = "#ffffff";
    }
    this._selector = selector;
    this.add(selector,
    {
      row : 0,
      column : 0,
      colSpan : 3
    });
    var okButton = new qx.ui.form.Button("确定", "icon/22/actions/dialog-apply.png");
    okButton.addListenerOnce("execute", function(e)
    {
      this._selectedColor = this._selector.getValue();
      this.close();
    }, this);
    this.add(okButton,
    {
      row : 1,
      column : 1
    });
    var closebutton = new qx.ui.form.Button("取消", "icon/22/actions/dialog-cancel.png");
    closebutton.addListenerOnce("execute", function(e) {
      this.close();
    }, this);
    this.add(closebutton,
    {
      row : 1,
      column : 2
    });
  },
  members :
  {
    _selectedColor : null,
    _selector : null,


    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    getValue : function() {
      return this._selector.getValue();
    }
  },

  // 界面之外的内容释放
  destruct : function()
  {

    // 释放非显示层级对象
    // 去除多余的引用
    this._selector = null;
    this._selectedColor = null;
  }
});
