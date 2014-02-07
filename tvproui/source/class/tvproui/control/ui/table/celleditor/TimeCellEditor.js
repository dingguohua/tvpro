
/* ************************************************************************
************************************************************************ */
qx.Class.define('tvproui.control.ui.table.celleditor.TimeCellEditor',
{
  extend : tvproui.control.ui.table.celleditor.AbstractField,
  members :
  {
    lastValue : null,
    _createEditor : function()
    {
      var cellEditor = new tvproui.control.ui.form.TimeSpinner();
      return cellEditor;
    },


    /**
     * TODOC
     *
     * @param cellInfo {var} TODOC
     * @return {var} TODOC
     */
    createCellEditor : function(cellInfo)
    {
      this.lastValue = cellInfo.value;
      var cellEditor = this._createEditor();
      cellEditor.originalValue = cellInfo.value;
      cellEditor.setValue(cellInfo.value);
      cellEditor.addListener("appear", function() {
        cellEditor.selectAllText();
      });
      return cellEditor;
    },

    // overridden

    /**
     * TODOC
     *
     * @param cellInfo {var} TODOC
     * @return {var} TODOC
     */
    getCellEditorValue : function(cellEditor) {
      return cellEditor.getValue();
    }
  },
  destruct : function() {
    this.lastValue = null;
  }
});
