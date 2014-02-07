qx.Class.define("tvproui.material.MaterialImage",
{
  extend : qx.ui.table.cellrenderer.Image,
  construct : function(width, height)
  {
    this.base(arguments);
    if (width) {
      this._imageWidth = width;
    }
    if (height) {
      this._imageHeight = height;
    }
    this._am = qx.util.AliasManager.getInstance();
  },


  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */
  members :
  {
    _am : null,
    _imageHeight : 16,
    _imageWidth : 16,

    // overridden

    /**
     * TODOC
     *
     * @param cellInfo {var} TODOC
     * @return {var} TODOC
     */
    _identifyImage : function(cellInfo)
    {
      var imageHints =
      {
        imageWidth : this._imageWidth,
        imageHeight : this._imageHeight
      };
      if (cellInfo.value == "") {
        imageHints.url = this._am.resolve("icon/22/actions/dialog-close.png");
      } else {
        var types = tvproui.system.fileManager.getMaterialStyle();
        var style = types[cellInfo.value];
        if (!style)
        {
          style = types["设备检修"];
          dialog.Dialog.error("无法识别的类型" + cellInfo.value);
        }
        imageHints.url = this._am.resolve(style.path);
      }
      imageHints.tooltip = cellInfo.tooltip;
      return imageHints;
    }
  },
  destruct : function() {
    this._am = null;
  }
});
