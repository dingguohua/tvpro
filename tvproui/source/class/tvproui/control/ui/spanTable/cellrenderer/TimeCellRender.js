
/* ************************************************************************
************************************************************************ */
qx.Class.define('tvproui.control.ui.spanTable.cellrenderer.TimeCellRender',
{
  extend : tvproui.control.ui.spanTable.cellrenderer.Default,
  members : {

    // overridden

    /**
     * TODOC
     *
     * @param cellInfo {var} TODOC
     * @return {var} TODOC
     */
    _getContentHtml : function(cellInfo)
    {
      cellInfo.value = cellInfo.value.toString2();
      return this.base(arguments, cellInfo);
    }
  }
});
