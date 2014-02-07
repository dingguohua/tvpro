
/* ************************************************************************

#asset(qx/icon/${qx.icontheme}/16/places/user-desktop.png)
#asset(qx/icon/${qx.icontheme}/16/status/dialog-information.png)

************************************************************************ */
qx.Class.define("tvproui.user.RegionTreeItem",
{
  extend : qx.ui.tree.VirtualTreeItem,
  properties :
  {
    ID : {
      check : "String"
    },
    permissions : {
      check : "Integer"
    },
    path :
    {
      check : "String",
      event : "changePath"
    },
    checked :
    {
      check : "Boolean",
      event : "changeChecked",
      nullable : true
    }
  },
  members :
  {
    __checkbox : null,


    /**
     * TODOC
     *
     */
    _addWidgets : function()
    {

      // Here's our indentation and tree-lines
      this.addSpacer();
      this.addOpenButton();

      // The standard tree icon follows
      this.addIcon();

      /* a.ID,a.parentID,a.level,a.name,a.type,b.imagename,b.desc,b.path */
      // A checkbox comes right after the tree icon
      var checkbox = this.__checkbox = new qx.ui.form.CheckBox();
      this.bind("checked", checkbox, "value");
      checkbox.bind("value", this, "checked");
      checkbox.setFocusable(false);
      checkbox.setTriState(true);
      checkbox.setMarginRight(4);
      this.addWidget(checkbox);

      // The label
      this.addLabel();
    }
  },

  // 界面之外的内容释放
  destruct : function() {

    // 释放非显示层级对象
    // 去除多余的引用
    this.__checkbox = null;
  }
});
