
/**
 * @author 张未波
 * 组合命令类
 */
qx.Class.define("tvproui.statistic.FilterCondition.TimeFieldType",
{
  extend : tvproui.statistic.FilterCondition.FieldType,
  construct: function()
  {
    this.base(arguments);

    // 文本编辑器框
    this._methodField = new qx.ui.form.VirtualSelectBox(new qx.data.Array(["时段", "早于", "晚于", "删除"]));
    this._beginField = new tvproui.control.ui.form.TimeSpinner(tvproui.utils.Time.from("07:00:00"));
    this._endField = new tvproui.control.ui.form.TimeSpinner(tvproui.utils.Time.from("07:30:00"));
    var beginLable = new qx.ui.basic.Label("开始");
    var endLable = new qx.ui.basic.Label("结束");

    // 开始时间晚于结束时间时，结束时间等于开始时间
    this._beginField.addListener("changeValue", function(e)
    {
      var beginTime = this._beginField.getValue();
      var endTime = this._endField.getValue();
      if(beginTime.after(endTime))
      {
        this._endField.setValue(beginTime.clone());
      }
    }, this);

    // 当结束时间早于开始时间时，开始时间等于结束时间
    this._endField.addListener("changeValue", function(e)
    {
      var beginTime = this._beginField.getValue();
      var endTime = this._endField.getValue();
      if(endTime.before(beginTime))
      {
        this._beginField.setValue(endTime.clone());
      }
    }, this);

    this.add(this._methodField  , {row: 0, column:0});
    this.add(beginLable         , {row: 0, column:1});
    this.add(this._beginField , {row: 0, column:2});
    this.add(endLable           , {row: 0, column:3});
    this.add(this._endField , {row: 0, column:4});

    var layout = this._layout;

    // 设定文本框最大化
    layout.setColumnFlex(2, 0.5);
    layout.setColumnFlex(4, 0.5);

    var methodSelections = this._methodField.getSelection();
    methodSelections.addListener("change", function(e)
    {
      var method = methodSelections.getItem(0);
      switch(method)
      {
        case "时段":
          beginLable.setVisibility("visible");
          this._beginField.setVisibility("visible");
          endLable.setVisibility("visible");
          this._endField.setVisibility("visible");
          break;
        case "早于":
          beginLable.setVisibility("visible");
          this._beginField.setVisibility("visible");
          endLable.setVisibility("hidden");
          this._endField.setVisibility("hidden");
          break;
        case "晚于":
          beginLable.setVisibility("hidden");
          this._beginField.setVisibility("hidden");
          endLable.setVisibility("visible");
          this._endField.setVisibility("visible");
          break;
        case "删除":
          beginLable.setVisibility("hidden");
          this._beginField.setVisibility("hidden");
          endLable.setVisibility("hidden");
          this._endField.setVisibility("hidden");
          break;
      }
    }, this)
  },

  members :
  {
    _methodField: null,
    _beginField : null,
    _endField   : null,

    getCondition: function()
    {
      var methodSelections = this._methodField.getSelection();
      var method = methodSelections.getItem(0);
      var beginTime = this._beginField.getValue().getTime();
      var endTime = this._endField.getValue().getTime();
      switch(method)
      {
        case "时段":
          return ["between", [beginTime, endTime]];
          break;
        case "早于":
          return ["lt", beginTime];
          break;
        case "晚于":
          return ["gt", endTime];
          break;
        case "清除":
          return null;
          break;
      }

      return null;
    }
  },

  // 界面之外的内容释放
  destruct : function() 
  {
    this._methodField = null;
    this._beginField  = null;
    this._endField    = null;
  }
});

