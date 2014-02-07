
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2006 Christian Boulanger

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Christian Boulanger (cboulanger)

************************************************************************ */

/**
 * A cell editor factory creating combo boxes.
 */
qx.Class.define("tvproui.EPG.editTable.MaterialSelector",
{
  extend : qx.core.Object,
  implement : qx.ui.table.ICellEditorFactory,
  statics :
  {
    materialCache : {

    },
    lastMaterial : {

    },
    lastTable : null,


    /**
     * TODOC
     *
     * @param URL {var} TODOC
     * @param materialData {var} TODOC
     * @return {var | void} TODOC
     */
    getProperMaterial : function(URL, materialData)
    {
      var now = new Date().getTime();
      var cache = tvproui.EPG.editTable.MaterialSelector.materialCache;
      var cacheID = URL + "_" + materialData.ID + "_" + materialData.name;
      var cacheItem = cache[cacheID];
      if (cacheItem) {
        if ((now - cacheItem.fetchTime) < 30000) {
          return cacheItem.data;
        }
      } else {
        cacheItem = {
          fetchTime : now
        };
        cache[cacheID] = cacheItem;
      }
      var types = tvproui.system.fileManager.getMaterialStyle();
      var rows = tvproui.AjaxPort.call(URL, materialData);
      if (!rows || !rows.length) {
        delete cache[cacheID];
        return;
      }
      for (var i = 0, l = rows.length; i < l; i++)
      {
        var row = rows[i];
        row.id = parseInt(row.id);
        var style = types[row.type];
        if (!style)
        {
          style = types["设备检修"];
          dialog.Dialog.error("无法识别的类型" + row.type);
        }

        //row.name = row.name;
        row.duration = tvproui.utils.Time.fromOffset(parseInt(row.duration));

        //row.content = row.content;
        //row.remark = row.remark;
        row.style = style;
        row.resourceID = parseInt(row.materialSetId);
      }
      cacheItem.data = rows;
      return rows;
    },


    /**
     * TODOC
     *
     */
    clearCache : function() {
      tvproui.EPG.editTable.MaterialSelector.materialCache = {

      };
    }
  },
  members :
  {
    _cellEditor : null,
    _lastRows : null,
    _timer : null,
    _orginalID : null,

    // interface implementation

    /**
     * TODOC
     *
     * @param cellInfo {var} TODOC
     * @return {var} TODOC
     */
    createCellEditor : function(cellInfo)
    {
      var cellEditor = new tvproui.control.ui.form.ComboBox(this._onListSelected).set( {
        appearance : "table-editor-combobox"
      });
      tvproui.EPG.editTable.MaterialSelector.lastTable = cellInfo.table;

      // 获取素材记录
      var model = cellInfo.table.getTableModel();
      var node = model.getNodeByRowColumn(cellInfo.col, cellInfo.row);
      var value = cellInfo.value;
      this._orginalID = node.columnData.IDMaterial;
      this.setUserData("columnData", node.columnData);
      cellEditor.originalValue = value;

      // check if renderer does something with value
      cellEditor.setValue(value);
      cellEditor.addListener("keyup", this._onInputValue, this);
      this._refreshTable(cellEditor, value);
      cellEditor.addListenerOnce("appear", function() {
        cellEditor.open();
      });
      return cellEditor;
    },


    /**
     * TODOC
     *
     * @param item {var} TODOC
     */
    _onListSelected : function(item)
    {
      var rowData = item.getModel();
      this.setValue(rowData.name);
      this.setUserData("rowData", rowData);
      tvproui.EPG.editTable.MaterialSelector.lastTable.stopEditing();
    },


    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onInputValue : function(e)
    {
      switch (e.getKeyCode())
      {
        case 13://Enter
        tvproui.EPG.editTable.MaterialSelector.lastTable.stopEditing();
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
        this._timer = null;
      }

      var cellEditor = e.getCurrentTarget();
      var value = cellEditor.getValue();
      var that = this;

      // 新建Timer, 延时1秒后调用
      this._timer = setTimeout(function(e)
      {
        that._timer = null;
        if (!that._refreshTable(cellEditor, value)) {
          return;
        }
        cellEditor.open();
      }, 100);
    },


    /**
     * TODOC
     *
     * @param cellEditor {var} TODOC
     * @param value {var} TODOC
     * @return {void | boolean} TODOC
     */
    _refreshTable : function(cellEditor, value)
    {
      cellEditor.removeAll();

      // 查询服务器
      var channelID = this.getUserData("channelID");
      var rows = tvproui.EPG.editTable.MaterialSelector.getProperMaterial("Material/getlikeMatchMaterial",
      {
        "ID" : channelID,
        "name" : value
      });
      if (!rows) {
        return;
      }
      for (var i = 0, l = rows.length; i < l; i++)
      {
        var row = rows[i];
        cellEditor.add(new qx.ui.form.ListItem(row.name + "   " + row.duration.toString(), row.style.path, row));
      }
      return true;
    },

    // interface iplementations

    /**
     * TODOC
     *
     * @param cellEditor {var} TODOC
     * @return {var} TODOC
     */
    getCellEditorValue : function(cellEditor)
    {
      // 停用定时器
      if (this._timer) {
        clearTimeout(this._timer);
        this._timer = null;
      }

      var value = cellEditor.getValue() || "";
      cellEditor.removeListener("keyup", this._onInputValue, this);
      var selected = cellEditor.getUserData("rowData");
      tvproui.EPG.editTable.MaterialSelector.lastMaterial = selected;
      tvproui.EPG.editTable.MaterialSelector.clearCache();

      // 如果选中了
      if (selected) {
        return selected.id;
      }

      // 未选中, 并且名称未改变，或名称为空白, 返回原数据
      if (value == cellEditor.originalValue || value == "") {
        return this._orginalID;
      }

      // 未选中，名称改变
      var columnData = this.getUserData("columnData");
      var material =
      {
        "resourceID" : this.getUserData("channelID"),
        "name" : value,
        "type" : columnData.type,
        "duration" : columnData.duration,
        "beginTime" : tvproui.utils.Time.formatDate(new Date()),
        "endTime" : tvproui.utils.Time.formatDate(new Date()),
        "artId" : ""
      };
      tvproui.EPG.editTable.MaterialSelector.lastMaterial = material;

      // 新建数据
      if (confirm("确定，创建新素材 " + value + "；\n取消，仅修改引用名称不影响原素材。"))
      {
        material.id = tvproui.material.command.AddCommand.executeServer(material);
        return material.id;
      }
      material.id = this._orginalID;

      // 修改引用，返回原素材
      return this._orginalID;
    }
  }
});
