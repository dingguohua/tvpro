
/**
 * @author Administrator
 */

/* ************************************************************************
#asset(qx/icon/${qx.icontheme}/22/categories/*)
************************************************************************ */
qx.Class.define("tvproui.epgVersion.ExportEPGWindow",
{
  extend : tvproui.control.ui.window.Window,
  statics :
  {
    applicationName : "历史版本另存为编播表",
    applicationIcon : "icon/22/categories/accessories.png",
    canMultipleSupport : false
  },
  construct : function(data)
  {
    this.base(arguments);
    var gridLayout = new qx.ui.layout.Grid(10, 10);
    this.setLayout(gridLayout);
    this.setModal(true);
    this.setResizable(false);
    this.setShowMaximize(false);
    this.setShowMinimize(false);
    this.setAllowMaximize(false);
    gridLayout.setColumnWidth(0, 100);
    gridLayout.setColumnWidth(1, 100);

    // 播出日期
    this.add(new qx.ui.basic.Label("播出日期"),
    {
      row : 0,
      column : 0,
      colSpan : 2
    });
    this._datePicker = new tvproui.control.ui.form.DateField();
    var now = new Date();
    this._datePicker.setMinDate(now);
    this._datePicker.setValue(now);
    this.add(this._datePicker,
    {
      row : 1,
      column : 0,
      colSpan : 2
    });

    // 编播表名称
    this.add(new qx.ui.basic.Label("编播表名称"),
    {
      row : 2,
      column : 0,
      colSpan : 2
    });
    this._nameField = new qx.ui.form.TextField();
    this.add(this._nameField,
    {
      row : 3,
      column : 0,
      colSpan : 2
    });

    // 确定按钮
    var exportButton = new qx.ui.form.Button("保存");
    this.add(exportButton,
    {
      row : 4,
      column : 0
    });
    exportButton.addListener("execute", this.onExportButtonClicked, this);

    // 取消按钮
    var cancelButton = new qx.ui.form.Button("取消");
    this.add(cancelButton,
    {
      row : 4,
      column : 1
    });
    cancelButton.addListener("execute", this.onCancelButtonClicked, this);
    this._nameField.setValue(data.tableName);
    this._channelID = data.channelID;
    this._channelICON = data.channelICON;
    this._channelName = data.channelName;
    this._multiVersionID = data.multiVersionID;
  },
  members :
  {
    _channelID : null,
    _channelName : null,
    _channelICON : null,
    _multiVersionID : null,
    _datePicker : null,
    _nameField : null,


    /**
     * TODOC
     *
     */
    onExportButtonClicked : function()
    {
      if (null === this._nameField.getValue())
      {
        dialog.Dialog.error("请输入编播表名称!");
        return;
      }
      var channelID = this._channelID;
      var channelName = this._channelName;
      var channelICON = this._channelICON;
      var multiVersionID = this._multiVersionID;
      var broadcastdate = tvproui.utils.Time.formatDate(this._datePicker.getValue());
      var caption = this._nameField.getValue();

      // 新建编播表
      var EPGVersionID = tvproui.AjaxPort.call("epgVersion/exportBackupToEPG",
      {
        "ID" : multiVersionID,
        "name" : caption,
        "broadcastdate" : broadcastdate,
        "channelID" : channelID
      });

      // 打开编播表
      tvproui.Application.desktop.loadWindow(tvproui.EPG.editTable.EPGEditWindow,
      {
        EPGVersionID : EPGVersionID,
        subVersionID: 1, // 新导出表格一定是1
        channelID : channelID,
        channelName : channelName,
        channelICON : channelICON,
        broadcastdate : broadcastdate,
        name : caption + " (" + broadcastdate + ")"
      });
      this.close();
    },


    /**
     * TODOC
     *
     */
    onCancelButtonClicked : function() {
      this.close();
    }
  },

  // 界面之外的内容释放
  destruct : function()
  {

    // 释放非显示层级对象
    // 去除多余的引用
    this._channelID = null;
    this._channelName = null;
    this._channelICON = null;
    this._multiVersionID = null;
    this._datePicker = null;
    this._nameField = null;
  }
});
