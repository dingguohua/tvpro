
/**
 * @author 张未波
 * 组合命令类
 */
qx.Class.define("tvproui.statistic.FilterCondition.Field",
{
  extend : qx.core.Object,
  properties : {
    displayName :
    {
      init : "",
      nullable : false,
      event : "changeDisplayName"
    },

    fieldName :
    {
      init: "",
      nullable: false,
      event : "changeFiledName"
    },

    fieldType:
    {
      init: "文本",
      nullable: false,
      event: "changeFiledType"
    }
  },

  construct: function(displayName, fieldName, fieldType)
  {
    this.set({"fieldName": fieldName, "displayName": displayName, "fieldType": fieldType});
  },

  members :
  {
  },

  // 界面之外的内容释放
  destruct : function() {
  }
});

