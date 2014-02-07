
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
     * Carsten Lergenmueller (carstenl)

************************************************************************ */

/**
 * A template class for cell renderer, which display images. Concrete
 * implementations must implement the method {@link #_identifyImage}.
 */
qx.Class.define("tvproui.control.ui.spanTable.cellrenderer.TagRender",
{
  extend : tvproui.control.ui.spanTable.cellrenderer.Abstract,


  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param height {Integer?16} The height of the image. The default is 16.
   * @param width {Integer?16} The width of the image. The default is 16.
   */
  construct : function(width, height)
  {
    this.base(arguments);
    var clazz = this.self(arguments);
    if (!clazz.stylesheet) {
      clazz.stylesheet = qx.bom.Stylesheet.createElement(".qooxdoo-spanTable-cell-icon {text-align:center;}");
    }
    if (width) {
      this.__imageWidth = width;
    } else {
      this.__imageWidth = 22;
    }
    if (height) {
      this.__imageHeight = height;
    } else {
      this.__imageHeight = 22;
    }
  },


  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */
  properties : {


    /**
     * Whether to repeat or scale the image.
     *
     * @param repeat {String}
     *   One of
     *     <code>scale</code>,
     *     <code>scale-x</code>,
     *     <code>scale-y</code>,
     *     <code>repeat</code>,
     *     <code>repeat-x</code>,
     *     <code>repeat-y</code>,
     *     <code>no-repeat</code>
    */
    repeat :
    {
      check : function(value)
      {
        var valid = ["scale", "scale-x", "scale-y", "repeat", "repeat-x", "repeat-y", "no-repeat"];
        return qx.lang.Array.contains(valid, value);
      },
      init : "no-repeat"
    }
  },


  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */
  members :
  {
    __imageData : null,
    __imageWidth : null,
    __imageHeight : null,

    // overridden

    /**
     * TODOC
     *
     * @param cellInfo {var} TODOC
     * @return {var} TODOC
     */
    _getCellClass : function(cellInfo) {
      return this.base(arguments) + " qooxdoo-spantable-cell-icon";
    },

    // overridden

    /**
     * TODOC
     *
     * @param cellInfo {var} TODOC
     * @return {string | var} TODOC
     */
    _getContentHtml : function(cellInfo)
    {
      var content = [];
      var table = cellInfo.table;

      // 临时标签，用以显示异常状态
      var tempTags = null;
      var tags = null;
      var dataID = cellInfo.nodeID;
      if (!cellInfo.value)
      {
        if (dataID < 0) {
          tags = null;
        } else {
          tags = tvproui.AjaxPort.call("tag/getTagInstance",
          {
            "dataType" : table.tableType,
            "dataID" : dataID
          });
        }
        if (null != tags) {
          for (var i = 0, l = tags.length; i < l; i++)
          {
            var tag = tags[i];
            tag.ID = parseInt(tag.ID);
            tag.path = tvproui.system.fileManager.path(tag.path);
          }
        }

        //"name", "path", "tag", "useralias", "recordtime"
        var model = table.getTableModel();
        model.setColumnData(dataID, cellInfo.colID,
        {
          datas : tags,
          tempTags : null,
          actions : null
        });
      } else
      {
        tags = cellInfo.value.datas;
        tempTags = cellInfo.value.tempDatas;
      }

      // 渲染标签
      if ((null == tempTags) && (null == tags)) {
        return "<div></div>";
      }

      // 设定数组长度
      content.length = (tempTags ? tempTags.length : 0) + (tags ? tags.length : 0);

      // 设定起始位置
      var offset = 0;
      if (tempTags)
      {
        for (var i = 0, l = tempTags.length; i < l; i++)
        {
          var tempTag = tempTags[i];
          qx.io.ImageLoader.load(tempTag.path);
          content[i] = qx.bom.element.Decoration.create(tempTag.path, this.getRepeat(),
          {
            width : this.__imageWidth + "px",
            height : this.__imageHeight + "px",
            display : qx.core.Environment.get("css.inlineblock"),
            verticalAlign : "top",
            position : "static",
            "float" : "left",
            "padding-left" : "10px"
          });
        }
        offset += tempTags.length;
      }
      if (tags) {
        for (var i = 0, l = tags.length; i < l; i++)
        {
          var tag = tags[i];
          qx.io.ImageLoader.load(tag.path);
          content[offset + i] = qx.bom.element.Decoration.create(tag.path, this.getRepeat(),
          {
            width : this.__imageWidth + "px",
            height : this.__imageHeight + "px",
            display : qx.core.Environment.get("css.inlineblock"),
            verticalAlign : "top",
            position : "static",
            "float" : "left",
            "padding-left" : "10px"
          });
        }
      }
      return content.join("");
    }
  },


  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */
  destruct : function()
  {
    this.__imageData = null;
    this.__imageWidth = null;
    this.__imageHeight = null;
  }
});
