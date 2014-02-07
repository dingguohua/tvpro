
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2008 Derrell Lipman

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Derrell Lipman (derrell)

************************************************************************ */

/**
 * A debug cell editor.  This displays cellInfo.value using
 * {@link qx.dev.Debug#debugObjectToString} so is useful as a starting point
 * during development of a table, before writing each of the cell renderers.
 */
qx.Class.define("tvproui.control.ui.spanTable.cellrenderer.Debug",
{
  extend : tvproui.control.ui.spanTable.cellrenderer.Abstract,
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
      var html = "<div style='height:" + cellInfo.styleHeight + "px;overflow:auto;'>" + qx.dev.Debug.debugObjectToString(cellInfo.value, "row=" + cellInfo.row + ", col=" + cellInfo.col, 10, true) + "</div>";
      return html;
    }
  }
});
