
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

/**
 * A cell editor factory creating text fields.
 */
qx.Class.define("tvproui.control.ui.table.celleditor.DateField",
{
  extend : qx.ui.table.celleditor.AbstractField,
  members :
  {
    _cellInfo : null,

    // interface implementation

    /**
     * TODOC
     *
     * @param cellInfo {var} TODOC
     * @return {var} TODOC
     */
    createCellEditor : function(cellInfo)
    {
      var cellEditor = this._createEditor();
      cellEditor.originalValue = cellInfo.value;
      if (cellInfo.value === null || cellInfo.value === undefined) {
        cellInfo.value = "";
      }
      cellEditor.setValue(tvproui.utils.Time.parseDate(cellInfo.value));
      //cellEditor.selectAllText();
      this._cellInfo = cellInfo;
      return cellEditor;
    },

    // overridden

    /**
     * TODOC
     *
     * @param cellEditor {var} TODOC
     * @return {var} TODOC
     */
    getCellEditorValue : function(cellEditor)
    {
      var value = cellEditor.getValue();

      // validation function will be called with new and old value
      var validationFunc = this.getValidationFunction();
      if (validationFunc) {
        value = validationFunc(value, cellEditor.originalValue);
      }
      return tvproui.utils.Time.formatDate(value);
    },


    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    _createEditor : function()
    {
      var cellEditor = new tvproui.control.ui.form.DateField();
      cellEditor.setDateFormat(tvproui.utils.Time.dateFormater);
      cellEditor.setAppearance("datefield");
      return cellEditor;
    }
  },

  // 界面之外的内容释放
  destruct : function() {

    // 去除多余的引用
    this._cellInfo = null;
  }
});
