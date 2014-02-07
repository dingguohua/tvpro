
/* ************************************************************************
************************************************************************ */
qx.Class.define('tvproui.control.ui.table.celleditor.LabelEditor',
{
  extend : qx.ui.table.celleditor.TextField,
  members :
  {
    _lastValue : null,


    /**
     * TODOC
     *
     * @param cellInfo {var} TODOC
     * @return {var} TODOC
     */
    createCellEditor : function(cellInfo)
    {
      this._lastValue = cellInfo.value;
      cellInfo.value = cellInfo.value.label;
      var editor = this.base(arguments, cellInfo);
      editor.setValue(this._lastValue.label);
      return editor;
    },

    // overridden

    /**
     * TODOC
     *
     * @param cellInfo {var} TODOC
     * @return {var} TODOC
     */
    getCellEditorValue : function(cellInfo)
    {
      var result = this.base(arguments, cellInfo);
      if (cellInfo.originalValue == result) {
        return this._lastValue;
      }
      this._lastValue = qx.lang.Object.clone(this._lastValue);
      this._lastValue.label = result;
      return qx.lang.Object.clone(this._lastValue);
    }
  },
  destruct : function() {
    this._lastValue = null;
  }
});
