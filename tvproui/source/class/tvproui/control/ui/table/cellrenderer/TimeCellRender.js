
/* ************************************************************************
************************************************************************ */
qx.Class.define('tvproui.control.ui.table.cellrenderer.TimeCellRender',
{
  extend : qx.ui.table.cellrenderer.String,
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
      cellInfo.value = cellInfo.value.toDayString();
      return this.base(arguments, cellInfo);
    }
  }
});
