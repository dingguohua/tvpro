
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
   * Fabian Jakobs (fjakobs)
   * Jonathan Weiß (jonathan_rass)
   * Christian Hagendorn (chris_schmidt)

************************************************************************ */
qx.Class.define("tvproui.messager.messenger.Roster",
{
  extend : qx.ui.core.Widget,
  construct : function()
  {
    this.base(arguments);
    var layout = new qx.ui.layout.VBox();
    this._setLayout(layout);
    var list = this.list = new qx.ui.list.List();
    list.set(
    {
      scrollbarX : "off",
      scrollbarY : "auto",
      width : 300,
      height : 300,
      itemHeight : 68,
      decorator : null,
      autoGrouping : false
    });
    list.setDelegate(this);
    this._add(list, {
      flex : 1
    });
    this.initModel(new qx.data.Array());
    this.initSelection(list.getSelection());
    this.bind("model", list, "model");

    // configure row colors
    var rowLayer = list.getChildControl("row-layer");
    rowLayer.set(
    {
      colorEven : "progressive-table-row-background-even",
      colorOdd : "progressive-table-row-background-odd"
    });
    list.getSelection().addListener("change", function(e) {
      list.getSelection().getItem(0).setStatus(1);
    }, this);
  },

  // Creates the prefetch behavior

  /*
  new qx.ui.virtual.behavior.Prefetch(
    list,
    {
      minLeft : 0,
      maxLeft : 0,
      minRight : 0,
      maxRight : 0,
      minAbove : 600,
      maxAbove : 800,
      minBelow : 600,
      maxBelow : 800
    }
  ).set({
    interval: 500
  });
  */
  properties :
  {
    model :
    {
      check : "qx.data.Array",
      event : "changeModel",
      nullable : false,
      deferredInit : true
    },
    selection :
    {
      check : "qx.data.Array",
      event : "changeSelection",
      nullable : false,
      deferredInit : true
    }
  },
  members :
  {


    /*
    ---------------------------------------------------------------------------
      DELEGATE IMPLEMENTATION
    ---------------------------------------------------------------------------
    */

    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    createItem : function() {
      return new tvproui.messager.messenger.MessageControl();
    },


    /**
     * TODOC
     *
     * @param controller {var} TODOC
     * @param item {var} TODOC
     * @param id {var} TODOC
     */
    bindItem : function(controller, item, id)
    {
      controller.bindProperty("dataID", "dataID", null, item, id);
      controller.bindProperty("name", "name", null, item, id);
      controller.bindProperty("avatar", "avatar", null, item, id);
      controller.bindProperty("status", "status", null, item, id);
      controller.bindProperty("content", "content", null, item, id);
      controller.bindProperty("attachment", "attachment", null, item, id);
    }
  }
});