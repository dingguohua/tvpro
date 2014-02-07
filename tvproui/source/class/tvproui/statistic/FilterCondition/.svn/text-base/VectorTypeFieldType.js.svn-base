
/**
 * @author 张未波
 * 组合命令类
 */
qx.Class.define("tvproui.statistic.FilterCondition.VectorTypeFieldType",
{
  extend : tvproui.statistic.FilterCondition.FieldType,
  construct: function(fieldName)
  {
    this.base(arguments);
    this._fieldName = fieldName;

    // 文本编辑器框
    var selectItems = this._loadData();
    selectItems.push("删除");
    this._selectBox = new qx.ui.form.VirtualSelectBox(new qx.data.Array(selectItems));
    this._selectBox.set({itemHeight: 24})
    this.add(this._selectBox, {row: 0, column:0});

    var layout = this._layout;

    // 设定文本框最大化
    layout.setColumnFlex(0, 1);
  },

  members :
  {
    _selectBox: null,
    _fieldName: null,

    getCondition: function()
    {
      var result = this._selectBox.getSelection().getItem(0);
      if(result == "删除")
      {
        return null;
      }

      return result;
    },

    _loadData: function()
    {
      var reuslts = [];
      var labels = tvproui.AjaxPort.call("statistic/loadPredictLabelByVectorName", {vectorName: this._fieldName});
      if(!labels)
      {
        return reuslts;
      }

      for (var i = 0, l = labels.length; i < l; i++)
      {
        var label = labels[i];
        reuslts.push(label.optional);
      }

      return reuslts;
    }
  },

  destruct: function()
  {
    this._fieldName = null;
    this._selectBox = null;
  }
});

