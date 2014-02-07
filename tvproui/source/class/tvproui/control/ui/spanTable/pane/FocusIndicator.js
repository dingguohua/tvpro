
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
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * The focus indicator widget
 */
qx.Class.define("tvproui.control.ui.spanTable.pane.FocusIndicator",
{
  extend : qx.ui.container.Composite,


  /**
   * @param scroller {Scroller} The scroller, which contains this focus indicator
   */
  construct : function(scroller)
  {
    this.base(arguments);
    this.__scroller = scroller;
    this.setKeepActive(true);
    this.addListener("keypress", this._onKeyPress, this);
  },
  properties :
  {

    // overridden
    visibility :
    {
      refine : true,
      init : "excluded"
    },

    /** Table row, where the indicator is placed. */
    row :
    {
      check : "Integer",
      nullable : true
    },

    /** Table column, where the indicator is placed. */
    column :
    {
      check : "Integer",
      nullable : true
    }
  },
  members :
  {
    __scroller : null,


    /**
     * Keypress handler. Suppress all key events but "Enter" and "Escape"
     *
     * @param e {qx.event.type.KeySequence} key event
     */
    _onKeyPress : function(e)
    {
      var iden = e.getKeyIdentifier();
      if (iden !== "Escape" && iden !== "Enter") {
        e.stopPropagation();
      }
    },


    /**
     * Move the focus indicator to the given table cell.
     *
     * @param col {Integer ? null} The table column
     * @param row {Integer ? null} The table row
     * @param span {var} TODOC
     */
    moveToCell : function(col, row, span)
    {
      var table = this.__scroller.getTable();

      // check if the focus indicator is shown and if the new column is
      // editable. if not, just exclude the incdicator because the mouse events
      // should go to the cell itself linke with HTML links [BUG #4250]
      if (!this.__scroller.getShowCellFocusIndicator() && !table.getTableModel().isColumnEditable(col))
      {
        this.exclude();
        return;
      } else
      {
        this.show();
      }
      if (col == null)
      {
        this.hide();
        this.setRow(null);
        this.setColumn(null);
      } else
      {
        var paneModel = this.__scroller.getTablePaneModel();
        var xPos = paneModel.getX(col);
        if (xPos == -1)
        {
          this.hide();
          this.setRow(null);
          this.setColumn(null);
        } else
        {
          var columnModel = table.getTableColumnModel();
          var firstRow = this.__scroller.getTablePane().getFirstVisibleRow();
          var rowHeight = table.getRowHeight();
          this.setUserBounds(paneModel.getColumnLeft(col) - 2, (row - firstRow) * rowHeight - 2, columnModel.getColumnWidth(col) + 3, rowHeight * span + 3);
          this.show();
          this.setRow(row);
          this.setColumn(col);
        }
      }
    }
  },
  destruct : function() {
    this.__scroller = null;
  }
});
