
/**
 * @author Administrator
 */

/* ************************************************************************
#asset(qx/icon/${qx.icontheme}/22/actions/*)
#asset(qx/icon/${qx.icontheme}/22/categories/*)
#asset(tvproui/type/*)
************************************************************************ */
qx.Class.define("tvproui.materialPackage.MaterialPackageTable",
{
  extend : tvproui.control.ui.window.Window,
  statics :
  {
    applicationName : "素材包",
    applicationIcon : "tvproui/type/package.png",
    canMultipleSupport : true,
    lastSource : null
  },
  properties :
  {
    packageName :
    {
      nullable : false,
      check : "String"
    },
    parentMaterialID : {
      check : "Integer"
    },
    broadcastDate : {
      check : "String"
    },

    /* 资源ID */
    resourceID :
    {
      nullable : false,
      check : "Integer"
    },
    sumDuration :
    {
      nullable : false,
      event : "changeSumDuration"
    }
  },
  construct : function(data)
  {
    this.base(arguments);

    // 关闭模态窗口
    this.setModal(false);

    // 配置资源ID为当前素材集的
    this.setPackageName(data.packageName);
    this.setResourceID(data.resourceID);
    this.setParentMaterialID(data.parentMaterialID);
    this.setBroadcastDate(data.broadcastDate);

    /* 网格化布局，第一行是表格，第二行是工具栏 */
    var gridLayout = new qx.ui.layout.Grid(10, 0);
    this.setLayout(gridLayout);

    /* 水平方向随着窗口缩放 */
    gridLayout.setColumnFlex(0, 1);

    /* 垂直方向，中间的表格随着窗口缩放 */
    gridLayout.setRowFlex(1, 1);

    // 增加一行
    var rowContainer = new qx.ui.container.Composite();
    rowContainer.setPaddingBottom(5);
    var rowLayout = new qx.ui.layout.Grid(10, 10);
    rowLayout.setColumnAlign(0, "left", "middle");
    rowLayout.setColumnAlign(2, "left", "middle");
    rowLayout.setColumnAlign(3, "left", "middle");
    rowLayout.setColumnAlign(4, "left", "middle");
    rowLayout.setColumnAlign(5, "left", "middle");
    rowContainer.setLayout(rowLayout);

    // 播出日期
    rowContainer.add(new qx.ui.basic.Label("播出日期:"),
    {
      row : 0,
      column : 0
    });
    this._broadcastDate = new qx.ui.form.DateField();
    this._broadcastDate.setValue(tvproui.utils.Time.parseDate(data.broadcastDate));
    rowContainer.add(this._broadcastDate,
    {
      row : 0,
      column : 1
    });

    // 素材包时长
    rowContainer.add(new qx.ui.basic.Label("时长:"),
    {
      row : 0,
      column : 2
    });
    this._timeLength = new qx.ui.basic.Label("00:00:00");
    rowContainer.add(this._timeLength,
    {
      row : 0,
      column : 3
    });

    // 素材包时长
    rowContainer.add(new qx.ui.basic.Label("硬广告:"),
    {
      row : 0,
      column : 4
    });
    this._ADtimeLength = new qx.ui.basic.Label("00:00:00");
    rowContainer.add(this._ADtimeLength,
    {
      row : 0,
      column : 5
    });
    this.add(rowContainer,
    {
      row : 0,
      column : 0
    });

    /* 频道数据模型初始化 */
    this._dataModel = new tvproui.materialPackage.MaterialPackageModel();

    /* 建立表格 */
    this._table = new qx.ui.table.Table(this._dataModel);
    this._table.setRowHeight(24);
    this._table.addListener("dataEdited", this._onDataEdited, this);
    this._table.setHeight(240);
    this._table.tagIDColumn = 1;

    /* 配置多选模式 */
    this._selectionManager = this._table.getSelectionModel();
    this._selectionManager.setSelectionMode(qx.ui.table.selection.Model.MULTIPLE_INTERVAL_SELECTION);

    /* 处理选中事件 */
    this._selectionManager.addListener("changeSelection", this._onSelectionChanged, this);

    /* 配置拖拽，鼠标聚焦 */
    this._table.setFocusCellOnMouseMove(true);

    /* 调整各列的渲染/编辑模式 */
    this._initTableColumnRender(this._table.getTableColumnModel());

    /* 将表格加入显示列表第二行位置 */
    this.add(this._table,
    {
      row : 1,
      column : 0
    });

    /* 初始化工具栏 */
    var toolbar = this._initToolBar();
    this.add(toolbar,
    {
      row : 2,
      column : 0
    });

    // 初始化标签
    this._initTagSystem();

    /* 加载数据 */
    this.loadData();

    //初始化拖放
    this._initDrag();
    this._initDrop();

    // 增加功能选单
    this._initContextMenu();
    this._table.setContextMenuHandler(2, this._contextMenuHandler, this);
    this._table.setContextMenuHandler(3, this._contextMenuHandler, this);
    this._table.setContextMenuHandler(4, this._contextMenuHandler, this);
    this._table.setContextMenuHandler(10, this._contextMenuHandler, this);

    // 注册播出日期变更处理事件
    this._broadcastDate.addListener("changeValue", this._onBroadcastDateChanged, this);
  },
  members :
  {
    _indicator : null,
    _popUp : null,
    _table : null,
    _dataModel : null,
    _deleteButton : null,
    _selectionManager : null,
    _timeLength : null,
    _ADtimeLength : null,
    _broadcastDate : null,
    _editPart : null,
    _addEntry : null,
    _deleteEntry : null,
    _cutEntry : null,
    _copyEntry : null,
    _pasteEntry : null,
    _selectionAllCommand : null,

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

      /* 默认关闭materialID显示 */
      columnModel.setColumnVisible(1, false);
      columnModel.setColumnWidth(1, 50);

      /* 默认打开名称显示 */
      columnModel.setColumnVisible(2, true);
      columnModel.setColumnWidth(2, 170);

      /* 默认类型显示 */
      columnModel.setColumnVisible(3, true);
      columnModel.setColumnWidth(3, 40);

      /* 默认时长显示 */
      columnModel.setColumnVisible(4, true);
      columnModel.setColumnWidth(4, 73);

      /* 默认关闭生效显示  */
      columnModel.setColumnVisible(5, false);
      columnModel.setColumnWidth(5, 100);

      /* 默认关闭失效显示  */
      columnModel.setColumnVisible(6, false);
      columnModel.setColumnWidth(6, 100);

      /* 默认编号显示  */
      columnModel.setColumnVisible(7, false);
      columnModel.setColumnWidth(7, 73);

      /* 默认上传用户名显示  */
      columnModel.setColumnVisible(8, false);
      columnModel.setColumnWidth(8, 73);

      /* 默认打包用户名显示  */
      columnModel.setColumnVisible(9, false);
      columnModel.setColumnWidth(9, 73);

      /* 默认标签显示  */
      columnModel.setColumnVisible(10, true);
      columnModel.setColumnWidth(10, 170);

      /* 使得类型可以选择编辑 */
      columnModel.setCellEditorFactory(3, tvproui.material.MaterialTable.getMaterialTypeSelector());

      /* 第二列使用图像渲染器 */
      columnModel.setDataCellRenderer(3, new tvproui.material.MaterialImage(22, 22));

      /* 第三四列都用时间渲染器 */
      columnModel.setDataCellRenderer(4, new tvproui.control.ui.table.cellrenderer.TimeCellRender());
      columnModel.setCellEditorFactory(4, new tvproui.control.ui.table.celleditor.TimeCellEditor());
      columnModel.setCellEditorFactory(5, new tvproui.control.ui.table.celleditor.DateField());
      columnModel.setCellEditorFactory(6, new tvproui.control.ui.table.celleditor.DateField());

      /* 标签列使用标签渲染器和标签编辑器 */
      columnModel.setDataCellRenderer(10, new tvproui.control.ui.table.cellrenderer.TagRender(22, 22));
      columnModel.setCellEditorFactory(10, new tvproui.control.ui.table.celleditor.TagEditor());
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

      /* 监听事件决定是否启用删除按钮 */
      this._table.getSelectionModel().addListener("changeSelection", this._onChangeSelection, this);
      this._editPart = editPart;

      /* 工具栏的操作分段 */
      var actionPart = new qx.ui.toolbar.Part();
      toolbar.add(actionPart);

      /* 加入刷新按钮到编辑分段中 */
      var refreshButton = new qx.ui.toolbar.Button("刷新", "icon/22/actions/view-refresh.png");
      refreshButton.addListener("execute", this.loadData, this);
      actionPart.add(refreshButton);

      /* 默认关闭删除，保存, 撤销, 重做按钮功能 */
      this._deleteButton.setEnabled(false);

      // 全选命令
      var selectionAllCommand = new qx.ui.core.Command("Ctrl+A");
      this._selectionAllCommand = selectionAllCommand;
      selectionAllCommand.addListener("execute", this._selectionAllCommandExecute, this);
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
    },


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

      // 指定tagID列
      this._table.tableIDColumn = 1;
      var scroller = this._table.getPaneScroller(0);
      this._indicator = scroller.getChildControl("focus-indicator");
      this._indicator.addListener("mousemove", function(e)
      {
        if (10 != this._table.getFocusedColumn())
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

    /* 初始化拖出 */

    /**
     * TODOC
     *
     */
    _initDrag : function()
    {
      var table = this._table;
      table.setDraggable(true);

      //描述拖出数据范围，描述操作为复制
      table.addListener("dragstart", function(e)
      {

        /* 停止编辑行为 */
        if (table.isEditing()) {
          table.stopEditing();
        }
        e.addType("materialPackage");
        e.addAction("move");
        e.addAction("copy");
      }, this);

      //拖动请求，准备数据格式
      table.addListener("droprequest", function(e)
      {
        var type = e.getCurrentType();
        if (type != "materialPackage")
        {
          dialog.Dialog.alert("数据类型不支持!");
          return;
        }
        var model = this._dataModel;

        /* 决定复制项目 */
        var selectionModel = this._table.getSelectionModel();
        var selections = selectionModel.getSelectedRanges();
        var rowDataArray = [];
        for (var i = 0, l = selections.length; i < l; i++)
        {
          var section = selections[i];
          var minIndex = section.minIndex;
          var maxIndex = section.maxIndex;
          rowDataArray = rowDataArray.concat(model.getCopyData(minIndex, maxIndex));
        }
        tvproui.materialPackage.MaterialPackageTable.lastSource = table;
        e.addData("materialPackage", rowDataArray);
      }, this);
    },

    // 初始化拖入

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

        // 锁定状态不响应拖动
        var model = this._dataModel;
        if (model.getLocked()) {
          return;
        }

        /* 停止编辑行为 */
        if (table.isEditing()) {
          table.stopEditing();
        }

        // 支持material类型.
        var action = e.getCurrentAction();
        var type = e.supportsType("material");
        if (type)
        {
          var materials = e.getData("material");
          if (materials.length == 0) {
            return;
          }
          this._addMaterial(materials);
          return;
        }
        type = e.supportsType("materialPackage");
        if (type)
        {
          var materialPackages = e.getData("materialPackage");
          if (materialPackages.length == 0) {
            return;
          }
          if ((action == "move") && (tvproui.materialPackage.MaterialPackageTable.lastSource != table)) {
            action = "copy";
          }
          switch (action)
          {
            case "move":this._moveMaterial(materialPackages);
            break;
            case "copy":this._copyMaterial(materialPackages);
            break;
          }
          return;
        }
      }, this);
    },


    /**
     * TODOC
     *
     * @param materials {var} TODOC
     * @param insertPos {var} TODOC
     */
    _addMaterial : function(materials, insertPos)
    {

      /* 获取插入点位置 */
      var model = this._dataModel;
      if (!insertPos)
      {
        var focusRow = this._table.getFocusedRow();
        if ((focusRow == null) || (focusRow >= model.getRowCount())) {
          insertPos = model.getRowCount();
        } else {
          insertPos = focusRow + 1;
        }
      }
      var ID = null;

      // 循环将素材加入编播表
      for (var i = 0, l = materials.length; i < l; i++)
      {
        var material = materials[i];
        if (material.type == "素材包")
        {
          dialog.Dialog.alert("素材包 " + material.name + " 将被略过!");
          continue;
        }

        // 增加新的数据
        ID = model.addItem(
        {
          ID : tvproui.utils.IDManager.getLocalTempID(),
          materialID : material.ID,
          name : material.name,
          type : material.type,
          duration : material.duration,
          beginTime : material.beginTime,
          endTime : material.endTime,
          resourceID : material.resourceID,
          uploadAlias : material.alias,
          packageAlias : tvproui.user.LoginWindow.currentUserAlias
        }, insertPos++);
      }
      if ((insertPos > 0) && (ID != null))
      {
        var scroller = this._table.getPaneScroller(0);
        var insertPosAfterSort = model.getRowOfID(ID);
        var height = insertPosAfterSort * this._table.getRowHeight();
        scroller.setScrollY(height, true);
      }

      // 更新总时长
      this.setSumDuration(model.calcDuration(this._timeLength, this._ADtimeLength));
    },


    /**
     * TODOC
     *
     * @param materialPackages {var} TODOC
     */
    _moveMaterial : function(materialPackages)
    {

      /* 获取剪切板中栏目数据 */
      var model = this._dataModel;
      var focusRow = this._table.getFocusedRow();
      if ((null == focusRow) || (focusRow >= model.getRowCount())) {
        focusRow = model.getRowCount();
      } else {
        focusRow += 1;
      }
      for (var i = 0, l = materialPackages.length; i < l; i++)
      {
        var materialPackage = materialPackages[i];
        model.moveItem(materialPackage.ID, focusRow);
        focusRow = model.getRowOfID(materialPackage.ID) + 1;
      }

      // 更新总时长
      this.setSumDuration(model.calcDuration(this._timeLength, this._ADtimeLength));
    },


    /**
     * TODOC
     *
     * @param materialPackages {var} TODOC
     */
    _copyMaterial : function(materialPackages)
    {

      /* 获取剪切板中栏目数据 */
      var model = this._dataModel;
      var focusRow = this._table.getFocusedRow();
      if ((null == focusRow) || (focusRow >= model.getRowCount())) {
        focusRow = model.getRowCount();
      } else {
        focusRow += 1;
      }
      model.putCopyData(focusRow, materialPackages);
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
      tvproui.utils.Clipper.putInto("MaterialPackage", copyDataArray);

      /* 根据选择范围来删除 */
      this._dataModel.deleteItems(selections);

      // 更新总时长
      this.setSumDuration(model.calcDuration(this._timeLength, this._ADtimeLength));

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
      tvproui.utils.Clipper.putInto("MaterialPackage", copyDataArray);
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

      /* 决定复制项目 */
      var model = this._dataModel;
      var insertPos = model.getRowCount();
      var selectionModel = this._table.getSelectionModel();
      var selections = selectionModel.getSelectedRanges();
      for (var i = 0, l = selections.length; i < l; i++)
      {
        var section = selections[i];
        insertPos = section.maxIndex + 1;
      }

      /* 获取剪切板中栏目数据 */
      var copyDatas = tvproui.utils.Clipper.getLastProperItem("Material");
      if (null != copyDatas) {
        this._addMaterial(copyDatas, insertPos);
      }
      copyDatas = tvproui.utils.Clipper.getLastProperItem("MaterialPackage");
      if (null != copyDatas) {
        model.putCopyData(insertPos, copyDatas);
      }

      // 更新总时长
      this.setSumDuration(model.calcDuration(this._timeLength, this._ADtimeLength));
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
      var type = "广告";
      var duration = tvproui.utils.Time.fromOffset(60);
      if (insertPos > 0)
      {
        var lastProgram = model.getRowDataAsMap(insertPos - 1);
        type = lastProgram.type;
        duration = lastProgram.duration.clone();
      }
      var ID = tvproui.utils.IDManager.getLocalTempID();

      /* 增加新的素材 */
      var materialID = tvproui.material.command.AddCommand.executeServer(
      {
        ID : ID,
        name : "新素材",
        type : type,
        duration : duration,
        beginTime : model.getBroadcastDate(),
        endTime : model.getBroadcastDate(),
        resourceID : resourceID,
        artId : "",
        alias : tvproui.user.LoginWindow.currentUserAlias
      }, insertPos);

      /* 增加新的数据  */
      ID = tvproui.utils.IDManager.getLocalTempID();
      ID = model.addItem(
      {
        ID : ID,
        materialID : materialID,
        name : "新素材",
        type : type,
        duration : duration,
        beginTime : model.getBroadcastDate(),
        endTime : model.getBroadcastDate(),
        resourceID : resourceID,
        uploadAlias : tvproui.user.LoginWindow.currentUserAlias,
        packageAlias : tvproui.user.LoginWindow.currentUserAlias
      }, insertPos);
      var insertPosAfterSort = model.getRowOfID(ID);

      /* 更改选区 ,并滚动到新增行 */
      selectionModel.setSelectionInterval(insertPosAfterSort, insertPosAfterSort);
      if (insertPos > 0)
      {
        var scroller = this._table.getPaneScroller(0);
        var height = insertPosAfterSort * this._table.getRowHeight();
        scroller.setScrollY(height, true);
      }

      // 更新总时长
      this.setSumDuration(model.calcDuration(this._timeLength, this._ADtimeLength));
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
      model.updateItem(data.row, data.col, data.value, data.oldValue);

      // 更新总时长
      this.setSumDuration(model.calcDuration(this._timeLength, this._ADtimeLength));
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
      this._dataModel.deleteItems(selections);

      // 更新总时长
      var model = this._dataModel;
      this.setSumDuration(model.calcDuration(this._timeLength, this._ADtimeLength));

      /* 清除选区 */
      selectionModel.resetSelection();
    },


    /**
     * TODOC
     *
     */
    loadData : function()
    {

      /* 默认关闭删除，保存按钮功能 */
      this._deleteButton.setEnabled(false);

      /* 清除选区 */
      this._table.getSelectionModel().resetSelection();

      /* 数据模型 */
      var model = this._dataModel;
      model.loadData(false, this.getParentMaterialID(), this.getBroadcastDate());

      // 更新总时长
      this.setSumDuration(model.calcDuration(this._timeLength, this._ADtimeLength));

      // 显示锁定状态
      var lock = model.getLocked();
      var alias = model.getEditingAlias();
      if (lock)
      {
        this._editPart.setVisibility("hidden");
        this.setCaption("素材包查看  - " + this.getPackageName() + "(" + alias + " 正在编辑)");
      } else
      {
        this._editPart.setVisibility("visible");
        this.setCaption("素材包编辑  - " + this.getPackageName());
      }
    },


    /**
     * TODOC
     *
     */
    _onBroadcastDateChanged : function()
    {
      this.setBroadcastDate(tvproui.utils.Time.formatDate(this._broadcastDate.getValue()));
      this.loadData();
    },

    /* 处理选中事件 */

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
    refresh : function() {
      this.loadData();
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
      return true;
    },


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
    this._indicator = null;
    this._popUp = null;
    this._table = null;
    this._dataModel = null;
    this._deleteButton = null;
    this._selectionManager = null;
    this._pathToID = null;
    this._timeLength = null;
    this._ADtimeLength = null;
    this._broadcastDate = null;
    this._editPart = null;
    this._addEntry = null;
    this._deleteEntry = null;
    this._cutEntry = null;
    this._copyEntry = null;
    this._pasteEntry = null;
    this._selectionAllCommand = null;
  }
});
