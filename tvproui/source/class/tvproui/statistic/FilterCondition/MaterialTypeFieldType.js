
/**
 * @author 张未波
 * 组合命令类
 */
qx.Class.define("tvproui.statistic.FilterCondition.MaterialTypeFieldType",
{
  extend : tvproui.statistic.FilterCondition.FieldType,
  construct: function()
  {
    this.base(arguments);

    // 文本编辑器框
    var selectItems = this._loadData();
    selectItems.push(qx.data.marshal.Json.createModel({"label": "删除", "icon": "icon/22/actions/list-remove.png"}, true));
    this._selectBox = new qx.ui.form.VirtualSelectBox(new qx.data.Array(selectItems));
    this._selectBox.set({labelPath: "label", iconPath: "icon", itemHeight: 30})
    this.add(this._selectBox, {row: 0, column:0});

    var layout = this._layout;

    // 设定文本框最大化
    layout.setColumnFlex(0, 1);
  },

  members :
  {
    _selectBox: null,

    getCondition: function()
    {
      var result = this._selectBox.getSelection().getItem(0).getLabel();
      if(result == "删除")
      {
        return null;
      }

      return result;
    },

    _loadData: function()
    {
      var results = [];
      var rows = tvproui.AjaxPort.call("materialType/load");
      if (null == rows)
      {
        return results;
      }

      for (var i = 0, l = rows.length; i < l; i++)
      {
        var rowData = rows[i];
        switch(rowData.type)
        {
          case "root":
          case "栏目":
          case "时段":
          case "素材包":
            continue;
            break;
        }

        results.push(qx.data.marshal.Json.createModel({"label": rowData.type, "icon": tvproui.system.fileManager.path(rowData.path)}, true));
      }

      return results;
    }
  },

  // 界面之外的内容释放
  destruct : function() 
  {
    this._selectBox = null;
  }
});

