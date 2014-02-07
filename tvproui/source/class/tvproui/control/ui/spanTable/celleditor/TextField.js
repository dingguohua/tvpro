
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
qx.Class.define("tvproui.control.ui.spanTable.celleditor.TextField",
{
  extend : tvproui.control.ui.spanTable.celleditor.AbstractField,
  members :
  {

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
      if (typeof cellEditor.originalValue == "number") {
        if (value != null) {
          value = parseFloat(value);
        }
      }
      return value;
    },


    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    _createEditor : function()
    {
      var cellEditor = new qx.ui.form.TextField();
      cellEditor.setAppearance("table-editor-textfield");
      return cellEditor;
    }
  }
});
