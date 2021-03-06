
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2006 STZ-IDA, Germany, http://www.stz-ida.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Til Schneider (til132)

************************************************************************ */

/**
 * The default data cell renderer.
 */
qx.Class.define("tvproui.control.ui.spanTable.cellrenderer.Default",
{
  extend : tvproui.control.ui.spanTable.cellrenderer.Abstract,


  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */
  statics :
  {
    STYLEFLAG_ALIGN_RIGHT : 1,
    STYLEFLAG_BOLD : 2,
    STYLEFLAG_ITALIC : 4,
    _numberFormat : null
  },


  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */
  properties : {


    /**
     * Whether the alignment should automatically be set according to the cell value.
     * If true numbers will be right-aligned.
     */
    useAutoAlign :
    {
      check : "Boolean",
      init : true
    }
  },


  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */
  members :
  {


    /**
     * Determines the styles to apply to the cell
     *
     * @param cellInfo {Map} cellInfo of the cell
     *       See {@link qx.ui.table.cellrenderer.Abstract#createDataCellHtml}.
     * @return {Integer} the sum of any of the STYLEFLAGS defined below
     */
    _getStyleFlags : function(cellInfo)
    {
      if (this.getUseAutoAlign()) {
        if (typeof cellInfo.value == "number") {
          return qx.ui.table.cellrenderer.Default.STYLEFLAG_ALIGN_RIGHT;
        }
      }
      return 0;
    },

    // overridden

    /**
     * TODOC
     *
     * @param cellInfo {var} TODOC
     * @return {string | var} TODOC
     */
    _getCellClass : function(cellInfo)
    {
      var cellClass = this.base(arguments, cellInfo);
      if (!cellClass) {
        return "";
      }
      var stylesToApply = this._getStyleFlags(cellInfo);
      if (stylesToApply & qx.ui.table.cellrenderer.Default.STYLEFLAG_ALIGN_RIGHT) {
        cellClass += " qooxdoo-spanTable-cell-right";
      }
      if (stylesToApply & qx.ui.table.cellrenderer.Default.STYLEFLAG_BOLD) {
        cellClass += " qooxdoo-spanTable-cell-bold";
      }
      if (stylesToApply & qx.ui.table.cellrenderer.Default.STYLEFLAG_ITALIC) {
        cellClass += " qooxdoo-spanTable-cell-italic";
      }
      return cellClass;
    },

    // overridden

    /**
     * TODOC
     *
     * @param cellInfo {var} TODOC
     * @return {var} TODOC
     */
    _getContentHtml : function(cellInfo) {
      return qx.bom.String.escape(this._formatValue(cellInfo));
    },


    /**
     * Formats a value.
     *
     * @param cellInfo {Map} A map containing the information about the cell to
     *            create. This map has the same structure as in
     *            {@link qx.ui.table.cellrenderer.Abstract#createDataCellHtml}.
     * @return {String} the formatted value.
     */
    _formatValue : function(cellInfo)
    {
      var value = cellInfo.value;
      var res;
      if (value == null) {
        return "";
      }
      if (typeof value == "string") {
        return value;
      } else if (typeof value == "number")
      {
        if (!qx.ui.table.cellrenderer.Default._numberFormat)
        {
          qx.ui.table.cellrenderer.Default._numberFormat = new qx.util.format.NumberFormat();
          qx.ui.table.cellrenderer.Default._numberFormat.setMaximumFractionDigits(2);
        }
        res = qx.ui.table.cellrenderer.Default._numberFormat.format(value);
      } else if (value instanceof Date) {
        res = qx.util.format.DateFormat.getDateInstance().format(value);
      } else {
        res = value.toString();
      }


      return res;
    }
  }
});
