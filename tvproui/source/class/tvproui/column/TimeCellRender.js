
/* ************************************************************************
************************************************************************ */
qx.Class.define('tvproui.column.TimeCellRender',
{
  extend : tvproui.control.ui.table.cellrenderer.TimeCellRender,
  construct : function() {
    this.base(arguments);
  },
  members : {


    /**
     * TODOC
     *
     * @param cellInfo {var} TODOC
     * @return {string | var} TODOC
     */
    _getCellStyle : function(cellInfo)
    {
      if (cellInfo.rowData[9] != "" | cellInfo.rowData[10] != "") {
        return "color:#ff8c46;";
      }

      // 未变化，使用默认样式
      if (!cellInfo.rowData[11]) {
        return this.base(arguments, cellInfo);
      }

      // 如果数据变化，用变化样式
      return "color:#468cff;";
    }
  }
});
