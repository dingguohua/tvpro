
/* ************************************************************************
************************************************************************ */
qx.Class.define('tvproui.control.ui.table.celleditor.ColorSelector',
{
  extend : qx.core.Object,
  implement : qx.ui.table.ICellEditorFactory,
  members :
  {

    // overridden

    /**
     * TODOC
     *
     * @param cellInfo {var} TODOC
     * @return {var} TODOC
     */
    createCellEditor : function(cellInfo)
    {
      var model = cellInfo.table.getTableModel();
      var color = model.getValue(cellInfo.col, cellInfo.row);

      // Create the cell editor window, since we need to return it
      // immediately.
      var cellEditor = new tvproui.system.ColorSelectorWindow(color);
      cellEditor.center();
      cellEditor.addListenerOnce("appear", this.onEditorOpen, this);
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
    getCellEditorValue : function(cellEditor) {
      return cellEditor.getValue();
    }
  },
  destruct : function() {
  }
});
