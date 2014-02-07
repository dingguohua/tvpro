
/**
 * @author Weibo Zhang
 */

/* ************************************************************************
#asset(qx/icon/${qx.icontheme}/22/categories/*)
#asset(qx/icon/${qx.icontheme}/22/apps/*)
#asset(qx/icon/${qx.icontheme}/22/status/*)
************************************************************************ */
qx.Class.define("tvproui.statistic.DimensionalityManagement",
{
  extend : tvproui.control.ui.window.Window,
  statics :
  {
    applicationName : "统计维度管理",
    applicationIcon : "icon/22/actions/view-sort-descending.png",
    canMultipleSupport : false
  },

  construct : function()
  {
    this.base(arguments);
    var layout = new qx.ui.layout.Grid();
    layout.setSpacingX(20);
    this.setLayout(layout);

    layout.setRowFlex(0, 1);
    layout.setColumnFlex(0, 0.5);
    layout.setColumnFlex(1, 0.5);

    var table = this._initDimensionalityTable();
    this.add(table, {row: 0, column:0});

    var optionList = this._initOptionTable();
    this.add(optionList, {row: 0, column:1});
    this.add(this._initToolBarDimension(), {row:1, column:0});
    this.add(this._initToolBarOption(), {row:1, column:1});

    this.setHeight(300);
  },
  members :
  {
    _dimensionTable: null,
    _optionTable: null,

    /* 初始化用户名单 */

    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    _initDimensionalityTable : function()
    {
      var container = new qx.ui.container.Composite(new qx.ui.layout.VBox());
      var title = new qx.ui.basic.Label("维度").set( {
        font : "bold"
      });
      container.add(title);

      /* 频道数据模型初始化 */
      var model = new qx.ui.table.model.Simple();
      
      model.setColumns(["id","维度名称", "默认值"], ["id","vectorname", "defvalue"]);
      model.setColumnEditable(0, false);
      model.setColumnEditable(1, true);
      model.setColumnEditable(2, false);

      // 加载数据
      var rows = tvproui.AjaxPort.call("statistic/loadPredictVector", {
      });
      if (null == rows || rows.length == 0)
      {
        model.setDataAsMapArray([]);
      }
      else
      {
        for (var i = 0, l = rows.length; i < l; i++)
        {
          var row = rows[i];
          row.id = parseInt(row.id);
          // row.vectorname = row.vectorname;
          // row.defvalue = row.defvalue;
        }
        model.setDataAsMapArray(rows);
      }

      /* 建立表格 */
      var table = new qx.ui.table.Table(model);
      var columnModel = table.getTableColumnModel();
      columnModel.setColumnVisible(0, false);
      columnModel.setColumnWidth(0, 250);
      columnModel.setColumnWidth(1, 200);
      container.add(table, {flex: 1});

      // 处理编辑事件
      table.addListener("dataEdited", this._onDataEdited, this);

      /* 处理选中事件 */
      table.getSelectionModel().addListener("changeSelection", this._onSelectionChanged, this);

      this._dimensionTable = table;

      return container;
    },

    /* 用户选中了某一个选项，刷新可选值 */

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onSelectionChanged : function(e)
    {
      var table = this._dimensionTable;
      var dataModel = table.getTableModel();
      var selections = table.getSelectionModel().getSelectedRanges();
      var optionTable = this._optionTable;
      var optionModel = optionTable.getTableModel();
      optionTable.cancelEditing();

      if(!selections || selections.length == 0)
      {
        optionModel.setDataAsMapArray([]);
        return;
      }

      var row = selections[0].minIndex;
      var rowData = dataModel.getRowDataAsMap(row);

      var labels = tvproui.AjaxPort.call("statistic/loadPredictLabel", {id: rowData.id});
      if(!labels || labels.length == 0)
      {
        optionModel.setDataAsMapArray([]);
        return;
      }

      for (var i = 0, l = labels.length; i < l; i++)
      {
        var label = labels[i];
        label.id = parseInt(label.id);
        // label.optional = label.optional;
      }

      optionModel.setDataAsMapArray(labels);
    },

    /*
     * 初始化可选值
     *
     * @param label {var} TODOC
     * @param treeName {var} TODOC
     * @param converter {var} TODOC
     * @return {var} TODOC
     */
    _initOptionTable : function()
    {      
      var container = new qx.ui.container.Composite(new qx.ui.layout.VBox());
      var title = new qx.ui.basic.Label("选项").set( {
        font : "bold"
      });
      container.add(title);

      /* 频道数据模型初始化 */
      var model = new qx.ui.table.model.Simple();
      
      model.setColumns(["id","选项"], ["id","optional"]);
      model.setColumnEditable(0, false);
      model.setColumnEditable(1, true);
      model.setDataAsMapArray([]);

      /* 建立表格 */
      var table = new qx.ui.table.Table(model);
      var columnModel = table.getTableColumnModel();
      columnModel.setColumnVisible(0, false);
      columnModel.setColumnWidth(0, 250);
      columnModel.setColumnWidth(1, 200);
      container.add(table, {flex: 1});

      this._optionTable = table;

      // 处理编辑事件
      table.addListener("dataEdited", this._onOptionDataEdited, this);

      return container;
    },

    /* 初始化工具栏 */

    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    _initToolBarDimension : function()
    {
      var toolbar = new qx.ui.toolbar.ToolBar();

      /* 工具栏的编辑分段 */
      var dimensionPart = new qx.ui.toolbar.Part();
      toolbar.add(dimensionPart);

      /* 添加 */
      var addButton = new qx.ui.toolbar.Button("添加", "icon/22/actions/list-add.png");
      dimensionPart.add(addButton);
      addButton.addListener("execute", this._addNewDimension, this);


      /* 删除 */
      var deleteButton = new qx.ui.toolbar.Button("删除", "icon/22/actions/list-remove.png");
      deleteButton.addListener("execute", this._removeDimension, this);
      dimensionPart.add(deleteButton);

      return toolbar;
    },

    /* 初始化工具栏 */

    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    _initToolBarOption : function()
    {
      var toolbar = new qx.ui.toolbar.ToolBar();

      /* 工具栏的操作分段 */
      var optionPart = new qx.ui.toolbar.Part();
      toolbar.add(optionPart);

      var addButton = new qx.ui.toolbar.Button("添加", "icon/22/actions/list-add.png");
      optionPart.add(addButton);
      addButton.addListener("execute", this._addOption, this);


      /* 删除 */
      var deleteButton = new qx.ui.toolbar.Button("删除", "icon/22/actions/list-remove.png");
      deleteButton.addListener("execute", this._deleteOption, this);
      optionPart.add(deleteButton);

      // 默认
      var defaultButton = new qx.ui.toolbar.Button("设为默认值", "icon/22/actions/dialog-apply.png");
      optionPart.add(defaultButton);
      defaultButton.addListener("execute", this._setDefault, this);

      return toolbar;
    },

    /**
     * 添加新维度
     *
     * @param e {Event} TODOC
     */
    _addNewDimension : function(e)
    {
      var table = this._dimensionTable;
      var dataModel = table.getTableModel();

      // 远程添加维度
      var rowData = {vectorname: "新维度", defvalue: "未知"};
      var result = parseInt(tvproui.AjaxPort.call("statistic/addPredictVector", rowData));
      if(!result)
      {
        return;
      }

      rowData.id = result;

      // 本地添加维度
      var position = dataModel.getRowCount();
      dataModel.addRowsAsMapArray([rowData], position);
    },

    _addOption: function(e)
    {
      // 定位维度
      var table = this._dimensionTable;
      var dataModel = table.getTableModel();
      var selections = table.getSelectionModel().getSelectedRanges();
      var optionTable = this._optionTable;
      var optionModel = optionTable.getTableModel();

      if (optionTable.isEditing()) {
        optionTable.stopEditing();
      }
      
      if(!selections || selections.length == 0)
      {
        return;
      }

      var row = selections[0].minIndex;
      var vectorRowData = dataModel.getRowDataAsMap(row);

      // 远程添加维度
      var rowData = {vectorid: vectorRowData.id, optional: "新选项值"};
      var result = parseInt(tvproui.AjaxPort.call("statistic/addVectorOptional", rowData));
      if(!result)
      {
        return;
      }

      rowData.id = result;

      // 本地添加维度
      var position = optionModel.getRowCount();
      optionModel.addRowsAsMapArray([rowData], position);
    },

    _deleteOption: function(e)
    {
      var optionTable = this._optionTable;
      var optionModel = optionTable.getTableModel();
      var selections = optionTable.getSelectionModel().getSelectedRanges();

      if(!selections || selections.length == 0)
      {
        return;
      }

      var row = selections[0].minIndex;
      var rowData = optionModel.getRowDataAsMap(row);

      // 远程删除
      var labels = tvproui.AjaxPort.call("statistic/removeVectorOptional", {id: rowData.id});

      // 删除客户端维度
      optionModel.removeRows(row, 1);
    },


    _setDefault: function(e)
    {
      // 定位选项
      var optionTable = this._optionTable;
      var optionModel = optionTable.getTableModel();
      var selections = optionTable.getSelectionModel().getSelectedRanges();

      if(!selections || selections.length == 0)
      {
        return;
      }

      var row = selections[0].minIndex;
      var optionRowData = optionModel.getRowDataAsMap(row);

      // 定位维度
      var table = this._dimensionTable;
      var dataModel = table.getTableModel();
      selections = table.getSelectionModel().getSelectedRanges();
      if(!selections || selections.length == 0)
      {
        return;
      }

      row = selections[0].minIndex;
      var rowData = dataModel.getRowDataAsMap(row);

      // 若未发生变化
      if(optionRowData.optional == rowData.defValue)
      {
        return;
      }

      // 修改服务器默认值
      var result = tvproui.AjaxPort.call("statistic/modifyVector", {id: rowData.id, key: "defValue", value: optionRowData.optional});
      if(!result)
      {
        return;
      }

      // 修改本地
      dataModel.setValue(2, row, optionRowData.optional);
    },

    /**
     * 删除维度
     *
     * @param e {Event} TODOC
     */
    _removeDimension : function(e)
    {
      var table = this._dimensionTable;
      var dataModel = table.getTableModel();
      var selections = table.getSelectionModel().getSelectedRanges();

      if(!selections || selections.length == 0)
      {
        return;
      }

      var row = selections[0].minIndex;
      var rowData = dataModel.getRowDataAsMap(row);

      // 远程删除
      var labels = tvproui.AjaxPort.call("statistic/removePredictVector", {id: rowData.id});

      // 删除客户端可选项
      var optionTable = this._optionTable;
      var optionModel = optionTable.getTableModel();
      optionModel.setDataAsMapArray([]);

      // 删除客户端维度
      dataModel.removeRows(row, 1);
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

      // 取得数据ID
      var table = this._dimensionTable;
      var dataModel = table.getTableModel();
      var rowData = dataModel.getRowDataAsMap(data.row);
      var columnID = dataModel.getColumnId(data.col);

      // 修改服务器
      var result = tvproui.AjaxPort.call("statistic/modifyVector", {id: rowData.id, key: columnID, value: data.value});
      if(!result)
      {
        return;
      }

      // 修改本地
      dataModel.setValue(data.col, data.row, data.value);
    },

    /* 编辑数据 */

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onOptionDataEdited : function(e)
    {
      var data = e.getData();
      if (data.value == data.oldValue) {
        return;
      }

      // 取得数据ID
      var optionTable = this._optionTable;
      var dataModel = optionTable.getTableModel();
      var rowData = dataModel.getRowDataAsMap(data.row);
      var columnID = dataModel.getColumnId(data.col);

      // 修改服务器
      var result = tvproui.AjaxPort.call("statistic/modifyVectorOptional", {id: rowData.id, optional: data.value});
      if(!result)
      {
        return;
      }

      // 修改本地
      dataModel.setValue(data.col, data.row, data.value);
    }
  },

  // 界面之外的内容释放
  destruct : function()
  {
    // 释放非显示层级对象
    this._dimensionTable = null;
    this._optionTable = null;
  }
});
