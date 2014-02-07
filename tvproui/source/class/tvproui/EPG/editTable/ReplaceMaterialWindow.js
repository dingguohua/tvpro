
/**
 * @author Administrator
 */
qx.Class.define("tvproui.EPG.editTable.ReplaceMaterialWindow",
{
  extend: tvproui.control.ui.window.Window,
  statics:
  {
    applicationName :"素材全局替换",
    applicationIcon : "icon/22/places/user-home.png",
    canMultipleSupport :false
  },
  construct : function(data)
  {
    this.base(arguments);
    this.setModal(true);
    this.setResizable(true);
    this.setShowMaximize(false);
    this.setShowMinimize(false);
    this.setAllowMaximize(false);
    this.setWidth(360);
    this._EPGVersionID = data.EPGVersionID;
    this._channelID = data.channelID;
    this._dataModel = data.dataModel;
    var layout = new qx.ui.layout.Grid(12, 6);
    layout.setColumnFlex(1, 1);
    this.setLayout(layout);

    /* 目标 */
    this.add(new qx.ui.basic.Label("目标").set( {
      paddingTop : 5
    }),
    {
      row : 0,
      column : 0
    });
    this._targetSelector = new tvproui.control.ui.form.ComboBox(this._onTargetSelected);
    this._targetSelector.set( {
      paddingTop : 5
    });
    this.add(this._targetSelector,
    {
      row : 0,
      column : 1
    });
    this._targetSelector.addListener("keyup", this._onInputTargetValue, this);

    /* 替换 */
    this.add(new qx.ui.basic.Label("替换为").set( {
      paddingTop : 5
    }),
    {
      row : 1,
      column : 0
    });
    this._repaceWithSelector = new tvproui.control.ui.form.ComboBox(this._onTargetSelected);
    this._repaceWithSelector.set( {
      paddingTop : 5
    });
    this.add(this._repaceWithSelector,
    {
      row : 1,
      column : 1
    });
    this._repaceWithSelector.addListener("keyup", this._onRepaceWithTargetValue, this);
    var composite = new qx.ui.container.Composite();
    var hboxLayout = new qx.ui.layout.HBox(6);
    hboxLayout.setAlignX("right");
    composite.setLayout(hboxLayout);
    this.add(composite,
    {
      row : 2,
      column : 1
    });
    var ReplaceButton = new qx.ui.form.Button("替换");
    composite.add(ReplaceButton);
    var cancelButton = new qx.ui.form.Button("取消");
    composite.add(cancelButton);
    this._replaceButton = ReplaceButton;
    ReplaceButton.addListener("execute", this._onReplaceButton, this);
    cancelButton.addListener("execute", this._onCancelButton, this);
  },
  members :
  {
    _targetSelector : null,
    _repaceWithSelector : null,
    _timer : null,
    _EPGVersionID : null,
    _channelID : null,
    _dataModel : null,


    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onInputTargetValue : function(e)
    {
      switch (e.getKeyCode())
      {
        case 13://Enter
        this._repaceWithSelector.focus();
        case 27://ESC
        case 37://左
        case 38://上
        case 39://右
        case 40://下
        return;
        break;
      }

      // 如果有有效的Timer，那么清除它
      if (this._timer) {
        clearTimeout(this._timer);
      }
      var cellReplaceor = e.getCurrentTarget();
      var name = cellReplaceor.getValue();
      var that = this;
      var EPGVersionID = this._EPGVersionID;
      if (name == "") {
        return;
      }

      // 新建Timer, 延时1秒后调用
      this._timer = setTimeout(function(e)
      {
        that._timer = null;
        cellReplaceor.removeAll();

        // 查询服务器
        var rows = tvproui.EPG.editTable.MaterialSelector.getProperMaterial("Material/getlikeMatchMaterialByEPG",
        {
          "ID" : EPGVersionID,
          "name" : name
        });
        if (!rows) {
          return;
        }
        for (var i = 0, l = rows.length; i < l; i++)
        {
          var row = rows[i];
          cellReplaceor.add(new qx.ui.form.ListItem(row.name + "   " + row.duration.toString(), row.style.path, row));
        }
        cellReplaceor.open();
      }, 100);
    },


    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onRepaceWithTargetValue : function(e)
    {
      switch (e.getKeyCode())
      {
        case 13://Enter
        this._replaceButton.focus();
        case 27://ESC
        case 37://左
        case 38://上
        case 39://右
        case 40://下
        return;
        break;
      }

      // 如果有有效的Timer，那么清除它
      if (this._timer) {
        clearTimeout(this._timer);
      }
      var cellReplaceor = e.getCurrentTarget();
      var name = cellReplaceor.getValue();
      var that = this;
      var channelID = this._channelID;
      if (name == "") {
        return;
      }

      // 新建Timer, 延时1秒后调用
      this._timer = setTimeout(function(e)
      {
        that._timer = null;
        cellReplaceor.removeAll();

        // 查询服务器
        var rows = tvproui.EPG.editTable.MaterialSelector.getProperMaterial("Material/getlikeMatchMaterial",
        {
          "ID" : channelID,
          "name" : name
        });
        if (!rows) {
          return;
        }
        for (var i = 0, l = rows.length; i < l; i++)
        {
          var row = rows[i];
          cellReplaceor.add(new qx.ui.form.ListItem(row.name + "   " + row.duration.toString(), row.style.path, row));
        }
        cellReplaceor.open();
      }, 100);
    },


    /**
     * TODOC
     *
     * @param item {var} TODOC
     */
    _onTargetSelected : function(item)
    {
      var rowData = item.getModel();
      this.setValue(rowData.name);
      this.setUserData("rowData", rowData);
    },


    /**
     * TODOC
     *
     * @return {boolean} TODOC
     */
    _onReplaceButton : function()
    {

      // 准备目标，目标识别方式IDMaterial
      var sourceRow = this._targetSelector.getUserData("rowData");
      if (!sourceRow)
      {
        dialog.Dialog.error("请选择编播单内素材作为目标");
        return;
      }
      var targetMaterialID = sourceRow.id;

      // 准备替换为
      var replacetRow = this._repaceWithSelector.getUserData("rowData");
      if (!replacetRow)
      {
        dialog.Dialog.error("请选择素材库内素材作为目标");
        return;
      }

      // 清除变更记录
      var model = this._dataModel;

      // 循环整表
      var nodes = model.getData();
      model.cleanChanged();
      var commitDescription = ["替换素材 ["];
      var count = 0;
      for (var nodeID in nodes)
      {
        if (0 == nodeID) {
          continue;
        }
        var node = nodes[nodeID];
        var columnData = node.columnData;
        if (columnData.IDMaterial != targetMaterialID) {
          continue;
        }
        commitDescription.push(columnData.beginTime.toString(), columnData.type, " ", columnData.name, ", ");

        // 修改名称
        model.updateItemByID(nodeID, "name", replacetRow.name, columnData.name);
        model.updateItemByID(nodeID, "type", replacetRow.type, columnData.type);
        model.updateItemByID(nodeID, "IDMaterial", replacetRow.id, columnData.IDMaterial);
        model.updateItemByID(nodeID, "duration", replacetRow.duration, columnData.duration);

        /* 重新计算父级时长 */
        model._calcSumTime(node.parent);

        // 执行变更
        var orginFixed = columnData.fixed;
        columnData.fixed = true;
        model.fixAll(0);
        columnData.fixed = orginFixed;

        // 变更提示
        columnData.changed = true;
        count++;
      }

      // 提交更新
      model.commitUpdate();
      commitDescription.pop();
      commitDescription.push("] 为 ", replacetRow.type, " ", replacetRow.name);

      // 提交事务
      model.commitTrans(commitDescription.join(""));

      // 提示
      dialog.Dialog.alert("完成替换" + count + "次!");
      this.close();
    },


    /**
     * TODOC
     *
     */
    _onCancelButton : function() {
      this.close();
    }
  },

  // 界面之外的内容释放
  destruct : function()
  {

    // 去除多余的引用
    this._targetSelector = null;
    this._repaceWithSelector = null;
    this._timer = null;
    this._EPGVersionID = null;
    this._channelID = null;
    this._dataModel = null;
  }
});
