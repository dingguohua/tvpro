
/**
 * @author Administrator
 */

/* ************************************************************************
#asset(qx/icon/${qx.icontheme}/22/categories/*)
************************************************************************ */
qx.Class.define("tvproui.layout.ExportEPGWindow",
{
  extend : tvproui.control.ui.window.Window,
  statics :
  {
    applicationName : "导出为编播表",
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
    this._datePicker.addListener("changeValue", this._onDateChanged, this);

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
    this._exportDuration = new qx.ui.form.CheckBox("名称列导出时段");
    this.add(this._exportDuration,
    {
      row : 4,
      column : 0,
      colSpan : 2
    });
    this._exportDuration.setValue(true);

    // 确定按钮
    var exportButton = new qx.ui.form.Button("导出");
    this.add(exportButton,
    {
      row : 5,
      column : 0
    });
    exportButton.addListener("execute", this.onExportButtonClicked, this);

    // 取消按钮
    var cancelButton = new qx.ui.form.Button("取消");
    this.add(cancelButton,
    {
      row : 5,
      column : 1
    });
    cancelButton.addListener("execute", this.onCancelButtonClicked, this);
    this._onDateChanged();
    this._channelID = data.channelID;
    this._channelICON = data.channelICON;
    this._channelName = data.channelName;
    this._layoutVersionID = data.layoutVersionID;
  },
  members :
  {
    _channelID : null,
    _channelName : null,
    _channelICON : null,
    _layoutVersionID : null,
    _datePicker : null,
    _nameField : null,
    _exportDuration : null,


    /**
     * TODOC
     *
     */
    _onDateChanged : function() {
      this._nameField.setValue(tvproui.utils.Time.formatDate(this._datePicker.getValue()) + "日表");
    },


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
      var layoutVersionID = this._layoutVersionID;
      var broadcastdate = tvproui.utils.Time.formatDate(this._datePicker.getValue());
      var caption = this._nameField.getValue();
      var exportDuration = this._exportDuration.getValue();
      var resourceMap = null;
      if (exportDuration)
      {
        resourceMap = {

        };
        var resourceNodes = tvproui.resourceTree.Tree.loadNodeWithBuffer(undefined, 2, true);
        if ((!resourceNodes) || (!resourceNodes.datas))
        {
          dialog.Dialog.error("加载资源树节点出错!");
          return;
        }
        resourceNodes = resourceNodes.datas;
        for (var i = 0, l = resourceNodes.length; i < l; i++)
        {
          var node = resourceNodes[i];
          resourceMap[node.ID] = node;
        }
      }

      // 新建编播表
      var EPGVersionID = tvproui.AjaxPort.call("epgVersion/add",
      {
        "parentID" : "-1",
        "position" : "0",
        "name" : caption,
        "type" : "日播表",
        "broadcastdate" : broadcastdate,
        "channelID" : channelID
      });
      var rows = tvproui.AjaxPort.call("epgVersion/loadByEPGVersionID", {
        "ID" : EPGVersionID
      });
      if (null == rows) {
        return;
      }
      var epglock = rows.lock;
      rows = rows.datas;
      var rootID;
      for (var i = 0, l = rows.length; i < l; i++)
      {
        var row = rows[i];
        row.ID = parseInt(row.ID);
        row.level = parseInt(row.level);
        if (row.level == 0)
        {
          rootID = row.ID;
          break;
        }
      }

      // 加载周播表数据
      var rows = tvproui.AjaxPort.call("column/loadChannelDuration", {
        "layoutversionid" : layoutVersionID
      });
      if (rows.lock == null)
      {
        dialog.Dialog.error("加载日节目预排表失败!");
        return;
      }
      if (rows.lock == 1) {
        tvproui.AjaxPort.call("column/closeChannelDuration", {
          "layoutversionid" : layoutVersionID
        });
      }
      rows = rows.datas;
      var results = [];
      results.length = rows.length;
      var position = 0;
      var parentID = null;
      var lastName = null;
      var subPosition = 0;
      for (var i = 0, l = rows.length; i < l; i++)
      {
        var row = rows[i];
        var name = row.name;
        if (exportDuration)
        {
          var resourceNode = resourceMap[row.resourcetree_id];
          if (!resourceNode)
          {
            dialog.Dialog.error("栏目ID" + row.resourcetree_id + "未找到对应节点!");
            return;
          }
          var columnName = resourceNode.name;
          if (!lastName || columnName != lastName)
          {
            parentID = tvproui.EPG.editTable.command.AddCommand.executeServer(EPGVersionID, rootID, position++,
            {
              name : columnName,
              beginTime : row.beginTime,
              endTime : row.endTime,
              IDMaterial : row.resourcetree_id,
              type : "栏目",
              level : 1,
              fixed : row.fixed
            });
            lastName = columnName;
            subPosition = 0;
          }
          tvproui.EPG.editTable.command.AddCommand.executeServer(EPGVersionID, parentID, subPosition++,
          {
            name : name,
            beginTime : row.beginTime,
            endTime : row.endTime,
            IDMaterial : row.resourcetree_id,
            type : "栏目",
            level : 2,
            fixed : row.fixed
          });
        } else
        {
          tvproui.EPG.editTable.command.AddCommand.executeServer(EPGVersionID, rootID, position++,
          {
            name : name,
            beginTime : row.beginTime,
            endTime : row.endTime,
            IDMaterial : row.resourcetree_id,
            type : "栏目",
            level : 1,
            fixed : row.fixed
          });
        }
      }

      // 如果是可写模式，关闭引用的EPGVersion
      if (epglock == 1) {
        tvproui.AjaxPort.call("epgVersion/closeEPGByVersionID", {
          "ID" : EPGVersionID
        });
      }

      // 打开编播表
      tvproui.Application.desktop.loadWindow(tvproui.EPG.editTable.EPGEditWindow,
      {
        EPGVersionID : EPGVersionID,
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
    this._layoutVersionID = null;
    this._datePicker = null;
    this._nameField = null;
    this._exportDuration = null;
  }
});
