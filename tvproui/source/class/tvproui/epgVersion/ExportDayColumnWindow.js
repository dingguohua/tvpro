
/**
 * @author Administrator
 */

/* ************************************************************************
#asset(qx/icon/${qx.icontheme}/22/categories/*)
#asset(tvproui/layout/*)
#asset(tvproui/*)
************************************************************************ */
qx.Class.define("tvproui.epgVersion.ExportDayColumnWindow",
{
  extend: tvproui.control.ui.window.Window,
  statics:
  {
    applicationName: "导出为日节目预排表",
    applicationIcon: "icon/22/categories/internet.png",
    canMultipleSupprot: false
  },
  construct : function(data)
  {
    this.base(arguments);
    var gridLayout = new qx.ui.layout.Grid(10, 10);
    gridLayout.setColumnFlex(0, 1);
    this.setLayout(gridLayout);
    this.setModal(true);
    this.setHeight(200);
    this.setWidth(400);
    this.setResizable(false);
    this.setShowMaximize(false);
    this.setShowMinimize(false);
    this.setAllowMaximize(false);

    this.add(new qx.ui.basic.Label("目标版面"),
      {
        row: 0,
        column: 0
      });

    this._targetList = new qx.ui.list.List().set(
      {
        labelPath : "label",
        iconPath: "icon",
        selectionMode : "single",
        itemHeight : 36
      });

    var model = qx.data.marshal.Json.createModel(versionModel);
    this._targetList.setModel(model);
    this.add(this._targetList,
    {
      row : 1,
      column : 0,
      rowSpan : 5
    });

    // 播出日期
    this.add(new qx.ui.basic.Label("播出日"),
    {
      row : 0,
      column : 1
    });
    this._dayPicker = new qx.ui.form.SelectBox();

    /* 将第一列数字星期几替换为中文显示 */
    var dayNames = tvproui.layout.LayoutVersionTable.dayNames;

    /* 生成表格星期几编辑时中文到数字星期几的对应关系 */
    for (var i = 1, l = dayNames.length; i < l; i++)
    {
      var dayName = dayNames[i];
      this._dayPicker.add(new qx.ui.form.ListItem(dayName, null, i));
    }
    this._dayPicker.addListener("changeSelection", this._onDateChanged, this);
    this.add(this._dayPicker,
    {
      row : 1,
      column : 1
    });

    // 编播表名称
    this.add(new qx.ui.basic.Label("日节目预排表名称"),
    {
      row : 2,
      column : 1
    });
    this._nameField = new qx.ui.form.TextField();
    this.add(this._nameField,
    {
      row : 3,
      column : 1
    });

    // 确定按钮
    var exportButton = new qx.ui.form.Button("导出");
    this.add(exportButton,
    {
      row : 4,
      column : 1
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
    this._epgVersionIDs = data.epgVersionIDs;
  },
  members :
  {
    _epgVersionIDs : null,
    _targetList : null,
    _dayPicker : null,
    _nameField : null,


    /**
     * TODOC
     *
     */
    _onDateChanged : function()
    {
      var selection = this._dayPicker.getSelection();
      this._nameField.setValue(selection[0].getLabel());
    },


    /**
     * TODOC
     *
     */
    onExportButtonClicked : function()
    {
      var channelID = this._channelID;
      var epgVersionIDs = this._epgVersionIDs;
      var caption = this._nameField.getValue();
      if ((null == caption) || ("" == caption))
      {
        dialog.Dialog.error("请输入编播表名称!");
        return;
      }
      var broadcastDay = this._dayPicker.getSelection()[0].getModel();
      var selection = this._targetList.getSelection();
      if (selection.length === 0)
      {
        dialog.Dialog.error("请选择目标节目预排表!");
        return;
      }
      var targetName = selection.getItem(0).getLabel();
      var targetID = selection.getItem(0).getId();

      // 新建日节目预排表
      var layoutVersionID = tvproui.AjaxPort.call("layoutVersion/addLayoutVersion",
      {
        "parentID" : targetID,
        "position" : "0",

        //个verion下面的日表数量
        "name" : caption,
        "channelID" : channelID,
        "weekday" : broadcastDay
      });
      var rows = [];
      for (var i = 0, l = epgVersionIDs.length; i < l; i++)
      {
        var epgVersion = epgVersionIDs[i];
        var epgVersionID = epgVersion.epgVersionID;
        var subVersionID = epgVersion.subVersionID;

        // 加载编播表
        var result = tvproui.AjaxPort.call("epgVersion/getSelectedEPGVersion",
        {
          "ID" : epgVersionID,
          "subversion": subVersionID
        });

        if (null == result) {
          return;
        }

        var data = qx.lang.Json.parse(result.content);
        if(!data)
        {
          continue;
        }

        var nodes = [];
        var nodeMap = data.nodeMap;
        var children = nodeMap[0].children;
        for(var j = 0, jl = children.length; j < jl; j++)
        {
          var childID = children[j];
          nodes.push(nodeMap[childID].columnData);
        }

        rows = rows.concat(nodes);
      }

      // 加载完数据以后需要排序
      for (var i = 0, l = rows.length; i < l; i++)
      {
        var row = rows[i];
        tvproui.AjaxPort.call("column/addColumnDuration",
        {
          "resourcetree_id" : row.IDMaterial,
          "name" : row.name,
          "beginTime" : tvproui.utils.Time.fromOffset(row.beginTime).toString(),
          "endTime" : tvproui.utils.Time.fromOffset(row.endTime).toString(),
          "layoutversionid" : layoutVersionID,
          "fixed" : row.fixed
        });
      }

      // 打开日节目预排表
      tvproui.Application.desktop.loadWindow(tvproui.column.ColumnManagement,
      {
        layoutVersionID : layoutVersionID,
        channelID : channelID,
        name : targetName + " > " + caption
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
    this._epgVersionIDs = null;
    this._targetList = null;
    this._dayPicker = null;
    this._nameField = null;
  }
});
