
/**
 * @author Administrator
 */
qx.Class.define("tvproui.material.PartEditWindow",
{
  extend : tvproui.control.ui.window.Window,
  statics :
  {
    applicationName : "批量修改",
    applicationIcon : "icon/22/categories/multimedia.png",
    canMultipleSupport : false
  },
  events : {
    PartEdited : "qx.event.type.Data"
  },
  construct : function(columnDisplayName)
  {
    this.base(arguments);
    this.setCaption("批量修改" + columnDisplayName);
    this.setModal(true);
    this.setResizable(false);
    this.setShowMaximize(false);
    this.setShowMinimize(false);
    this.setAllowMaximize(false);
    var layout = new qx.ui.layout.Grid(12, 6);
    this.setLayout(layout);

    /* 名称控件 第一行第二列，跨过一列 */
    var dateField = new qx.ui.form.DateField();
    dateField.setValue(new Date());
    dateField.setRequired(true);
    this._dateField = dateField;
    this.add(dateField,
    {
      row : 0,
      column : 0,
      colSpan : 5
    });
    var editButton = new qx.ui.form.Button("修改");
    this.add(editButton,
    {
      row : 1,
      column : 0
    });
    var clearButton = new qx.ui.form.Button("复原");
    this.add(clearButton,
    {
      row : 1,
      column : 4
    });
    var resetter = new qx.ui.form.Resetter();
    resetter.add(dateField);
    this._resetter = resetter;
    editButton.addListener("execute", this.onEditButton, this);
    clearButton.addListener("execute", this.onClearButton, this);
  },
  members :
  {
    _dateField : null,
    _resetter : null,


    /**
     * TODOC
     *
     * @return {boolean} TODOC
     */
    onEditButton : function() {
      this.fireDataEvent("PartEdited", this._dateField.getValue());
    },


    /**
     * TODOC
     *
     */
    onClearButton : function()
    {
      var resetter = this._resetter;
      resetter.reset();
    }
  },

  // 界面之外的内容释放
  destruct : function()
  {

    // 去除多余的引用
    this._dateField = null;
    this._resetter = null;
  }
});
