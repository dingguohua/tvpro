
/**
 * @author 张未波
 * 组合命令类
 */
qx.Class.define("tvproui.statistic.FilterCondition.FilterCondition",
{
  extend : qx.core.Object,
  properties : {
    id :
    {
      init: null,
      nullable: false,
      event : "changeId"
    },

    description :
    {
      init : "",
      nullable : true,
      event : "changeDescription"
    },

    condition:
    {
      nullable: true,
      event: "changeCondition"
    }
  },
  members :
  {
  },

  construct: function()
  {
    this.setCondition({});
  },

  // 界面之外的内容释放
  destruct : function() {
  }
});

