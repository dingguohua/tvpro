
/**
 * @author Weibo Zhang
 */

/* ************************************************************************
#asset(qx/icon/${qx.icontheme}/22/categories/*)
#asset(qx/icon/${qx.icontheme}/22/apps/*)
#asset(qx/icon/${qx.icontheme}/22/status/*)
************************************************************************ */
qx.Class.define("tvproui.statistic.FilterCondition.FilterConditionEditor",
{
  extend : tvproui.control.ui.window.Window,
  statics :
  {
    applicationName : "统计筛选条件编辑",
    applicationIcon : "icon/22/apps/office-address-book.png",
    canMultipleSupport : false
  },

  construct : function(condition)
  {
    this.base(arguments);
    var layout = new qx.ui.layout.Grid();
    layout.setSpacingY(10);
    this.setLayout(layout);

    // 保存条件，当不存在条件的时候新建条件
    this._condition = new tvproui.statistic.FilterCondition.FilterCondition();
    if(condition)
    {
      this._resultCondition = condition;
      this._condition.set({id: condition.getId(), description: condition.getDescription(), condition: condition.getCondition()});
    }

    condition = this._condition;

    /* 第一行 条件名称 输入框 保存 取消 */
    var conditionNameEditor = new qx.ui.form.TextField(condition.getDescription());
    conditionNameEditor.setPlaceholder("请在这里输入条件名称");
    conditionNameEditor.bind("changeValue", condition, "description");

    var saveButton = new qx.ui.form.Button("保存");
    var cancelButton = new qx.ui.form.Button("取消");
    saveButton.addListener("execute", this._saveWindow, this);
    cancelButton.addListener("execute", this.close, this);

    var lineOneLayout = new qx.ui.layout.Grid();
    var lineOne = new qx.ui.container.Composite(lineOneLayout);
    lineOne.add(new qx.ui.basic.Label("条件名称*"), {row: 0, column:0});
    lineOne.add(conditionNameEditor, {row: 0, column:1});
    lineOne.add(saveButton, {row: 0, column:2});
    lineOne.add(cancelButton, {row: 0, column:3});
    lineOneLayout.setColumnFlex(1, 1);
    lineOneLayout.setSpacingX(10);
    lineOneLayout.setRowAlign(0, "center", "middle");
    this.add(lineOne, {row: 0, column:0});

    /* 第二行，输入框, 第三行JSON语句错误提示 */
    var JSONLabel = new qx.ui.basic.Label("语句无错误");
    JSONLabel.setTextAlign("right");
    JSONLabel.setAllowGrowX(true);
    JSONLabel.setRich(true);
    this._JSONLabel = JSONLabel;

    var JSONEditor = new qx.ui.form.TextArea(tvproui.utils.JSON.stringify(condition.getCondition()));
    this._JSONEdtor = JSONEditor;

    JSONEditor.bind("changeValue", condition, "condition", {converter:
      function(data, model, source, target)
      {
        JSONLabel.setValue("语句无错误");
        var json = null;
        try
        {
          json = JSON.parse(data);
        }
        catch(err)
        {
          JSONLabel.setValue("<span style='color:red'><b>" + err.toString() + "</b></span>");
        }
        return json;
      }
    });

    this.add(JSONEditor, {row: 1, column:0});
    this.add(JSONLabel, {row: 2, column:0});

    /* 第三行 字段选择 动态字段框 添加按钮 */
    var addButton = new qx.ui.form.Button("添加");
    addButton.addListener("execute", this._addButton, this);

    var fieldList = new qx.data.Array([
      new tvproui.statistic.FilterCondition.Field("栏目名称", "column", "文本"),
      new tvproui.statistic.FilterCondition.Field("时段名称", "subcolumn", "文本"),
      new tvproui.statistic.FilterCondition.Field("素材名称", "name", "文本"),
      new tvproui.statistic.FilterCondition.Field("播出时间", "beginTime", "时间"),
      new tvproui.statistic.FilterCondition.Field("结束时间", "endTime", "时间"),
      new tvproui.statistic.FilterCondition.Field("素材时长", "duration", "时间"),
      new tvproui.statistic.FilterCondition.Field("素材类型", "type", "素材类型"),
    ]);

    // 加载维度数据
    var vectors = tvproui.AjaxPort.call("statistic/loadPredictVector", {});
    if (vectors || vectors.length > 0)
    {
      for (var i = 0, l = vectors.length; i < l; i++)
      {
        var vector = vectors[i];
        fieldList.push(new tvproui.statistic.FilterCondition.Field(vector.vectorname, vector.vectorname, "维度"));
      }
    }

    var fieldListSelect = new qx.ui.form.VirtualSelectBox(fieldList).set( {
      labelPath : "displayName"
    });

    fieldListSelect.bind("selection[0].displayName", fieldListSelect, "toolTipText");

    var fieldsSelections = fieldListSelect.getSelection();
    fieldsSelections.addListener("change", function(e)
    {
      var field = fieldsSelections.getItem(0);
      var fieldTypeInput = tvproui.statistic.FilterCondition.FieldType.getFieldTypeInstance(field.getFieldType(), field.getFieldName());
      lineThree.remove(this._currentFieldEditor);
      lineThree.add(fieldTypeInput, {row: 0, column: 2});
      this._currentFieldEditor = fieldTypeInput;
      this._currentField = field;
    }, this)

    var lineThreeLayout = new qx.ui.layout.Grid();
    var lineThree = new qx.ui.container.Composite(lineThreeLayout);
    lineThree.add(new qx.ui.basic.Label("字段"), {row: 0, column:0});
    lineThree.add(fieldListSelect, {row: 0, column:1});

    layout.setColumnFlex(0, 1);
    layout.setRowFlex(1, 1);

    var field = fieldsSelections.getItem(0);
    var fieldTypeInput = tvproui.statistic.FilterCondition.FieldType.getFieldTypeInstance(field.getFieldType(), field.getFieldName());
    lineThree.add(fieldTypeInput, {row: 0, column: 2});
    this._currentField = field;
    this._currentFieldEditor = fieldTypeInput;
    lineThree.add(addButton, {row: 0, column:3});
    lineThreeLayout.setRowAlign(0, "center", "middle");

    this.add(lineThree, {row:3, column: 0});
    lineThreeLayout.setColumnFlex(2, 1);
    lineThreeLayout.setSpacingX(10);

    this.setWidth(650);
    this.setHeight(300);
  },
  members :
  {
    _condition: null,
    _resultCondition: null,
    _JSONLabel: null,
    _JSONEdtor: null,
    _currentField: null,
    _currentFieldEditor: null,

    getCondition: function()
    {
      return this._resultCondition;
    },

    _addButton: function()
    {
      var condition = this._condition.getCondition();
      var field = this._currentField;
      var fieldEditor = this._currentFieldEditor;
      var resultCondition = fieldEditor.getCondition();

      if(resultCondition)
      {
        condition[field.getFieldName()] = resultCondition;
      }
      else
      {
        delete condition[field.getFieldName()];
      }

      // 回写语句
      var JSONEditor = this._JSONEdtor;
      JSONEditor.setValue(tvproui.utils.JSON.stringify(condition));
    },

    _saveWindow: function()
    {
      if(this._condition.getDescription() == "")
      {
        dialog.Dialog.error("必须为该查询条件命名!");
        return;
      }

      if(this._JSONLabel.getValue() != "语句无错误")
      {
        dialog.Dialog.error("语句必须没有错误方可保存!");
        return;
      }

      this._resultCondition = this._condition;
      this.close();
    }
  },

  // 界面之外的内容释放
  destruct : function()
  {
    this._condition = null;
    this._resultCondition = null;
    this._JSONLabel = null;
    this._JSONEditor = null;
    this._currentField = null;
    this._currentFieldEditor = null;
  }
});
