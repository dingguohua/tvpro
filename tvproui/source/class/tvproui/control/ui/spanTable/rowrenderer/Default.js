
/* ************************************************************************
   Span Table Pane Row Render
   Remove row line
   Authors:
     * Weibo Zhang (datouxia)

************************************************************************ */

/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2006 STZ-IDA, Germany, http://www.stz-ida.de
     2007 Visionet GmbH, http://www.visionet.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Til Schneider (til132) STZ-IDA
     * Dietrich Streifert (level420) Visionet

************************************************************************ */

/**
 * The default data row renderer.
 */
qx.Class.define("tvproui.control.ui.spanTable.rowrenderer.Default",
{
  extend : qx.core.Object,


  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */
  construct : function()
  {
    this.base(arguments);
    var cr = tvproui.control.ui.spanTable.rowrenderer.Default;
    if (!cr.__clazz)
    {
      cr.__clazz = this.self(arguments);
      var stylesheet = ".qooxdoo-spantable-row {" + qx.bom.element.Style.compile(
      {
        position : "relative",
        width : "100%"
      }) + "} ";
      cr.__clazz.stylesheet = qx.bom.Stylesheet.createElement(stylesheet);
    }
  },


  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */
  members : {


    /**
     * TODOC
     *
     * @param rowInfo {var} TODOC
     * @return {string} TODOC
     */
    getRowClass : function(rowInfo) {
      return "qooxdoo-spantable-row";
    }
  },


  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */
  destruct : function() {
  }
});
