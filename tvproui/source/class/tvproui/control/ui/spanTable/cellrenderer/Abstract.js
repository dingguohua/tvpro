
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
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/* ************************************************************************
#require(qx.bom.Stylesheet)
************************************************************************ */

/**
 * An abstract data cell renderer that does the basic coloring
 * (borders, selected look, ...).
 */
qx.Class.define("tvproui.control.ui.spanTable.cellrenderer.Abstract",
{
  type : "abstract",
  implement : qx.ui.table.ICellRenderer,
  extend : qx.core.Object,
  construct : function()
  {
    this.base(arguments);
    var cr = tvproui.control.ui.spanTable.cellrenderer.Abstract;
    if (!cr.__clazz)
    {
      var colorMgr = qx.theme.manager.Color.getInstance();
      cr.__clazz = this.self(arguments);
      var stylesheet = ".qooxdoo-spanTable-cell {" + qx.bom.element.Style.compile(
      {
        position : "absolute",
        top : "0px",
        borderRight : "1px solid " + colorMgr.resolve("table-column-line"),
        borderBottom : "1px solid" + colorMgr.resolve("table-row-line"),
        padding : "0px 6px",
        overflow : "hidden",
        whiteSpace : "nowrap",
        cursor : "default",
        textOverflow : "ellipsis",
        userSelect : "none"
      }) + "} " + ".qooxdoo-spanTable-cell-right { text-align:right } " + ".qooxdoo-spanTable-cell-italic { font-style:italic} " + ".qooxdoo-spanTable-cell-bold { font-weight:bold } ";
      if (qx.core.Environment.get("css.boxsizing")) {
        stylesheet += ".qooxdoo-spanTable-cell {" + qx.bom.element.BoxSizing.compile("content-box") + "}";
      }
      cr.__clazz.stylesheet = qx.bom.Stylesheet.createElement(stylesheet);
    }
  },
  properties :
  {


    /**
     * The default cell style. The value of this property will be provided
     * to the cell renderer as cellInfo.style.
     */
    defaultCellStyle :
    {
      init : null,
      check : "String",
      nullable : true
    },

    /** Whether the focused row should be highlighted. */
    highlightFocusRow :
    {
      check : "Boolean",
      init : true
    }
  },
  statics : {
    cellStyles : {

    }
  },
  members :
  {


    /**
     * the sum of the horizontal insets. This is needed to compute the box model
     * independent size
     */
    _insetX : 6 + 6 + 1,

    // paddingLeft + paddingRight + borderRight

    /**
     * the sum of the vertical insets. This is needed to compute the box model
     * independent size
     */
    _insetY : 1,


    /**
     * Get a string of the cell element's HTML classes.
     *
     * This method may be overridden by sub classes.
     *
     * @param cellInfo {Map} cellInfo of the cell
     * @return {String} The table cell HTML classes as string.
     */
    _getCellClass : function(cellInfo) {
      return "qooxdoo-spanTable-cell";
    },


    /**
     * TODOC
     *
     * @param cellInfo {var} TODOC
     * @param element {var} TODOC
     */
    updateCellStatus : function(cellInfo, element)
    {
      var style = element.style;
      var colorMgr = qx.theme.manager.Color.getInstance();
      if (cellInfo.focused)
      {
        style.backgroundColor = cellInfo.selected ? colorMgr.resolve("table-row-background-focused-selected") : colorMgr.resolve("table-row-background-focused");
        style.color = colorMgr.resolve("table-row-selected");
      } else
      {
        if (cellInfo.selected)
        {
          style.backgroundColor = colorMgr.resolve("table-row-background-selected");
          style.color = colorMgr.resolve("table-row-selected");
        } else
        {
          var defaultStyle;
          if (cellInfo.overWriteStyle)
          {
            defaultStyle = {

            };
            var orignalStyle = cellInfo.style;
            for (var name in orignalStyle) {
              defaultStyle[name] = orignalStyle[name];
            }
            var overWriteStyle = cellInfo.overWriteStyle;
            for (var name in overWriteStyle) {
              defaultStyle[name] = overWriteStyle[name];
            }
          } else
          {
            defaultStyle = cellInfo.style;
          }
          style.backgroundColor = defaultStyle["background-color"];
          style.color = defaultStyle["color"];
        }
      }
    },


    /**
     * Returns the CSS styles that should be applied to the main div of this
     * cell.
     *
     * This method may be overridden by sub classes.
     *
     * @param cellInfo {Map} The information about the cell.
     *            See {@link qx.ui.table.cellrenderer.Abstract#createDataCellHtml}.
     * @return {var} the CSS styles of the main div.
     */
    _getCellStyle : function(cellInfo)
    {
      var styles = tvproui.control.ui.spanTable.cellrenderer.Abstract.cellStyles;
      if (!cellInfo.style) {
        dialog.Dialog.error("单元格样式获取失败!");
      }
      var styleName = cellInfo.style.name + (cellInfo.focused ? "-focuesd" : "") + (cellInfo.selected ? "-selected" : "") + (cellInfo.overWriteStyle ? ("-overWriteStyle" + cellInfo.col) : "");
      var css = styles[styleName];
      if (!css)
      {
        var style = {

        };
        var orignalStyle = cellInfo.style;
        for (var name in orignalStyle) {
          style[name] = orignalStyle[name];
        }
        var cssArray = [];
        var backgroundColor;
        var color;
        var colorMgr = qx.theme.manager.Color.getInstance();
        if (cellInfo.selected && cellInfo.focused)
        {
          backgroundColor = colorMgr.resolve("table-row-background-focused-selected");
          color = colorMgr.resolve("table-row-selected");
        } else if (cellInfo.focused)
        {
          backgroundColor = colorMgr.resolve("table-row-background-focused");
          color = colorMgr.resolve("table-row-selected");
        } else if (cellInfo.selected)
        {
          backgroundColor = colorMgr.resolve("table-row-background-selected");
          color = colorMgr.resolve("table-row-selected");
        } else
        {
          if (cellInfo.overWriteStyle !== undefined)
          {
            var overWriteStyle = cellInfo.overWriteStyle;
            for (var name in overWriteStyle) {
              style[name] = overWriteStyle[name];
            }
          }
          backgroundColor = style["background-color"];
          color = style["color"];
        }


        cssArray.push("background-color:", backgroundColor, ";");
        cssArray.push("color:", color, ";");
        cssArray.push("font-size:", style["font-size"], ";");
        css = cssArray.join("");
        styles[styleName] = css;
      }
      return css || "";
    },


    /**
     * Retrieve any extra attributes the cell renderer wants applied to this
     * cell. Extra attributes could be such things as
     * "onclick='handleClick()';"
     *
     * @param cellInfo {Map} The information about the cell.
     *            See {@link qx.ui.table.cellrenderer.Abstract#createDataCellHtml}.
     * @return {String} The extra attributes to be applied to this cell.
     */
    _getCellAttributes : function(cellInfo) {
      return "";
    },


    /**
     * Returns the HTML that should be used inside the main div of this cell.
     *
     * This method may be overridden by sub classes.
     *
     * @param cellInfo {Map} The information about the cell.
     *            See {@link qx.ui.table.cellrenderer.Abstract#createDataCellHtml}.
     * @return {String} the inner HTML of the cell.
     */
    _getContentHtml : function(cellInfo) {
      return cellInfo.value || "";
    },


    /**
     * Get the cell size taking the box model into account
     *
     * @param width {Integer} The cell's (border-box) width in pixel
     * @param height {Integer} The cell's (border-box) height in pixel
     * @param insetX {Integer} The cell's horizontal insets, i.e. the sum of
     *      horizontal paddings and borders
     * @param insetY {Integer} The cell's vertical insets, i.e. the sum of
     *      vertical paddings and borders
     * @param span {var} TODOC
     * @return {String} The CSS style string for the cell size
     */
    _getCellSizeStyle : function(width, height, insetX, insetY, span)
    {
      var style = "";
      height *= span;
      if (qx.core.Environment.get("css.boxmodel") == "content")
      {
        width -= insetX;
        height -= insetY;
      }
      style += "width:" + Math.max(width, 0) + "px;";
      style += "height:" + Math.max(height, 0) + "px;";
      style += "line-height: " + Math.max(height, 0) + "px;";
      return style;
    },

    // interface implementation

    /**
     * TODOC
     *
     * @param cellInfo {var} TODOC
     * @param htmlArr {var} TODOC
     */
    createDataCellHtml : function(cellInfo, htmlArr) {
      htmlArr.push('<div class="', this._getCellClass(cellInfo), '" style="', 'left:', cellInfo.styleLeft, 'px;', this._getCellSizeStyle(cellInfo.styleWidth, cellInfo.styleHeight, this._insetX, this._insetY, cellInfo.span), this._getCellStyle(cellInfo), '" ', this._getCellAttributes(cellInfo), '>' + this._getContentHtml(cellInfo), '</div>');
    }
  }
});
