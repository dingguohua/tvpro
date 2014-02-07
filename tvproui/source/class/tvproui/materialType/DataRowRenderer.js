
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

************************************************************************ */

/**
 * A data row renderer for a simple tree row
 */
qx.Class.define("tvproui.materialType.DataRowRenderer",
{
  extend : qx.ui.table.rowrenderer.Default,
  construct : function()
  {
    this.base(arguments);
    this._fontStyleString = "";
    this._fontStyleString = {

    };

    // link to font theme
    this._renderFont(qx.theme.manager.Font.getInstance().resolve("cells"));
  },


  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */
  members :
  {
    _fontStyle : null,
    _fontStyleString : null,


    /**
     * TODOC
     *
     * @param font {var} TODOC
     */
    _renderFont : function(font) {
      if (font)
      {
        this._fontStyle = font.getStyles();
        this._fontStyleString = qx.bom.element.Style.compile(this._fontStyle);
        this._fontStyleString = this._fontStyleString.replace(/"/g, "'");
      } else
      {
        this._fontStyleString = "";
        this._fontStyle = qx.bom.Font.getDefaultStyles();
      }
    },

    // interface implementation

    /**
     * TODOC
     *
     * @param rowInfo {var} TODOC
     * @param rowElem {var} TODOC
     * @return {var} TODOC
     */
    createRowStyle : function(rowInfo, rowElem)
    {
      var rowStyle = [];
      var rowData = rowInfo.rowData;
      rowStyle.push(";");
      rowStyle.push(this._fontStyleString);
      rowStyle.push("background-color:");
      if (rowInfo.focusedRow && this.getHighlightFocusRow()) {
        rowStyle.push(rowInfo.selected ? this._colors.bgcolFocusedSelected : this._colors.bgcolFocused);
      } else {
        if (rowInfo.selected) {
          rowStyle.push(this._colors.bgcolSelected);
        } else {

          // 背景色
          rowStyle.push(rowData[4]);
        }
      }
      rowStyle.push(';color:');
      rowStyle.push(rowInfo.selected || rowInfo.focusedRow ? this._colors.colSelected : rowData[6]);
      rowStyle.push(';font-size:');
      rowStyle.push(rowData[5]);
      rowStyle.push('px');
      if (rowData[7]) {
        rowStyle.push(';font-weight:bold');
      }
      if (rowData[8]) {
        rowStyle.push(';font-style:italic');
      }
      rowStyle.push(';border-bottom: 1px solid ', this._colors.horLine);
      return rowStyle.join("");
    },

    // overridden

    /**
     * TODOC
     *
     * @param rowInfo {var} TODOC
     * @param rowElem {var} TODOC
     */
    updateDataRowElement : function(rowInfo, rowElem)
    {

      // If the node is selected, select the row
      var rowData = rowInfo.rowData;
      var fontStyle = this._fontStyle;
      var style = rowElem.style;

      // set font styles
      qx.bom.element.Style.setStyles(rowElem, fontStyle);
      if (rowInfo.focusedRow && this.getHighlightFocusRow()) {
        style.backgroundColor = rowInfo.selected ? this._colors.bgcolFocusedSelected : this._colors.bgcolFocused;
      } else {
        if (rowInfo.selected) {
          style.backgroundColor = this._colors.bgcolSelected;
        } else {
          if (rowData) {
            style.backgroundColor = rowData[4];
          } else {
            style.backgroundColor = "#ffffff";
          }
        }
      }
      if (rowData)
      {
        style.color = (rowInfo.selected || rowInfo.focusedRow) ? this._colors.colSelected : rowData[6];
        style.fontSize = rowData[5] + "px";
        if (rowData[7]) {
          style["font-weight"] = "bold";
        }
        if (rowData[8]) {
          style["font-style"] = "italic";
        }
      }
      style.borderBottom = "1px solid " + this._colors.horLine;
    }
  }
});
