
/**
 * @author Weibo Zhamg
 */
qx.Class.define("tvproui.system.fileManager",
{
  extend : qx.core.Object,
  statics :
  {
    MATERIAL_STYLE_MAP : null,
    MATERIAL_STYLE_CSS_MAP : null,
    MATERIAL_STYLE_SELECTOR_DATA : null,


    /**
     * TODOC
     *
     * @param force {Boolean} TODOC
     * @return {void | var} TODOC
     */
    getMaterialStyle : function(force)
    {
      var defaultStyleMap = tvproui.system.fileManager.MATERIAL_STYLE_MAP;
      if (!defaultStyleMap || force)
      {

        // 清理CSS样式缓冲
        tvproui.control.ui.spanTable.cellrenderer.Abstract.cellStyles = {

        };

        // 加载默认样式配置
        var defaultStyles = tvproui.AjaxPort.call("materialType/load");
        if (null == defaultStyles)
        {
          dialog.Dialog.error("对不起，加载默认素材类型时出错，该操作无法完成");
          return;
        }

        // 根据类型映射默认配置
        var defaultStyleMap = {

        };
        var defaultCSSStyleMap = {

        };
        var selectorData = [];
        for (var i = 0, l = defaultStyles.length; i < l; i++)
        {
          var row = defaultStyles[i];
          var cssStyle =
          {
            name : row.type,
            "background-color" : row.backcolor,
            "color" : row.fontcolor,
            "font-size" : row.fontsize + "px"
          };
          row.ID = parseInt(row.ID);
          row.imageID = parseInt(row.imageID);
          row.path = tvproui.system.fileManager.path(row.path);
          if (row.bold == 1)
          {
            row.bold = true;
            cssStyle["font-weight"] = "bold";
          } else
          {
            row.bold = false;
          }
          if (row.italic == 1)
          {
            row.italic = true;
            cssStyle["font-style"] = "italic";
          } else
          {
            row.italic = false;
          }
          defaultStyleMap[row.type] = row;
          defaultCSSStyleMap[row.type] = cssStyle;
          if (3 == row.level && row.type != "素材包") {
            selectorData.push([row.type, row.path, row.type]);
          }
        }
        tvproui.system.fileManager.MATERIAL_STYLE_MAP = defaultStyleMap;
        tvproui.system.fileManager.MATERIAL_STYLE_SELECTOR_DATA = selectorData;
        tvproui.system.fileManager.MATERIAL_STYLE_CSS_MAP = defaultCSSStyleMap;
      }
      return defaultStyleMap;
    },


    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    getSelectorData : function()
    {
      tvproui.system.fileManager.getMaterialStyle();
      return tvproui.system.fileManager.MATERIAL_STYLE_SELECTOR_DATA;
    },


    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    getCSSStyle : function()
    {
      tvproui.system.fileManager.getMaterialStyle();
      return tvproui.system.fileManager.MATERIAL_STYLE_CSS_MAP;
    },


    /**
     * TODOC
     *
     * @param fileName {var} TODOC
     * @return {var} TODOC
     */
    path : function(fileName) {
      return "../../" + fileName;
    }
  }
});
