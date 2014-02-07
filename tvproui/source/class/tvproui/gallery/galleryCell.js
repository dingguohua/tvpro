
/*
*****************************************************************************
   GALLERY CELL
*****************************************************************************
*/
qx.Class.define("tvproui.gallery.galleryCell",
{
  extend : qx.ui.virtual.cell.AbstractWidget,
  members :
  {


    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    _createWidget : function()
    {
      var widget = new qx.ui.basic.Atom().set( {
        iconPosition : "top"
      });
      widget.getChildControl("label").set( {
        padding : [0, 4]
      });
      widget.getChildControl("icon").set( {
        padding : 4
      });
      widget.getChildControl("icon").set(
      {
        width : 48,
        height : 48,
        scale : true
      });
      return widget;
    },


    /**
     * TODOC
     *
     * @param widget {var} TODOC
     * @param data {var} TODOC
     */
    updateData : function(widget, data) {
      widget.set(
      {
        icon : data.icon,
        label : data.label
      });
    },


    /**
     * TODOC
     *
     * @param widget {var} TODOC
     * @param states {var} TODOC
     */
    updateStates : function(widget, states)
    {
      var label = widget.getChildControl("label");
      var icon = widget.getChildControl("icon");
      if (states.selected)
      {
        label.setDecorator("selected");
        label.setTextColor("text-selected");
        icon.setDecorator("group");
      } else
      {
        label.resetDecorator();
        label.resetTextColor();
        icon.resetDecorator();
      }
    }
  },
  destruct : function() {
  }
});
