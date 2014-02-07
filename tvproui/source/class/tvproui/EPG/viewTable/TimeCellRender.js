
/* ************************************************************************
************************************************************************ */
qx.Class.define('tvproui.EPG.viewTable.TimeCellRender',
{
  extend : tvproui.control.ui.spanTable.cellrenderer.TimeCellRender,
  construct : function() {
    this.base(arguments);
  },
  members :
  {


    /**
     * TODOC
     *
     * @param cellInfo {var} TODOC
     * @param element {var} TODOC
     */
    updateCellStatus : function(cellInfo, element)
    {
      this.base(arguments, cellInfo, element);
      var tableModel = cellInfo.table.getTableModel();
      var node = tableModel.getNodeByRowColumn(cellInfo.col, cellInfo.row);
      var columnData = node.columnData;
      var style = element.style;
      if (columnData.intersection != "" || columnData.spare != "" || columnData.durationcalc != "")
      {
        style.color = "#cc1515";
        return;
      }

      // 未变化，使用默认样式
      if (!columnData.changed) {
        return;
      }

      // 如果数据变化，用变化样式
      style.color = "#0000ff";
    },


    /**
     * TODOC
     *
     * @param cellInfo {var} TODOC
     * @return {string | var} TODOC
     */
    _getCellStyle : function(cellInfo)
    {
      var tableModel = cellInfo.table.getTableModel();
      var node = tableModel.getNodeByRowColumn(cellInfo.col, cellInfo.row);
      var columnData = node.columnData;
      var defaultStyle = this.base(arguments, cellInfo);
      if (columnData.intersection != "" | columnData.spare != "" || columnData.durationcalc != "") {
        return defaultStyle + "color:#cc1515;";
      }

      // 未变化，使用默认样式
      if (!columnData.changed) {
        return defaultStyle;
      }

      // 如果数据变化，用变化样式
      return defaultStyle + "color:#0000ff;";
    }
  }
});
