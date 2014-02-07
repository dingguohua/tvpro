
/* ************************************************************************
   Span Table Pane
   Renderer of span model
   Authors:
     * Weibo Zhang (datouxia)

************************************************************************ */

/**
 * The table pane that shows a certain section from a table. This class handles
 * the display of the data part of a table and is therefore the base for virtual
 * scrolling.
 */
qx.Class.define("tvproui.control.ui.spanTable.pane.Pane",
{
  extend : qx.ui.core.Widget,


  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param paneScroller {qx.ui.table.pane.Scroller} the TablePaneScroller the header belongs to.
   */
  construct : function(paneScroller)
  {
    this.base(arguments);
    this.__paneScroller = paneScroller;
    this.__lastColCount = 0;
    this.__lastRowCount = 0;
  },


  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */
  events :
  {


    /**
     * Whether the current view port of the pane has not loaded data.
     * The data object of the event indicates if the table pane has to reload
     * data or not. Can be used to give the user feedback of the loading state
     * of the rows.
     */
    "paneReloadsData" : "qx.event.type.Data",


    /**
     * Whenever the content of the table panehas been updated (rendered)
     * trigger a paneUpdated event. This allows the canvas cellrenderer to act
     * once the new cells have been integrated in the dom.
     */
    "paneUpdated" : "qx.event.type.Event"
  },


  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */
  properties :
  {

    /** The index of the first row to show. */
    firstVisibleRow :
    {
      check : "Number",
      init : 0,
      apply : "_applyFirstVisibleRow"
    },

    /** The number of rows to show. */
    visibleRowCount :
    {
      check : "Number",
      init : 0,
      apply : "_applyVisibleRowCount"
    },

    // overridden
    allowShrinkX :
    {
      refine : true,
      init : false
    }
  },


  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */
  members :
  {
    __lastRowCount : null,
    __lastColCount : null,
    __paneScroller : null,
    __tableContainer : null,
    __focusedRow : null,
    __focusedCol : null,

    // property modifier

    /**
     * TODOC
     *
     * @param value {var} TODOC
     * @param old {var} TODOC
     */
    _applyFirstVisibleRow : function(value, old) {
      this.updateContent(false, value - old);
    },

    // property modifier

    /**
     * TODOC
     *
     * @param value {var} TODOC
     * @param old {var} TODOC
     */
    _applyVisibleRowCount : function(value, old) {
      this.updateContent(true);
    },

    // overridden

    /**
     * TODOC
     *
     * @return {Map} TODOC
     */
    _getContentHint : function() {

      // the preferred height is 400 pixel. We don't use rowCount * rowHeight
      // because this is typically too large.
      return {
        width : this.getPaneScroller().getTablePaneModel().getTotalWidth(),
        height : 400
      };
    },


    /**
     * Returns the TablePaneScroller this pane belongs to.
     *
     * @return {qx.ui.table.pane.Scroller} the TablePaneScroller.
     */
    getPaneScroller : function() {
      return this.__paneScroller;
    },


    /**
     * Returns the table this pane belongs to.
     *
     * @return {qx.ui.table.Table} the table.
     */
    getTable : function() {
      return this.__paneScroller.getTable();
    },


    /**
     * Sets the currently focused cell.
     *
     * @param col {Integer ? null} the model index of the focused cell's column.
     * @param row {Integer ? null} the model index of the focused cell's row.
     * @param massUpdate {Boolean ? false} Whether other updates are planned as well.
     *                If true, no repaint will be done.
     */
    setFocusedCell : function(col, row, massUpdate) {
      if (col != this.__focusedCol || row != this.__focusedRow)
      {
        var oldRow = this.__focusedRow;
        this.__focusedCol = col;
        this.__focusedRow = row;

        // Update the focused row background
        if (row != oldRow && !massUpdate)
        {
          if (oldRow !== null) {
            this.updateContent(false, null, oldRow, true);
          }
          if (row !== null) {
            this.updateContent(false, null, row, true);
          }
        }
      }
    },


    /**
     * Event handler. Called when the selection has changed.
     *
     */
    onSelectionChanged : function() {
      this.updateContent(false, null, null, true);
    },


    /**
     * Event handler. Called when the table gets or looses the focus.
     *
     */
    onFocusChanged : function() {
      this.updateContent(false, null, null, true);
    },


    /**
     * Sets the column width.
     *
     * @param col {Integer} the column to change the width for.
     * @param width {Integer} the new width.
     */
    setColumnWidth : function(col, width) {
      this.updateContent(true);
    },


    /**
     * Event handler. Called the column order has changed.
     *
     */
    onColOrderChanged : function() {
      this.updateContent(true);
    },


    /**
     * Event handler. Called when the pane model has changed.
     *
     */
    onPaneModelChanged : function() {
      this.updateContent(true);
    },


    /**
     * Event handler. Called when the table model data has changed.
     *
     * @param firstRow {Integer} The index of the first row that has changed.
     * @param lastRow {Integer} The index of the last row that has changed.
     * @param firstColumn {Integer} The model index of the first column that has changed.
     * @param lastColumn {Integer} The model index of the last column that has changed.
     */
    onTableModelDataChanged : function(firstRow, lastRow, firstColumn, lastColumn)
    {
      var paneFirstRow = this.getFirstVisibleRow();
      var rowCount = this.getVisibleRowCount();
      if (lastRow == -1 || lastRow >= paneFirstRow && firstRow < paneFirstRow + rowCount) {

        // The change intersects this pane
        this.updateContent();
      }
    },


    /**
     * Event handler. Called when the table model meta data has changed.
     *
     */
    onTableModelMetaDataChanged : function() {
      this.updateContent(true);
    },


    /**
     * Updates the content of the pane.
     *
     * @param completeUpdate {Boolean ? false} if true a complete update is performed.
     *            On a complete update all cell widgets are recreated.
     * @param scrollOffset {Integer ? null} If set specifies how many rows to scroll.
     * @param onlyRow {Integer ? null} if set only the specified row will be updated.
     * @param onlySelectionOrFocusChanged {Boolean ? false} if true, cell values won't
     *                be updated. Only the row background will.
     */
    updateContent : function(completeUpdate, scrollOffset, onlyRow, onlySelectionOrFocusChanged)
    {
      var table = this.getTable();
      var paneModel = this.getPaneScroller().getTablePaneModel();
      var columnModel = table.getTableColumnModel();
      var tableModel = table.getTableModel();
      var colCount = paneModel.getColumnCount();
      var left = 0;
      var cols = [];

      // precompute column properties
      for (var x = 0; x < colCount; x++)
      {
        var col = paneModel.getColumnAtX(x);
        var cellWidth = columnModel.getColumnWidth(col);
        var level = tableModel.getColumnLevel(col);
        var colID = tableModel.getColumnId(col);
        cols.push(
        {
          col : col,
          colID : colID,
          xPos : x,
          editable : tableModel.isColumnEditable(col),
          focusedCol : this.__focusedCol == col,
          styleLeft : left,
          styleWidth : cellWidth,
          level : level,
          cellRenderer : columnModel.getDataCellRenderer(col),
          overWriteStyle : columnModel.getOverWriteStyle(col)
        });
        left += cellWidth;
      }

      if (onlySelectionOrFocusChanged && !this.getTable().getAlwaysUpdateCells()) {
        this._updateStyles(onlyRow, cols);
      } else {
        this._updateAllRows(null, cols);
      }
    },

    //this.debug("render time: " + (new Date() - start) + "ms");

    /**
     * If only focus or selection changes it is sufficient to only update the
     * row styles. This method updates the row styles of all visible rows or
     * of just one row.
     *
     * @param onlyRow {Integer | null ? null} If this parameter is set only the row
     *       with this index is updated.
     * @param cols {var} TODOC
     */
    _updateStyles : function(onlyRow, cols)
    {
      var elem = this.getContentElement().getDomElement();
      if (!elem || !elem.firstChild)
      {
        this._updateAllRows(null, cols);
        return;
      }
      var table = this.getTable();
      var selectionModel = table.getSelectionModel();
      var tableModel = table.getTableModel();
      var rowNodes = elem.firstChild.childNodes;
      var cellInfo = {
        table : table
      };

      // We don't want to execute the row loop below more than necessary. If
      // onlyrow is not null, we want to do the loop only for that row.
      // In that case, we start at (set the "row" variable to) that row, and
      // stop at (set the "end" variable to the offset of) the next row.
      var firstRow = this.getFirstVisibleRow();
      var row = firstRow;
      var y = 0;

      // How many rows do we need to update?
      var end = rowNodes.length;
      if (onlyRow != null)
      {

        // How many rows are we skipping?
        var offset = onlyRow - row;
        if (offset >= 0 && offset < end)
        {
          row = onlyRow;
          y = offset;
          end = offset + 1;
        } else
        {
          return;
        }
      }
      var colCount = cols.length;
      for (; y < end; y++, row++)
      {
        var rowNode = rowNodes[y];
        var cellNodes = rowNode.childNodes;

        cellInfo.rowData = tableModel.getRowData(row);
        cellInfo.row = row;
        for (var x = 0; x < colCount; x++)
        {
          var cellNode = cellNodes[x];
          var col_def = cols[x];
          for (var attr in col_def) {
            cellInfo[attr] = col_def[attr];
          }
          var col = cellInfo.col;
          var node = cellInfo.rowData[col];

          // 如果初始节点还在屏幕内，则不渲染该节点
          if (!node || ((node.offset > 0) && (row - firstRow != 0))) {
            continue;
          }
          var level = cellInfo.level;
          cellInfo.selected = selectionModel.isSelectedIndex(row - node.offset, level);
          cellInfo.focused = ((this.__focusedRow == row - node.offset) && (this.__focusedCol == col));
          cellInfo.style = node.style;

          cellInfo.cellRenderer.updateCellStatus(cellInfo, cellNode);
        }
      }
    },


    /**
     * Get the HTML table fragment for the given row range.
     *
     * @param firstRow {Integer} Index of the first row
     * @param rowCount {Integer} Number of rows
     * @param cols {var} TODOC
     * @return {String} The HTML table fragment for the given row range.
     */
    _getRowsHtml : function(firstRow, rowCount, cols)
    {
      var table = this.getTable();
      var selectionModel = table.getSelectionModel();
      var tableModel = table.getTableModel();
      var rowRenderer = table.getDataRowRenderer();
      tableModel.prefetchRows(firstRow, firstRow + rowCount - 1);
      var rowHeight = table.getRowHeight();
      var colCount = cols.length;
      var rowsArr = [];
      var paneReloadsData = false;
      for (var row = firstRow; row < firstRow + rowCount; row++)
      {
        var rowHtml = [];
        var cellInfo = {
          table : table
        };
        cellInfo.styleHeight = rowHeight;
        cellInfo.row = row;
        cellInfo.rowData = tableModel.getRowData(row);
        if (!cellInfo.rowData) {
          paneReloadsData = true;
        }
        var rowSpace = firstRow + rowCount - row;
        rowHtml.push('<div ');
        var rowClass = rowRenderer.getRowClass(cellInfo);
        if (rowClass) {
          rowHtml.push('class="', rowClass, '" ');
        }
        rowHtml.push('style="height:', rowHeight, 'px;" ');
        rowHtml.push('>');
        var stopLoop = false;
        for (var x = 0; x < colCount && !stopLoop; x++)
        {
          var col_def = cols[x];
          for (var attr in col_def) {
            cellInfo[attr] = col_def[attr];
          }
          var col = cellInfo.col;
          var node = cellInfo.rowData[col];
          if (!node && col_def.colID == "sequence")
          {
            var level = 3;
            cellInfo.selected = selectionModel.isSelectedIndex(row, level);
            cellInfo.value = row + 1;
            cellInfo.span = 1;
            cellInfo.focused = ((this.__focusedRow == row) && (this.__focusedCol == col));

            // Retrieve the current default cell style for this column.
            cellInfo.style = {

            };
          } else
          {

            // 如果初始节点还在屏幕内，则不渲染该节点
            if (!node || ((node.offset > 0) && (row - firstRow != 0)))
            {
              rowHtml.push("<div></div>");
              continue;
            }
            var level = cellInfo.level;
            cellInfo.selected = selectionModel.isSelectedIndex(row - node.offset, level);
            if (col_def.colID == "sequence") {
              cellInfo.value = row + 1;
            } else {
              cellInfo.value = node.value;
            }
            cellInfo.nodeID = node.nodeID;
            cellInfo.span = Math.min(node.span - node.offset, rowSpace);
            cellInfo.focused = ((this.__focusedRow == row - node.offset) && (this.__focusedCol == col));

            // Retrieve the current default cell style for this column.
            cellInfo.style = node.style;
          }

          // Allow a cell renderer to tell us not to draw any further cells in
          // the row. Older, or traditional cell renderers don't return a
          // value, however, from createDataCellHtml, so assume those are
          // returning false.
          //
          // Tested with http://tinyurl.com/333hyhv

          stopLoop = cellInfo.cellRenderer.createDataCellHtml(cellInfo, rowHtml) || false;
        }
        rowHtml.push('</div>');
        var rowString = rowHtml.join("");
        rowsArr.push(rowString);
      }
      this.fireDataEvent("paneReloadsData", paneReloadsData);
      return rowsArr.join("");
    },


    /**
     * Updates the content of the pane (implemented using array joins).
     *
     * @param cols {var} TODOC
     */
    _updateAllRows : function(e, cols)
    {
      if(!cols)
      {
        var table = this.getTable();
        var paneModel = this.getPaneScroller().getTablePaneModel();
        var columnModel = table.getTableColumnModel();
        var tableModel = table.getTableModel();
        var colCount = paneModel.getColumnCount();
        var left = 0;
        cols = [];

        // precompute column properties
        for (var x = 0; x < colCount; x++)
        {
          var col = paneModel.getColumnAtX(x);
          var cellWidth = columnModel.getColumnWidth(col);
          var level = tableModel.getColumnLevel(col);
          var colID = tableModel.getColumnId(col);
          cols.push(
          {
            col : col,
            colID : colID,
            xPos : x,
            editable : tableModel.isColumnEditable(col),
            focusedCol : this.__focusedCol == col,
            styleLeft : left,
            styleWidth : cellWidth,
            level : level,
            cellRenderer : columnModel.getDataCellRenderer(col),
            overWriteStyle : columnModel.getOverWriteStyle(col)
          });
          left += cellWidth;
        }
      }

      var elem = this.getContentElement().getDomElement();
      if (!elem)
      {

        // pane has not yet been rendered
        this.addListenerOnce("appear", arguments.callee, this);
        return;
      }

      var table = this.getTable();
      var tableModel = table.getTableModel();
      var paneModel = this.getPaneScroller().getTablePaneModel();
      var colCount = paneModel.getColumnCount();
      var rowHeight = table.getRowHeight();
      var firstRow = this.getFirstVisibleRow();
      var rowCount = this.getVisibleRowCount();
      var modelRowCount = tableModel.getRowCount();
      if (firstRow + rowCount > modelRowCount) {
        rowCount = Math.max(0, modelRowCount - firstRow);
      }
      var rowWidth = paneModel.getTotalWidth();
      var htmlArr;

      // If there are any rows...
      if (rowCount > 0) {

        // ... then create a div for them and add the rows to it.
        htmlArr = ["<div style='", "width: 100%;", (table.getForceLineHeight() ? "line-height: " + rowHeight + "px;" : ""), "overflow: hidden;", "'>", this._getRowsHtml(firstRow, rowCount, cols), "</div>"];
      } else {

        // Otherwise, don't create the div, as even an empty div creates a
        // white row in IE.
        htmlArr = [];
      }
      var data = htmlArr.join("");
      elem.innerHTML = data;
      this.setWidth(rowWidth);
      this.__lastColCount = colCount;
      this.__lastRowCount = rowCount;
      this.fireEvent("paneUpdated");
    }
  },


  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */
  destruct : function() {
    this.__tableContainer = this.__paneScroller = null;
  }
});
