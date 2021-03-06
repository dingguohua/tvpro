
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
 * A cell editor factory creating password fields fields.
 */
qx.Class.define("tvproui.control.ui.spanTable.celleditor.PasswordField",
{
  extend : tvproui.control.ui.spanTable.celleditor.AbstractField,
  members : {


    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    _createEditor : function()
    {
      var cellEditor = new qx.ui.form.PasswordField();
      cellEditor.setAppearance("table-editor-textfield");
      return cellEditor;
    }
  }
});
