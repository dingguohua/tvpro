
/* ************************************************************************

   Copyright:

   License:

   Authors:

************************************************************************ */

/* ************************************************************************

#asset(qx/icon/${qx.icontheme}/48/places/*)
#asset(qx/icon/${qx.icontheme}/48/categories/*)
#asset(tvproui/*)
* ************************************************************************ */
qx.Class.define("tvproui.system.icon",
{
  extend : qx.ui.basic.Atom,
  construct : function(name, image, tooltiptext, func, that, argument)
  {

    // 构造函数
    this.base(arguments, name, image);

    // 构造提示字符串
    var tooltipContent = tooltiptext ? "<div>" + name + ": <b>" + tooltiptext + "</b></div>" : "<div>" + name + "</div>";

    // 设定图标位置，字体，留白以及提示内容
    this.set(
    {
      'iconPosition' : 'top',
      'font' : new qx.bom.Font(tvproui.system.icon.defaultLabelFontSize, ['Microsoft YaHei', 'SimHei']),
      'textColor' : tvproui.system.icon.defaultLabelFontColor,
      'padding' : tvproui.system.icon.defaultIconPadding,
      'toolTipText' : tooltipContent
    });

    //  todo:验证 设置标题
    var label = this.getChildControl('label');
    label.set(
    {
      allowGrowX : true,
      allowGrowY : true,
      rich : true,
      wrap : true,
      textAlign : "center"
    });

    // 设置单击选中图标效果
    this.addListener('click', this.onClick, this);
    this.addListener('mousedown', this.onClick, this);
    this.addListener('dblclick', this.onDBClick, this);

    //记录稍后单击后出发的函数调用，上下文以及参数
    this._func = func;
    this._that = that;
    this._argument = argument;
  },
  statics :
  {
    defaultIconPadding : 2,
    defaultLabelFontColor : '#474646',
    defaultLabelFontSize : 12
  },


  /*
  *****************************************************************************
  MEMBERS
  *****************************************************************************
  */
  members :
  {
    _func : null,
    _that : null,
    _argument : null,

    /* 单击时处理选中效果 */

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    onClick : function(e)
    {
      if (this.controlKeyPressed) {
        tvproui.control.ui.section.Manager.getInstance().addToSelection(e.getTarget());
      } else {
        tvproui.control.ui.section.Manager.getInstance().singleSelect(e.getTarget());
      }
      e.stopPropagation();
    },

    /* 双击时执行调用函数 */

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    onDBClick : function(e)
    {
      tvproui.control.ui.section.Manager.getInstance().clearSelection();
      e.stopPropagation();
      if (!this._func) {
        return;
      }
      this._func.call(this._that, this._argument);
    }
  }

  /* end of members */
});
