
/**
 * @author Administrator
 */

/* ************************************************************************
#asset(qx/icon/${qx.icontheme}/22/actions/*)
#asset(qx/icon/${qx.icontheme}/22/devices/*)
#asset(qx/icon/${qx.icontheme}/22/categories/*)
#asset(tvproui/table/*)
#asset(tvproui/layout/*)
************************************************************************ */
qx.Class.define("tvproui.epgVersion.approval.EPGApprovalTable",
{
  extend : qx.ui.container.Composite,
  construct : function(model, parentWindow)
  {

    /* 网格化布局，第一行是表格，第二行是工具栏 */
    var layout = new qx.ui.layout.Grid(10, 0);
    this.base(arguments, layout);
    this._parentWindow = parentWindow;

    /* 水平方向随着窗口缩放 */
    layout.setColumnFlex(0, 1);

    /* 垂直方向，中间的表格随着窗口缩放 */
    layout.setRowFlex(0, 1);

    /* 频道数据模型初始化 */
    this._dataModel = model;

    /* 建立表格 */
    this._table = new qx.ui.treevirtual.TreeVirtual(["名称", "类型", "检出主机", "播出日期", "频道", "描述", "送审人", "送审时间", "标签"], {
      dataModel : this._dataModel
    });
    this._table.setRowHeight(24);
    this._table.addListener("cellDblclick", this._beforeEdit, this);
    this._table.setHeight(300);

    /* 配置多选模式 */
    this._selectionModel = this._table.getSelectionModel();
    this._selectionModel.setSelectionMode(qx.ui.table.selection.Model.MULTIPLE_INTERVAL_SELECTION);

    /* 配置拖拽，鼠标聚焦 */
    this._table.setFocusCellOnMouseMove(true);

    // 增加功能选单
    this._initContextMenu();
    this._table.setContextMenuHandler(0, this._contextMenuHandler, this);
    this._table.setContextMenuHandler(1, this._contextMenuHandler, this);
    this._table.setContextMenuHandler(2, this._contextMenuHandler, this);
    this._table.setContextMenuHandler(3, this._contextMenuHandler, this);
    this._table.setContextMenuHandler(4, this._contextMenuHandler, this);
    this._table.setContextMenuHandler(5, this._contextMenuHandler, this);
    this._table.setContextMenuHandler(6, this._contextMenuHandler, this);
    this._table.setContextMenuHandler(7, this._contextMenuHandler, this);
    this._table.setContextMenuHandler(8, this._contextMenuHandler, this);

    /* 调整各列的渲染/编辑模式 */
    this._initTableColumnRender(this._table.getTableColumnModel());

    /* 将表格加入显示列表第二行位置 */
    this.add(this._table,
    {
      row : 0,
      column : 0
    });

    /* 初始化工具栏 */
    this.add(this._initToolBar(),
    {
      row : 1,
      column : 0
    });

    /* 默认屏蔽 */
    this.setEnabled(false);
    this._initTagSystem();

    // 初始化当前EPG
    this._currentEPG = {};
  },
  members :
  {
    _currentEPG: null,
    _popUp : null,
    _indicator : null,
    _table : null,
    _dataModel : null,
    _selectionModel : null,
    _columnCellRenderer : null,
    _columnCellEditor : null,
    _deleteButton : null,
    _editPart : null,
    _parentWindow : null,
    _versionEntry : null,


    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _openPopUP : function(e)
    {
      var popup = this._popUp;
      if (!popup.loadData(this._table))
      {
        popup.hide();
        return;
      }
      popup.placeToMouse(e);
      popup.show();
    },


    /**
     * TODOC
     *
     */
    _closePopUP : function()
    {
      var popup = this._popUp;
      popup.hide();
    },

    /* 初始化标签系统 */

    /**
     * TODOC
     *
     */
    _initTagSystem : function()
    {

      //表格模式5 epgversion
      this._table.tableType = 5;
      var scroller = this._table.getPaneScroller(1);
      this._indicator = scroller.getChildControl("focus-indicator");
      this._indicator.addListener("mousemove", function(e)
      {
        if (8 != this._table.getFocusedColumn())
        {

          /* 关闭显示 */
          this._closePopUP();
          return;
        }
        this._openPopUP(e);
      }, this);
      this._indicator.addListener("mouseout", function(e) {
        this._closePopUP();
      }, this);

      //显示标签提示窗口
      this._popUp = tvproui.tag.instance.TagInstancePopup.getInstance();
    },

    /* 初始化 列渲染器 */

    /**
     * TODOC
     *
     * @param columnModel {var} TODOC
     */
    _initTableColumnRender : function(columnModel)
    {
      var behavior = columnModel.getBehavior();

      /* 默认打开名称显示 */
      columnModel.setColumnVisible(0, true);
      behavior.setWidth(0, 250);
      var labelEditor = new tvproui.control.ui.table.celleditor.LabelEditor();
      columnModel.setCellEditorFactory(0, labelEditor);

      /* 类型 */
      columnModel.setColumnVisible(1, false);
      behavior.setWidth(1, 60);
      
      /* 检出状态显示 */
      columnModel.setColumnVisible(2, true);
      behavior.setWidth(2, 170);

      /* 播出日期 */
      columnModel.setColumnVisible(3, true);
      behavior.setWidth(3, 100);

      /* 默认打开频道显示 */
      columnModel.setColumnVisible(4, true);
      behavior.setWidth(4, 73);

      /* 描述 */
      columnModel.setColumnVisible(5, true);
      behavior.setWidth(5, 250);

      /* 默认打开用户显示 */
      columnModel.setColumnVisible(6, true);
      behavior.setWidth(6, 73);

      /* 默认打开送审时间显示 */
      columnModel.setColumnVisible(7, true);
      behavior.setWidth(7, 170);

      /* 默认打开标签显示 */
      columnModel.setColumnVisible(8, true);
      behavior.setWidth(8, 170);

      /* 标签列使用标签渲染器和标签编辑器 */
      columnModel.setDataCellRenderer(8, new tvproui.control.ui.table.cellrenderer.TagRender(22, 22));
    },

    /* 初始化工具栏 */

    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    _initToolBar : function()
    {
      var toolbar = new qx.ui.toolbar.ToolBar();

      /* 工具栏的操作分段 */
      var actionPart = new qx.ui.toolbar.Part();
      toolbar.add(actionPart);

      /* 增加菜单，可以用于增加预排表或日播出计划以及修改添加方向 */
      /* 加入打开按钮到编辑分段中 */
      var openButton = new qx.ui.toolbar.Button("打开", "icon/22/actions/document-open.png");
      openButton.addListener("execute", this._onOpenButton, this);
      actionPart.add(openButton);

      /* 刷新按钮 */
      var refreshButton = new qx.ui.toolbar.Button("刷新", "icon/22/actions/view-refresh.png");
      refreshButton.addListener("execute", this.loadData, this);
      actionPart.add(refreshButton);
      var versionButton = new qx.ui.toolbar.Button("版本", "tvproui/table/multipleVersion.png");
      versionButton.addListener("execute", this._onVersionButton, this);
      actionPart.add(versionButton);

      /* 工具栏的编辑分段 */
      var editPart = new qx.ui.toolbar.Part();
      toolbar.add(editPart);
      this._editPart = editPart;

      // 增加审核通过按钮
      var approvalOKButton = new qx.ui.toolbar.Button("审核通过", "icon/22/actions/dialog-apply.png");
      approvalOKButton.addListener("execute", this._onApprovalOKButton, this);
      actionPart.add(approvalOKButton);

      // 增加审核不通过按钮
      var approvalFailButton = new qx.ui.toolbar.Button("审核不通过", "icon/22/actions/dialog-close.png");
      approvalFailButton.addListener("execute", this._onApprovalFailButton, this);
      actionPart.add(approvalFailButton);
      return toolbar;
    },


    /**
     * TODOC
     *
     */
    _initContextMenu : function()
    {

      // 增加审核通过按钮
      this._approvalOKEntry = new qx.ui.menu.Button("审核通过", "icon/22/actions/dialog-apply.png");
      this._approvalOKEntry.addListener("execute", this._onApprovalOKButton, this);

      // 增加审核不通过按钮
      this._approvalFailEntry = new qx.ui.menu.Button("审核不通过", "icon/22/actions/dialog-close.png");
      this._approvalFailEntry.addListener("execute", this._onApprovalFailButton, this);
      this._versionEntry = new qx.ui.menu.Button("版本", "tvproui/table/multipleVersion.png");
      this._versionEntry.addListener("execute", this._onVersionButton, this);
    },

    /* 根据需求获取当前选中项信息 */

    /**
     * TODOC
     *
     * @param level {var} TODOC
     * @return {void | var} TODOC
     */
    getSelectedItem : function(level)
    {
      if ((level < 0) || (level > 3))
      {
        dialog.Dialog.error("无效的选择范围");
        return;
      }
      var selectionModel = this._selectionModel;
      var selections = selectionModel.getSelectedRanges();
      var selectPos = null;
      for (var i = 0, l = selections.length; i < l; i++)
      {
        var section = selections[i];
        selectPos = section.maxIndex;
        break;
      }
      return this.getLevelNode(selectPos, level);
    },


    /**
     * TODOC
     *
     * @param level {var} TODOC
     * @return {void | var} TODOC
     */
    getSelectedItems : function(level)
    {
      if ((level < 0) || (level > 3))
      {
        dialog.Dialog.error("无效的选择范围");
        return;
      }
      var selectionModel = this._selectionModel;
      var selections = selectionModel.getSelectedRanges();
      var result = [];
      for (var i = 0, l = selections.length; i < l; i++)
      {
        var section = selections[i];
        for (var m = section.minIndex, n = section.maxIndex; m <= n; m++)
        {
          var node = this.getLevelNode(m, level);
          if (!node) {
            continue;
          }
          result.push(node);
        }
      }
      return result;
    },


    /**
     * TODOC
     *
     * @param row {var} TODOC
     * @param level {var} TODOC
     * @return {null | var} TODOC
     */
    getLevelNode : function(row, level)
    {

      /* 未有任何选中项 */
      if (null == row) {
        return null;
      }
      var dataModel = this._dataModel;
      var selectedNode = dataModel.getRowData(row)[0];
      var findParentLength = selectedNode.level - level;
      if (findParentLength < 0) {
        return null;
      }

      /* 递归向父级前进 */
      for (var i = 0; i < findParentLength; i++) {
        selectedNode = dataModel.getNodeByNodeId(selectedNode.parentNodeId);
      }
      return selectedNode;
    },


    /**
     * TODOC
     *
     * @param row {var} TODOC
     * @param level {var} TODOC
     * @return {null | var} TODOC
     */
    getLevelItem : function(row, level)
    {

      /* 未有任何选中项 */
      if (null == row) {
        return null;
      }
      var dataModel = this._dataModel;
      var selectedNode = dataModel.getRowData(row)[0];
      var findParentLength = selectedNode.level - level;
      if (findParentLength < 0) {
        return null;
      }

      /* 递归向父级前进 */
      for (var i = 0; i < findParentLength; i++) {
        selectedNode = dataModel.getNodeByNodeId(selectedNode.parentNodeId);
      }
      return selectedNode;
    },

    // 打开日节目预排表

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onOpenButton : function(e)
    {
      var item = this.getSelectedItem(1);
      if (null == item) {
        return;
      }
      var row = item.columnData.row;
      var currentEPG = this._currentEPG;
      if (currentEPG[item.nodeId])
      {
        currentEPG[item.nodeId].maximize();
        return;
      }

      // 检查服务器checkout状态，若被其他人检出，则status = false，subversion当前版本号，检出机器ID, 检出机器名称，若未被检出或检出人是自己，则status = true，subversion当前版本号，当前机器ID, 当前机器名称
      var EPGVersionID = row.epgversionid;
      var checkoutResult = tvproui.AjaxPort.call("epgVersion/checkoutByEPGVersionID",
      {
         "ID" : EPGVersionID
      });

      if(!checkoutResult)
      {
        dialog.Dialog.error(row.name + " 检出时出现错误!");
        return;
      }

      var readonly;

      // 被检出，且检出主机不是自己
      if(!checkoutResult.status && checkoutResult.hostid != tvproui.user.LoginWindow.currentHostID)
      {
        dialog.Dialog.alert(row.name + " 已经被检出在 " + checkoutResult.hostname + " 所以，在尚未提交之前，仅能以只读模式查看!");
        readonly = true;
      }
      else
      {
        // 若已经未被检出或检出主机是自己，写模式
        readonly = false;

        // TODO修改目前表格的检出状态
      }

      // 打开编辑窗口
      var configuration =
      {
        EPGVersionID : EPGVersionID,
        subVersionID: parseInt(checkoutResult.subversion),
        channelID : row.channelID,
        channelName : row.channelName,
        channelICON : row.channelICON,
        broadcastdate : row.broadcastdate,
        name : row.name + " (" + row.broadcastdate + ")"
      };

      var epgWindow = tvproui.Application.desktop.loadWindow(tvproui.EPG.editTable.EPGEditWindow, configuration);
      currentEPG[item.nodeId] = epgWindow;

      var model = this._dataModel;
      epgWindow.closeListenID = epgWindow.addListener("close", function(e)
      {
        delete currentEPG[item.nodeId];
        // 修改检出状态为未检出
        row.checkout = "未检出";
        model.setColumnData(item.nodeId, 3, row.checkout);
        model.setData();
      }, this);

      // 修改检出状态为本机
      row.checkout = tvproui.user.LoginWindow.currentHostName;
      model.setColumnData(item.nodeId, 2, row.checkout);
      model.setData();
    },


    /**
     * TODOC
     *
     * @param status {var} TODOC
     */
    _ApprovalButton : function(status)
    {
      // 处理所有的选中项
      var item = this.getSelectedItem(1);
      if (null == item) {
        return;
      }

      var model = this._dataModel;
      var row = item.columnData.row;
      var name = row.type + " 《" + row.name + "》";
      var formData = {
        'description' :
        {
          'type' : "TextArea",
          'label' : "备注(可选)",
          'lines' : 4,
          'value' : ""
        }
      };
      dialog.Dialog.form(name + " 将被审核" + status, formData, function(result)
      {
        if (!result)
        {
          dialog.Dialog.alert(name + " 审核被取消");
          return;
        }

        // 发送请求
        var rowID = item.nodeId;
        var serverResult = tvproui.AjaxPort.call("approvalflow/approveofflineflow",
        {
          "ID" : rowID,
          "status" : status,
          "description" : result.description
        });
        
        if (!serverResult)
        {
          dialog.Dialog.error(name + " 修正审核状态时遭遇技术错误，请联系长江龙新媒体公司!");
          return;
        }
        if (result.description) {
          tvproui.tag.instance.command.AddCommand.executeServer(
          {
            tag : "审核信息:" + result.description,
            tagType : 5,
            dataType : 5,
            dataID : row.epgversionid
          }, 0);
        }

        // 获取编播单用户
        var EPGUser = tvproui.AjaxPort.call("Message/getUsernameByEpgId", {
          ID : row.epgversionid
        });

        // 发审核结果通知
        tvproui.messager.messenger.MessageModel.sendMessage(name + " (" + row.broadcastdate + ") " + (status ? "已经通过审核 " : "未通过审核") + result.description, EPGUser, "没有附件");
        
        // 删除数据
        model.prune(rowID, true);
        model.setData();

      }, this);
    },


    /**
     * TODOC
     *
     */
    _onApprovalOKButton : function() {
      this._ApprovalButton("通过");
    },


    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onApprovalFailButton : function(e) {
      this._ApprovalButton("不通过");
    },


    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    loadData : function()
    {

      /* 停止编辑行为 */
      if (this._table.isEditing()) {
        this._table.stopEditing();
      }

      /* 默认屏蔽 */
      this.setEnabled(true);
      var result = this._loadData();
      if (result.lock)
      {
        this._editPart.setVisibility("hidden");
        this._parentWindow.setCaption("版本审核管理-  (" + result.alias + " 正在编辑)");
      } else
      {
        this._editPart.setVisibility("visible");
        this._parentWindow.setCaption("版本审核管理");
      }
      return result;
    },


    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    _loadData : function()
    {
      if (this._table.isEditing()) {
        this._table.stopEditing();
      }

      /* 清除选区 */
      this._table.getSelectionModel().resetSelection();

      /* 数据模型 */
      var model = this._dataModel;
      return model.loadData();
    },

    // 编辑之前的判断

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _beforeEdit : function(e)
    {
      var table = this._table;
      var dataModel = this._dataModel;
      var focusRow = table.getFocusedRow();
      if ((focusRow == null) || (focusRow >= dataModel.getRowCount()))
      {
        table.cancelEditing();
        return;
      }
      var focusCol = table.getFocusedColumn();
      switch (focusCol)
      {
        case 0:table.cancelEditing();
        this._onOpenButton();
        break;
      }
    },


    /**
     * 菜单处理
     *
     * @param col {var} TODOC
     * @param row {var} TODOC
     * @param table {var} TODOC
     * @param dataModel {var} TODOC
     * @param contextMenu {var} TODOC
     * @return {boolean} TODOC
     */
    _contextMenuHandler : function(col, row, table, dataModel, contextMenu)
    {
      contextMenu.add(this._approvalOKEntry);
      contextMenu.add(this._approvalFailEntry);
      contextMenu.add(this._versionEntry);
      return true;
    },


    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onVersionButton : function(e)
    {
      var item = this.getSelectedItem(1);
      if (null == item) {
        return;
      }
      var row = item.columnData.row;
      var model = new tvproui.epgVersion.EPGMultipleVersionModel(row.epgversionid, row.channelID, row.broadcastdate);
      var epgWindow = tvproui.Application.desktop.loadWindow(tvproui.epgVersion.EPGMultipleVersionWindow,
      {
        tableName : row.name,
        tableModel : model
      });
      epgWindow.set(
      {
        channelName : row.channelName,
        channelICON : row.channelICON
      });
    }
  },

  // 界面之外的内容释放
  destruct : function()
  {
    if (this._table.isEditing()) {
      this._table.stopEditing();
    }

    // 去除更新本窗口数据的事件监听器
    var currentEPG = this._currentEPG;
    for(var epgID in currentEPG)
    {
      var epgWindow = currentEPG[epgID];
      epgWindow.removeListenerById(epgWindow.closeListenID);
    }

    // 释放非显示层级对象
    this._dataModel.dispose();

    // 去除多余的引用
    this._currentEPG = null;
    this._popUp = null;
    this._indicator = null;
    this._table = null;
    this._dataModel = null;
    this._selectionModel = null;
    this._editPart = null;
    this._parentWindow = null;
    this._versionEntry = null;
  }
});
