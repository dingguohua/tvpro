
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2007 Derrell Lipman

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Derrell Lipman (derrell)
     * David Perez Carmona (david-perez)

************************************************************************ */

/* ************************************************************************

#require(qx.theme.Modern)
#require(qx.theme.Classic)
#require(qx.log.Logger)

************************************************************************ */

/**
 * A data cell renderer for the tree column of a simple tree
 *
 * This cell renderer has provisions for subclasses to easily extend the
 * appearance of the tree. If the tree should contain images, labels,
 * etc. before the indentation, the subclass should override the method
 * _addExtraContentBeforeIndentation(). Similarly, content can be added before
 * the icon by overriding _addExtraContentBeforeIcon(), and before the label
 * by overriding _addExtraContentBeforeLabel().
 *
 * Each of these overridden methods that calls _addImage() can provide, as
 * part of the map passed to _addImage(), a member called "tooltip" which
 * contains the tool tip to present when the mouse is hovered over the image.
 *
 * If this class is subclassed to form a new cell renderer, an instance of it
 * must be provided, via the 'custom' parameter, to the TreeVirtual
 * constructor.
 */
qx.Class.define("tvproui.control.ui.treevirtual.SimpleTreeDataCellRenderer",
{
  extend : qx.ui.treevirtual.SimpleTreeDataCellRenderer,


  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */
  members : {


    /**
     * Add the icon for this node of the tree.
     *
     * @param cellInfo {Map} The information about the cell.
     *         See {@link qx.ui.table.cellrenderer.Abstract#createDataCellHtml}.
     * @param pos {Integer} The position from the left edge of the column at which to render this
     *         item.
     * @return {Map} The returned map contains an 'html' member which contains the html for
     *         the icon, and a 'pos' member which is the starting position plus the
     *         width of the icon.
     */
    _addIcon : function(cellInfo, pos)
    {
      if (cellInfo.table.disableICON) {
        return (
        {
          html : "",
          pos : pos
        });
      }
      return this.base(arguments, cellInfo, pos);
    }
  }
});
