
/**
 * @author Administrator
 */

/* ************************************************************************
#asset(qx/icon/${qx.icontheme}/22/actions/*)
#asset(qx/icon/${qx.icontheme}/22/devices/*)
#asset(qx/icon/${qx.icontheme}/22/categories/*)
#asset(tvproui/type/*)
#asset(tvproui/epg/*)
#asset(tvproui/selection/*)
************************************************************************ */
qx.Class.define("tvproui.statistic.EPG.EPGEditTable",
{
  extend : tvproui.EPG.viewTable.EPGViewTable,
  statics : {


    /**
     * TODOC
     *
     * @param typeName {var} TODOC
     * @return {var} TODOC
     */
    getVectorSelector : function(vector)
    {
      var typeCellEditor = new tvproui.control.ui.spanTable.celleditor.SelectBox();
      typeCellEditor.setListData(vector.options);
      return typeCellEditor;
    }
  },

  construct : function(model, parentWindow)
  {
    this.base(arguments, model);
    var table = this._table;
    this._parentWindow = parentWindow;
    table.addListener("dataEdited", this._onDataEdited, this);
  },
  members :
  {

    // 父窗口
    _parentWindow : null,
    _selectionEntry : null,
    _lastColumnRow : null,
    _historyBox : null,
    _selectionList : null,

    /* 初始化工具栏 */

    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    _initToolBar : function()
    {
      var result = this.base(arguments);

      // 流程分段
      var toolbar = this._toolbar;

      /* 工具栏的编辑分段 */
      var editPart = new qx.ui.toolbar.Part();
      this._editPart = editPart;
      toolbar.addAt(editPart, 0);

      /* 监听事件决定是否启用删除按钮 */
      var undoList = this._dataModel.getUndoList();
      this._historyBox = new qx.ui.form.VirtualSelectBox(undoList).set( {
        labelPath : "description"
      });
      this._historyBox.bind("selection[0].description", this._historyBox, "toolTipText", null);

      var delegate = {
        bindItem : function(controller, item, id)
        {
          controller.bindDefaultProperties(item, id);
          controller.bindProperty("description", "toolTipText", null, item, id);
        }
      };

      this._historyBox.setDelegate(delegate);
      editPart.add(this._historyBox);
      this._historyBox.setWidth(500);
      undoList.addListener("change", this._onUndoAdd, this);
      
      this._selectionList = new qx.data.Array();
      this._historyBox.setSelection(this._selectionList);

      //加入撤销按钮到编辑分段中
      var undoCommand = new qx.ui.core.Command("Ctrl+Z");
      this._undoButton = new qx.ui.toolbar.Button("撤销", "icon/22/actions/edit-undo.png", undoCommand);
      this._undoButton.addListener("execute", this._onUndoButton, this);
      editPart.add(this._undoButton);

      /* 加入保存按钮到编辑分段中 */
      var saveButton = new qx.ui.toolbar.Button("保存", "icon/22/actions/document-save.png");
      saveButton.addListener("execute", this._onSaveButton, this);
      editPart.add(saveButton);

      // 监听事件决定是否启用撤销按钮
      this._dataModel.addListener("canUndo", this._onUndoListLengthChange, this);
      return result;
    },

    /* 初始化 列渲染器 */

    /**
     * TODOC
     *
     * @param columnModel {var} TODOC
     */
    _initTableColumnRender : function(columnModel, dynamicColumns)
    {
      if(!dynamicColumns)
      {
        return;
      }

      var defaultStyle =
      {
        "background-color" : "#cccccc",
        "color" : "#000000"
      };

      /* 默认打开序号显示 */
      columnModel.setColumnVisible(0, true);
      columnModel.setColumnWidth(0, 38);
      columnModel.setOverWriteStyle(0, defaultStyle);

      /* 默认打开栏目名称显示 */
      columnModel.setColumnVisible(1, true);
      columnModel.setColumnWidth(1, 115);
      columnModel.setOverWriteStyle(1, defaultStyle);

      /* 默认时段名称显示 */
      columnModel.setColumnVisible(2, true);
      columnModel.setColumnWidth(2, 93);
      columnModel.setOverWriteStyle(2, defaultStyle);

      /* 默认时段时长时间显示 */
      columnModel.setColumnVisible(3, false);
      columnModel.setColumnWidth(3, 77);
      columnModel.setOverWriteStyle(3, defaultStyle);

      /* 默认定时显示 */
      columnModel.setColumnVisible(4, false);
      columnModel.setColumnWidth(4, 38);
      columnModel.setOverWriteStyle(4, defaultStyle);

      /* 默认播出时间显示 */
      columnModel.setColumnVisible(5, true);
      columnModel.setColumnWidth(5, 93);
      columnModel.setOverWriteStyle(5, defaultStyle);

      /* 默认节目名称显示 */
      columnModel.setColumnVisible(6, true);
      columnModel.setColumnWidth(6, 365);

      /* 默认节目时长显示  */
      columnModel.setColumnVisible(7, false);
      columnModel.setColumnWidth(7, 77);

      /* 默认类型显示  */
      columnModel.setColumnVisible(8, true);
      columnModel.setColumnWidth(8, 38);

      /* 时段时长，播出时间，节目时长 */
      columnModel.setDataCellRenderer(3, new tvproui.EPG.viewTable.TimeCellRender());
      columnModel.setDataCellRenderer(5, new tvproui.EPG.viewTable.TimeCellRender());
      columnModel.setDataCellRenderer(7, new tvproui.EPG.viewTable.TimeCellRender());

      // 定时
      columnModel.setDataCellRenderer(4, new tvproui.control.ui.spanTable.cellrenderer.Boolean());

      /* 类型列使用图像渲染器，可以选择编辑 */
      columnModel.setDataCellRenderer(8, new tvproui.EPG.viewTable.MaterialImage(22, 22));

      this._predictVectors = dynamicColumns;

      for(var i = 0, l = dynamicColumns.length; i < l; i++)
      {
        var columnIndex = 9 + i;
        columnModel.setColumnVisible(columnIndex, true);
        columnModel.setColumnWidth(columnIndex, 100);
        columnModel.setOverWriteStyle(columnIndex, defaultStyle);
        columnModel.setCellEditorFactory(columnIndex, tvproui.statistic.EPG.EPGEditTable.getVectorSelector(dynamicColumns[i]));
      }

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
      var focusRow = table.getFocusedRow();
      var focusCol = table.getFocusedColumn();
      var dataModel = this._dataModel;
      if ((null == focusRow) || (focusRow >= dataModel.getRowCount() || focusCol <= 8))
      {
        table.cancelEditing();
        return;
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
      var model = this._dataModel;

      // 正常变更处理
      if (data.value == data.oldValue) {
        return;
      }
      model.updateItem(data.node, data.columnID, data.value, data.oldValue);
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

    /* 重做按钮处理 */

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
     * @return {var} TODOC
     */
    loadData : function()
    {
      var table = this._table;
      if (table.isEditing()) {
        table.stopEditing();
      }

      /* 清除选区 */
      table.getSelectionModel().resetSelection();

      /* 数据模型 */
      var model = this._dataModel;

      // 加载编播表
      var result = model.loadEPGData();
      if(!result)
      {
        return false;
      }

      /* 默认打开序号显示 */
      var columnModel = table.getTableColumnModel();

      // 模型配置附加字段
      var basicColumnCount = model.configVectors(result);

      // 重新配置列模型里面的附加字段
      columnModel.init(model.getColumnCount(), table);

      // 调整基本列的渲染/编辑模式
      this._initTableColumnRender(columnModel, result.predict);

      // 插入新的动态列
      return model.loadData(result);
    },

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onUndoAdd : function(e)
    {
      var model = this._dataModel;
      var undoList = model.getUndoList();
      var length = undoList.getLength();
      if (1 == length) {
        return;
      }
      this._selectionList.setItem(0, undoList.getItem(length - 1));
    },

    _onSaveButton: function(e)
    {
      var model = this._dataModel;
      // 保存至服务
      
      if(!model.needSaveVersion())
      {
        return;
      }

      var formData = {
        'description' :
        {
          'type' : "TextArea",
          'label' : "版本描述",
          'lines' : 4,
          'value' : "进行了修改"
        }
      };

      model.saveNetwork();
      dialog.Dialog.alert("存盘成功!");
    }
  },

  // 界面之外的内容释放
  destruct : function()
  {
    this._historyBox = null;
    this._selectionList = null;
  }
});
