
/* ************************************************************************
************************************************************************ */
qx.Class.define('tvproui.control.ui.table.celleditor.TagEditor',
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

      // Create the cell editor window, since we need to return it
      // immediately.
      var cellEditor = new tvproui.tag.instance.TagInstanceTable(cellInfo.table);
      cellEditor.center();
      cellEditor.addListener("appear", this.onEditorOpen, this);
      cellEditor.addListener("close", this.onEditorClose, this);
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


    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    onEditorClose : function(e)
    {
      var cellEditor = e.getTarget();
      cellEditor.removeListener("close", this.onEditorClose, this);
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
      var result =
      {
        datas : cellEditor.readData(),
        tempDatas : cellEditor.readTempDatas()
      };

      //从标签处获取新数据，并且保存
      return result;
    }
  },
  destruct : function() {
  }
});
