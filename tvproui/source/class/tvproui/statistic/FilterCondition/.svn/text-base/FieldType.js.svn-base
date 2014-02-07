
/**
 * @author 张未波
 * 组合命令类
 */
qx.Class.define("tvproui.statistic.FilterCondition.FieldType",
{
  extend : qx.ui.container.Composite,
  construct: function()
  {
    var layout = new qx.ui.layout.Grid();
    this.base(arguments, layout);
    layout.setSpacingX(10);
    layout.setRowAlign(0, "center", "middle");
    this._layout = layout;
  },

  members :
  {
    _layout: null,

    getCondition: function()
    {
      return null;
    }
  },

  statics:
  {
    typeTable: {},
    getFieldTypeInstance: function(typeName, typeParamater)
    {
      var instance = null;
      switch(typeName)
      {
        case "文本":
          instance = new tvproui.statistic.FilterCondition.StringFieldType();
          break;
        case "时间":
          instance = new tvproui.statistic.FilterCondition.TimeFieldType();
          break;
        case "素材类型":
          instance = new tvproui.statistic.FilterCondition.MaterialTypeFieldType();
          break;
        case "维度":
          instance = new tvproui.statistic.FilterCondition.VectorTypeFieldType(typeParamater);
          break;
      }

      return instance;
    }
  },

  // 界面之外的内容释放
  destruct : function() 
  {
    this._layout = null;
  }
});

