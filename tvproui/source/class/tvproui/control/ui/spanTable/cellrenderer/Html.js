
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2007 OpenHex SPRL, http://www.openhex.org

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Dirk Wellmann (dw(at)piponline.net)

************************************************************************ */

/**
 * This Cellrender is for transparent use, without escaping! Use this Cellrender
 * to output plain HTML content.
 */
qx.Class.define("tvproui.control.ui.spanTable.cellrenderer.Html",
{
  extend : tvproui.control.ui.spanTable.cellrenderer.Conditional,


  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */
  members :
  {

    // overridden

    /**
     * TODOC
     *
     * @param cellInfo {var} TODOC
     * @return {var} TODOC
     */
    _getContentHtml : function(cellInfo) {
      return (cellInfo.value || "");
    },

    // overridden

    /**
     * TODOC
     *
     * @param cellInfo {var} TODOC
     * @return {string} TODOC
     */
    _getCellClass : function(cellInfo) {
      return "qooxdoo-spanTable-cell";
    }
  }
});
