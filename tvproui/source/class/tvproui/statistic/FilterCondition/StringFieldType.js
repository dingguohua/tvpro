
/**
 * @author 张未波
 * 组合命令类
 */
qx.Class.define("tvproui.statistic.FilterCondition.StringFieldType",
{
  extend : tvproui.statistic.FilterCondition.FieldType,
  construct: function()
  {
    this.base(arguments);

    // 文本编辑器框
    this.add(new qx.ui.basic.Label("方式"), {row: 0, column:0});
    this._searchMethod = new qx.ui.form.VirtualSelectBox(new qx.data.Array(["包含", "等于", "不包含", "不等于", "删除"]));
    this._contentField = new qx.ui.form.TextField();
    this.add(this._searchMethod, {row: 0, column:1});
    this.add(this._contentField, {row: 0, column:2});

    var layout = this._layout;

    // 设定文本框最大化
    layout.setColumnFlex(2, 1);
  },

  members :
  {
    _searchMethod: null,
    _contentField: null,


    getCondition: function()
    {
      var method = this._searchMethod.getSelection().getItem(0);
      var content = this._contentField.getValue();

      if(method == "删除")
      {
        return null;
      }

      if(!content)
      {
        dialog.Dialog.error("请输入要验证" + method + "的文本内容!");
        return null;
      }

      switch(method)
      {
        case "包含":
          return ["like", "%" + content + "%"];
          break;
        case "等于":
          return content;
          break;
        case "不包含":
          return ["not like", "%" + content + "%"];
          break;
        case "不等于":
        return ["neq", content];
          break;
      }

      return null;
    }
  },

  // 界面之外的内容释放
  destruct : function() 
  {
    this._layout = null;
  }
});

