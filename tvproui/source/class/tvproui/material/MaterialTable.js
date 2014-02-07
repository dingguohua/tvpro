
/**
 * @author Administrator
 */

/* ************************************************************************
#asset(qx/icon/${qx.icontheme}/22/actions/*)
#asset(qx/icon/${qx.icontheme}/22/categories/*)
#asset(tvproui/type/*)
************************************************************************ */
qx.Class.define("tvproui.material.MaterialTable",
{
  extend : qx.ui.container.Composite,
  properties : {

    /* 资源ID */
    resourceID :
    {
      nullable : false,
      check : "Integer"
    }
  },
  statics :
  {
    /**
     * TODOC
     *
     * @param typeName {var} TODOC
     * @return {var} TODOC
     */
    getMaterialTypeSelector : function(typeName)
    {
      var typeCellEditor = new qx.ui.table.celleditor.SelectBox();
      var types = tvproui.system.fileManager.getSelectorData();

      if(typeName){
        for(var i = 0,l = types.length;i<l; i++)
        {
          var type= types[i];
          if(type[0] == typeName){
            typeCellEditor.setListData([type]);
            break;
          }
        }
      }else{
        typeCellEditor.setListData(types);
      }
      return typeCellEditor;
    },


    /**
     * TODOC
     *
     * @param materialSetID {var} TODOC
     * @param name {var} TODOC
     * @param nomsgbox {var} TODOC
     * @return {boolean} TODOC
     */
    checkDuplicateName : function(materialSetID, name, nomsgbox)
    {
      var result = tvproui.AjaxPort.call("Material/checkDuplicateName",
      {
        "materialSetID" : materialSetID,
        "name" : name
      });
      if (result)
      {
        var valid = parseInt(result.valid);
        if (valid) {
          if (!nomsgbox) {
            dialog.Dialog.alert("注意，您输入的素材名称" + name + "在当前频道内已经存在, 建议您使用原有素材");
          }
        } else {
          dialog.Dialog.confirm("注意，您输入的素材名称" + name + "在当前频道内已被删除, 您是否要恢复被删除的素材?", function(dialogResult)
          {
            if (!dialogResult) {
              return;
            }
            var map = {
              ID : {
                "valid" : 1
              }
            };
            if (tvproui.AjaxPort.call("Material/updateItems", {
              "data" : tvproui.utils.JSON.stringify(map)
            }))
            {
              tvproui.system.desktop.instance.refreshAll();
              dialog.Dialog.alert("恢复成功, 请重新引用已经被回复的素材!");
            } else
            {
              dialog.Dialog.alert("恢复失败，请联系长江龙公司!");
            }
          });
        }
        return false;
      }
      return true;
    }
  },
  construct : function()
  {
    var layout = new qx.ui.layout.Grid(10,0);
    this.base(arguments);
    this.setLayout(layout);

    layout.setColumnFlex(0,1);
    layout.setRowFlex(0,1);

    this._dataModel = new tvproui.material.MaterialModel();

    this._table = new qx.ui.table.Table(this._dataModel);
    this._table.setRowHeight(24);
    this._table.addListener("dataEdited",this._onDataEdited,this);

    this._selectionManager = this._table.getSelectionModel();
    this._selectionManager.setSelectionMode(qx.ui.table.selection.Model.MULTIPLE_INTERVAL_SELECTION);
 
    /* 处理选中事件 */
    this._selectionManager.addListener("changeSelection", this._onSelectionChanged, this);

    /* 配置拖拽，鼠标聚焦 */
    this._table.setDraggable(true);
    this._table.setDroppable(true);
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

    /* 初始化拖动支持 */
    this._initDrag();
    this._initDrop();

    /* 默认屏蔽 */
    this.setEnabled(false);

    /* 初始化标签系统 */
    this._initTagSystem();
  },
  members :
  {
    _popUp : null,
    _table : null,
    _dataModel : null,
    _deleteButton : null,
    _undoButton : null,
    _redoButton : null,
    _selectionManager : null,
    _addEntry : null,
    _deleteEntry : null,
    _cutEntry : null,
    _copyEntry : null,
    _pasteEntry : null,
    _partEditEntry : null,
    _selectionAllCommand : null,


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

      //表格模式2代表Material
      this._table.tableType = 2;
      var scroller = this._table.getPaneScroller(0);
      var indicator = scroller.getChildControl("focus-indicator");
      indicator.addListener("mousemove", function(e)
      {
        if (8 != this._table.getFocusedColumn())
        {

          /* 关闭显示 */
          this._closePopUP();
          return;
        }
        this._openPopUP(e);
      }, this);
      indicator.addListener("mouseout", function(e) {
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

      /* 默认关闭ID显示 */
      columnModel.setColumnVisible(0, false);
      columnModel.setColumnWidth(0, 50);

      /* 默认打开名称显示 */
      columnModel.setColumnVisible(1, true);
      columnModel.setColumnWidth(1, 170);

      /* 默认类型显示 */
      columnModel.setColumnVisible(2, true);
      columnModel.setColumnWidth(2, 38);

      /* 默认时长显示 */
      columnModel.setColumnVisible(3, true);
      columnModel.setColumnWidth(3, 73);

      /* 默认失效显示  */
      columnModel.setColumnVisible(4, true);
      columnModel.setColumnWidth(4, 100);

      /* 默认编号显示  */
      columnModel.setColumnVisible(5, true);
      columnModel.setColumnWidth(5, 73);

      /* 默认用户名显示  */
      columnModel.setColumnVisible(6, true);
      columnModel.setColumnWidth(6, 73);

      /* 默认标签显示  */
      columnModel.setColumnVisible(7, true);
      columnModel.setColumnWidth(7, 170);

      /* 默认资源ID隐藏  */
      columnModel.setColumnVisible(8, false);
      columnModel.setColumnWidth(8, 40);

      /* 使得类型可以选择编辑 */
      columnModel.setCellEditorFactory(2, tvproui.material.MaterialTable.getMaterialTypeSelector());

      /* 第二列使用图像渲染器 */
      columnModel.setDataCellRenderer(2, new tvproui.material.MaterialImage(22, 22));

      /* 第三四列都用时间渲染器 */
      columnModel.setDataCellRenderer(3, new tvproui.control.ui.table.cellrenderer.TimeCellRender());
      columnModel.setCellEditorFactory(3, new tvproui.control.ui.table.celleditor.TimeCellEditor());

      /* 第四列都用时间渲染器 */
      columnModel.setCellEditorFactory(4, new tvproui.control.ui.table.celleditor.DateField());

      /* 标签列使用标签渲染器和标签编辑器 */
      columnModel.setDataCellRenderer(8, new tvproui.control.ui.table.cellrenderer.TagRender(22, 22));
      columnModel.setCellEditorFactory(8, new tvproui.control.ui.table.celleditor.TagEditor());
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

      /* 工具栏的编辑分段 */
      var editPart = new qx.ui.toolbar.Part();
      toolbar.add(editPart);

      /* 加入按钮到编辑分段中 */
      var addButton = new qx.ui.toolbar.Button("增加", "icon/22/actions/list-add.png");
      addButton.addListener("execute", this._onAddButton, this);
      editPart.add(addButton);

      /* 加入删除按钮到编辑分段中 */
      this._deleteButton = new qx.ui.toolbar.Button("删除", "icon/22/actions/list-remove.png");
      this._deleteButton.addListener("execute", this._onDeleteButton, this);
      editPart.add(this._deleteButton);

      /* 加入撤销按钮到编辑分段中 */
      // 全选命令
      var undoCommand = new qx.ui.core.Command("Ctrl+Z");
      this._undoButton = new qx.ui.toolbar.Button("撤销", "icon/22/actions/edit-undo.png", undoCommand);
      this._undoButton.addListener("execute", this._onUndoButton, this);
      editPart.add(this._undoButton);

      /* 监听事件决定是否启用撤销按钮 */
      this._dataModel.addListener("canUndo", this._onUndoListLengthChange, this);

      /* 监听事件决定是否启用撤销按钮 */
      this._dataModel.addListener("canRedo", this._onRedoListLengthChange, this);

      /* 加入重做按钮到编辑分段中 */
      var redoCommand = new qx.ui.core.Command("Ctrl+Y");
      this._redoButton = new qx.ui.toolbar.Button("重做", "icon/22/actions/edit-redo.png", redoCommand);
      this._redoButton.addListener("execute", this._onRedoButton, this);
      editPart.add(this._redoButton);

      // 批量修改
      var partEditEndTime = new qx.ui.menu.Button("失效期", "icon/22/actions/go-last.png");
      var partEditMenu = new qx.ui.menu.Menu();
      partEditMenu.add(partEditEndTime);
      var paretEditButton = new qx.ui.toolbar.MenuButton("批量修改", "icon/22/categories/utilities.png", partEditMenu);
      editPart.add(paretEditButton);
      partEditEndTime.addListener("execute", this._onPartEditEndTime, this);

      /* 监听事件决定是否启用删除按钮 */
      this._table.getSelectionModel().addListener("changeSelection", this._onChangeSelection, this);

      /* 工具栏的操作分段 */
      var actionPart = new qx.ui.toolbar.Part();
      toolbar.add(actionPart);

      /* 加入刷新按钮到编辑分段中 */
      var refreshButton = new qx.ui.toolbar.Button("刷新", "icon/22/actions/view-refresh.png");
      refreshButton.addListener("execute", this.loadData, this);
      actionPart.add(refreshButton);

      // 增加搜索按钮，快捷键Ctrl + F
      var filterByName = new qx.ui.toolbar.CheckBox("搜索", "tvproui/selection/byname.png");
      filterByName.addListener("execute", this._onFilterByName, this);
      actionPart.add(filterByName);

      // 全选命令
      var selectionAllCommand = new qx.ui.core.Command("Ctrl+A");
      selectionAllCommand.addListener("execute", this._selectionAllCommandExecute, this);
      this._selectionAllCommand = selectionAllCommand;

      /* 默认关闭删除功能 */
      this._deleteButton.setEnabled(false);
      this._undoButton.setEnabled(false);
      this._redoButton.setEnabled(false);
      return toolbar;
    },


    /**
     * TODOC
     *
     */
    _initContextMenu : function()
    {

      // 增加菜单
      var addEntry = new qx.ui.menu.Button("增加", "icon/22/actions/list-add.png");
      addEntry.addListener("execute", this._onAddButton, this);
      this._addEntry = addEntry;

      // 删除按钮
      var deleteEntry = new qx.ui.menu.Button("删除", "icon/22/actions/list-remove.png");
      deleteEntry.addListener("execute", this._onDeleteButton, this);
      this._deleteEntry = deleteEntry;

      // 剪切按钮
      var cutEntry = new qx.ui.menu.Button("剪切", "icon/22/actions/edit-cut.png");
      cutEntry.addListener("execute", this._onCutButton, this);
      this._cutEntry = cutEntry;

      // 复制按钮
      var copyEntry = new qx.ui.menu.Button("复制", "icon/22/actions/edit-copy.png");
      copyEntry.addListener("execute", this._onCopyButton, this);
      this._copyEntry = copyEntry;

      // 粘贴按钮
      var pasteEntry = new qx.ui.menu.Button("粘贴", "icon/22/actions/edit-paste.png");
      pasteEntry.addListener("execute", this._onPasteButton, this);
      this._pasteEntry = pasteEntry;

      // 批量修改
      var partEditEndTime = new qx.ui.menu.Button("失效期", "icon/22/actions/go-last.png");
      var partEditMenu = new qx.ui.menu.Menu();
      partEditMenu.add(partEditEndTime);
      var partEditEntry = new qx.ui.menu.Button("批量修改", "icon/22/categories/utilities.png", null, partEditMenu);
      this._partEditEntry = partEditEntry;
      partEditEndTime.addListener("execute", this._onPartEditEndTime, this);
    },

    /* 初始化拖出 */

    /**
     * TODOC
     *
     */
    _initDrag : function()
    {
      var table = this._table;

      //描述拖出数据范围，描述操作为复制
      table.addListener("dragstart", function(e)
      {
        e.addType("material");
        e.addAction("copy");
      }, this);

      //拖动请求，准备数据格式
      table.addListener("droprequest", function(e)
      {
        var table = this._table;
        var action = e.getCurrentAction();
        var type = e.getCurrentType();
        if (type != "material") {
          return;
        }
        if (action != "copy") {
          return;
        }
        var selections = table.getSelectionModel().getSelectedRanges();
        if (selections.length == 0) {
          return;
        }
        var model = this._dataModel;
        var copyDataArray = [];
        for (var i = 0, l = selections.length; i < l; i++)
        {
          var section = selections[i];
          var minIndex = section.minIndex;
          var maxIndex = section.maxIndex;
          copyDataArray = copyDataArray.concat(model.getCopyData(minIndex, maxIndex));
        }

        // 增加数据
        e.addData(type, copyDataArray);
      }, this);
    },

    // 拖入

    /**
     * TODOC
     *
     */
    _initDrop : function()
    {
      var table = this._table;
      table.setDroppable(true);
      table.addListener("drop", function(e)
      {

        // 锁定后不允许拖动
        var type = e.supportsType("material");
        if (type)
        {
          this._onDropMaterial(table, e);
          return;
        }
        dialog.Dialog.error("拖放类型不支持");
      }, this);
    },


    /**
     * 处理素材拖动
     *
     * @param table {var} TODOC
     * @param e {Event} TODOC
     */
    _onDropMaterial : function(table, e)
    {

      /* 获取剪切板中栏目数据 */
      var model = this._dataModel;
      var focusRow = table.getFocusedRow();
      if ((focusRow == null) || (focusRow >= model.getRowCount())) {
        return;
      }
      var materials = e.getData("material");
      if (null == materials) {
        return;
      }

      // 移动素材
      var selectionModel = this._selectionManager;
      selectionModel.resetSelection();
      for (var i = 0, l = materials.length; i < l; i++)
      {
        var materialID = materials[i].ID;
        model.moveItem(materialID, focusRow + 1);
        focusRow = model.getRowOfID(materialID);
        selectionModel.addSelectionInterval(focusRow, focusRow);
      }

      // 提交更新
      model.commitUpdate();

      // 提交事务
      model.commitTrans();
    },

    /* 剪切 */

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onCutButton : function(e)
    {

      /* 停止编辑行为 */
      if (this._table.isEditing()) {
        this._table.stopEditing();
      }

      /* 决定复制项目 */
      var model = this._dataModel;
      var selectionModel = this._table.getSelectionModel();
      var selections = selectionModel.getSelectedRanges();
      if (selections.length == 0) {
        return;
      }
      var copyDataArray = [];
      for (var i = 0, l = selections.length; i < l; i++)
      {
        var section = selections[i];
        var minIndex = section.minIndex;
        var maxIndex = section.maxIndex;
        copyDataArray = copyDataArray.concat(model.getCopyData(minIndex, maxIndex));
      }
      tvproui.utils.Clipper.putInto("Material", copyDataArray);

      /* 根据选择范围来删除 */
      model.deleteItems(selections);

      // 提交事务
      model.commitTrans();

      /* 清除选区 */
      selectionModel.resetSelection();
    },

    /* 复制 */

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onCopyButton : function(e)
    {

      /* 停止编辑行为 */
      if (this._table.isEditing()) {
        this._table.stopEditing();
      }

      /* 决定复制项目 */
      var model = this._dataModel;
      var selectionModel = this._table.getSelectionModel();
      var selections = selectionModel.getSelectedRanges();
      var copyDataArray;
      if (selections.length == 0)
      {
        var count = model.getRowCount();
        copyDataArray = model.getCopyData(0, count - 1);
      } else
      {
        copyDataArray = [];
        for (var i = 0, l = selections.length; i < l; i++)
        {
          var section = selections[i];
          var minIndex = section.minIndex;
          var maxIndex = section.maxIndex;
          copyDataArray = copyDataArray.concat(model.getCopyData(minIndex, maxIndex));
        }
      }
      tvproui.utils.Clipper.putInto("Material", copyDataArray);
    },

    /* 粘贴 */

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onPasteButton : function(e)
    {

      /* 停止编辑行为 */
      if (this._table.isEditing()) {
        this._table.stopEditing();
      }

      /* 决定粘贴项目及其位置 */
      var model = this._dataModel;
      var insertPos = model.getRowCount();

      /* 获取剪切板中栏目数据 */
      var copyDatas = tvproui.utils.Clipper.getLastProperItem("Material");
      if (null == copyDatas) {
        return;
      }

      /* 根据显示模式来处理线面的工作 */
      model.putCopyData(insertPos, copyDatas);

      // 提交事务
      model.commitTrans();
    },

    /* 当选取发生变化时处理一下 */

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onChangeSelection : function(e) {
      this._deleteButton.setEnabled(e.getTarget().getSelectedCount() > 0);
    },

    /* 当按下了添加按钮 */

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onAddButton : function(e)
    {
      if (this._table.isEditing()) {
        this._table.stopEditing();
      }

      /* 更新频道渲染器以及编辑选择器数据 */
      var resourceID = this.getResourceID();

      /* 获取插入点位置 */
      var model = this._dataModel;
      var insertPos = model.getRowCount();
      var selectionModel = this._table.getSelectionModel();
      var selections = selectionModel.getSelectedRanges();
      for (var i = 0, l = selections.length; i < l; i++)
      {
        var section = selections[i];
        insertPos = section.maxIndex + 1;
      }

      /* 获取最后一个节目的时间安排, 计算出新节目时间 */
      var type = "硬广告";
      var duration = tvproui.utils.Time.fromOffset(60);
      var endTime = "0000-00-00";
      var materialName = "新素材";
      if (insertPos > 0)
      {
        var lastProgram = model.getRowDataAsMap(insertPos - 1);
        type = lastProgram.type;
        duration = lastProgram.duration.clone();
        endTime = lastProgram.endTime;
        materialName = lastProgram.name;
        var nameContext = materialName.match(/\-\d$/);
        if (null == nameContext) {
          materialName += "-2";
        } else {
          var head = materialName.substr(0, nameContext.index + 1);
          materialName = head + (parseInt(materialName.substr(nameContext.index + 1)) + 1);
        }
      }
      var ID = tvproui.utils.IDManager.getLocalTempID();

      /* 增加新的数据  */
      if (!tvproui.material.MaterialTable.checkDuplicateName(resourceID, materialName)) {
        materialName += " (重名)";
      }
      ID = model.addItem(
      {
        ID : ID,
        name : materialName,
        type : type,
        duration : duration,
        endTime : endTime,
        resourceID : resourceID,
        artId : "",
        alias : tvproui.user.LoginWindow.currentUserAlias
      }, insertPos);

      // 提交事务
      model.commitTrans();
      var insertPosAfterSort = model.getRowOfID(ID);
      if(undefined === insertPosAfterSort)
      {
        return;
      }

      /* 更改选区 ,并滚动到新增行 */
      selectionModel.setSelectionInterval(insertPosAfterSort, insertPosAfterSort);
      if (insertPos > 0)
      {
        var scroller = this._table.getPaneScroller(0);
        var height = insertPosAfterSort * this._table.getRowHeight();
        scroller.setScrollY(height, true);
      }
    },

    /* 编辑数据 */

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onDataEdited : function(e)
    {
      var data = e.getData();
      if (data.value == data.oldValue) {
        return;
      }
      var model = this._dataModel;
      if ((data.col == 3) && (data.value.getTime() < 5))
      {
        dialog.Dialog.error("播出最小时间单位为5秒，不允许出现更短的素材!");
        model.setValue(data.col, data.row, data.oldValue);
        return;
      }
      switch (data.col)
      {

        // 名称验证
        case 1:var rowData = model.getRowDataAsMap(data.row);

        // 修改名称的重名验证
        if (!tvproui.material.MaterialTable.checkDuplicateName(rowData.resourceID, data.value)) {
          data.value += " (重名)";
        }
        break;

        // 时长不小屋5秒
        case 3:if (data.value.getTime() < 5)
        {
          dialog.Dialog.error("播出最小时间单位为5秒，不允许出现更短的素材!");
          model.setValue(data.col, data.row, data.oldValue);
          return;
        }
        break;
      }
      model.updateItem(data.row, data.col, data.value, data.oldValue);

      // 提交更新
      model.commitUpdate();

      // 提交事务
      model.commitTrans();
    },

    /* 当按下删除按钮 */

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onDeleteButton : function(e)
    {

      /* 根据选择范围来删除 */
      var selectionModel = this._table.getSelectionModel();
      var selections = selectionModel.getSelectedRanges();
      var model = this._dataModel;
      model.deleteItems(selections);

      // 提交事务
      model.commitTrans();

      /* 清除选区 */
      selectionModel.resetSelection();

      // 清除焦点
      var table = this._table;
      var rowCount = this._dataModel.getRowCount();
      if (rowCount > 0) {
        table.setFocusedCell(table.getFocusedColumn(), rowCount - 1);
      } else {
        table.setFocusedCell(null, null);
      }
    },

    /* 撤销列表长度变化 */

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onUndoListLengthChange : function(e)
    {
      var canUndo = e.getData();
      if (canUndo) {
        this._undoButton.setEnabled(true);
      } else {
        this._undoButton.setEnabled(false);
      }
    },

    /* 重做列表长度变化 */

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onRedoListLengthChange : function(e)
    {
      var canRedo = e.getData();
      if (canRedo) {
        this._redoButton.setEnabled(true);
      } else {
        this._redoButton.setEnabled(false);
      }
    },

    /* 撤销按钮处理 */

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onUndoButton : function(e)
    {
      if (!this._undoButton.getEnabled()) {
        return;
      }
      this._dataModel.undo();
    },

    /* 撤销按钮处理 */

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onRedoButton : function(e)
    {
      if (!this._redoButton.getEnabled()) {
        return;
      }
      this._dataModel.redo();
    },


    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onSelectionChanged : function(e)
    {
      var selections = this._selectionManager.getSelectedRanges();
      this._table.setAdditionalStatusBarText(this._dataModel.sumDuration(selections));
    },


    /**
     * TODOC
     *
     */
    loadData : function()
    {

      /* 默认屏蔽 */
      this.setEnabled(true);

      /* 加载数据更新视图 */
      this._loadData();
    },


    /**
     * TODOC
     *
     */
    _loadData : function()
    {
      if (this._table.isEditing()) {
        this._table.stopEditing();
      }

      /* 默认关闭删除，保存按钮功能 */
      this._deleteButton.setEnabled(false);

      /* 清除选区 */
      this._table.getSelectionModel().resetSelection();

      /* 数据模型 */
      var model = this._dataModel;
      model.loadData(this.getResourceID());
    },


    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onMaterialChange : function(e) {
      this._calcuteReferenceCount(e.getData());
    },

    // 菜单处理

    /**
     * TODOC
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
      contextMenu.add(this._addEntry);
      contextMenu.add(this._deleteEntry);
      contextMenu.add(this._cutEntry);
      contextMenu.add(this._copyEntry);
      contextMenu.add(this._pasteEntry);
      contextMenu.add(this._partEditEntry);
      return true;
    },

    // 全选命令

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _selectionAllCommandExecute : function(e)
    {
      if (0 == this._dataModel.getRowCount()) {
        return;
      }

      // 全选
      this._table.getSelectionModel().setSelectionInterval(0, this._dataModel.getRowCount() - 1);
    },


    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onFilterByName : function(e)
    {
      var model = this._dataModel;
      var target = e.getTarget();
      model.resetHiddenRows();
      if (target.getValue()) {
        dialog.Dialog.prompt("请输入搜索关键词", function(result)
        {
          if (!result) {
            return;
          }
          model.addNotRegex(result, "name");
          model.applyFilters();
        }, this, "");
      }
    },

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onPartEditEndTime : function(e)
    {
      if (this._table.isEditing()) {
        this._table.stopEditing();
      }
      var model = this._dataModel;
      var selectionModel = this._table.getSelectionModel();
      var selections = selectionModel.getSelectedRanges();
      if (!selections || !selections.length)
      {
        dialog.Dialog.error("请首先选中需要批量修改的素材!");
        return;
      }
      var rowDatas = {

      };
      for (var i = 0, l = selections.length; i < l; i++)
      {
        var section = selections[i];
        for (var j = section.minIndex; j <= section.maxIndex; j++)
        {
          var rowData = model.getRowDataAsMap(j);
          rowDatas[j] = rowData;
        }
      }
      var partEditWindow = tvproui.Application.desktop.loadWindow(tvproui.material.PartEditWindow, "失效期");
      partEditWindow.addListenerOnce("PartEdited", function(e)
      {
        var endTime = e.getData();
        var value = tvproui.utils.Time.formatDate(endTime);
        for (var row in rowDatas)
        {
          if (parseInt(row) != row) {
            continue;
          }
          var rowData = rowDatas[row];
          row = parseInt(row);
          model.updateItem(row, 4, value, rowData.endTime);
        }

        // 提交更新
        model.commitUpdate();

        // 提交事务
        model.commitTrans();

        // 关闭窗口
        partEditWindow.close();
      }, this);
    }
  },

  // 界面之外的内容释放
  destruct : function()
  {
    if (this._table.isEditing()) {
      this._table.stopEditing();
    }

    // 释放非显示层级对象
    this._dataModel.dispose();
    this._selectionAllCommand.dispose();

    // 去除多余的引用
    this._popUp = null;
    this._table = null;
    this._dataModel = null;
    this._deleteButton = null;
    this._undoButton = null;
    this._redoButton = null;
    this._selectionManager = null;
    this._addEntry = null;
    this._deleteEntry = null;
    this._cutEntry = null;
    this._copyEntry = null;
    this._pasteEntry = null;
    this._partEditEntry = null;
    this._selectionAllCommand = null;
  }
});
