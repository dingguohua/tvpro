
/* ************************************************************************
************************************************************************ */
qx.Class.define('tvproui.control.ui.table.celleditor.ImageSelector',
{
  extend : qx.core.Object,
  implement : qx.ui.table.ICellEditorFactory,
  members :
  {
    _cellInfo : null,

    // overridden

    /**
     * TODOC
     *
     * @param cellInfo {var} TODOC
     * @return {var} TODOC
     */
    createCellEditor : function(cellInfo)
    {

      // Create the cell editor window, since we need to return it
      // immediately.
      var cellEditor = new tvproui.gallery.gallery();
      cellEditor.center();
      cellEditor.addListenerOnce("appear", this.onEditorOpen, this);
      this._cellInfo = cellInfo;
      return cellEditor;
    },


    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    onEditorOpen : function(e)
    {
      var cellEditor = e.getTarget();
      cellEditor.setShowClose(true);
    },

    // overridden

    /**
     * TODOC
     *
     * @param cellEditor {var} TODOC
     * @return {var} TODOC
     */
    getCellEditorValue : function(cellEditor)
    {

      // Return the value in the text field
      var cellInfo = this._cellInfo;

      // 处理一同更新的现象
      if (cellEditor.getSelected())
      {
        var model = cellInfo.table.getTableModel();
        var iconCol = cellInfo.col - 1;
        var oldIconID = model.getValue(iconCol, cellInfo.row);
        var newIconID = cellEditor.getIconID();
        model.updateItem(cellInfo.row, iconCol, newIconID, oldIconID);
      } else
      {
        return cellInfo.value;
      }
      return cellEditor.getIconPath();
    }
  },
  destruct : function() {
    this._cellInfo = null;
  }
});
