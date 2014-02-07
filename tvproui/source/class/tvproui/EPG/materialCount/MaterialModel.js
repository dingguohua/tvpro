
/* ************************************************************************
************************************************************************ */
qx.Class.define('tvproui.EPG.materialCount.MaterialModel',
{
  extend : tvproui.control.ui.table.model.TransModel,
  properties : {
    resoureID : {
      check : "Integer"
    }
  },
  construct : function()
  {

    /* 初始化数据 */
    this.base(arguments);

    /* 初始化列信息 */
    this.setColumns(["ID", "名称", "类型", "时长", "失效", "引用", "编号", "上传人", "资源ID"], ["ID", "name", "type", "duration", "endTime", "reference", "artId", "alias", "resourceID"]);

    /* 禁止编辑ID与编辑状态，这两个字段仅供维护使用，默认不作为用户内容展现 */
    this.setColumnEditable(0, false);
    this.setColumnEditable(1, true);
    this.setColumnEditable(2, true);
    this.setColumnEditable(3, true);
    this.setColumnEditable(4, true);
    this.setColumnEditable(5, false);
    this.setColumnEditable(6, true);
    this.setColumnEditable(7, false);
    this.setColumnEditable(8, false);
    this.setSortMethods(3, this._durationCompares);
  },
  members :
  {

    /* 获取新的添加命令 */

    /**
     * TODOC
     *
     * @param item {var} TODOC
     * @param position {var} TODOC
     * @return {var} TODOC
     */
    _getNewAddCommand : function(item, position) {
      return new tvproui.material.command.AddCommand(this, item, position);
    },

    /* 获取新的更新命令 */

    /**
     * TODOC
     *
     * @param oldMap {var} TODOC
     * @param newMap {var} TODOC
     * @return {var} TODOC
     */
    _getNewUpdateMapCommand : function(oldMap, newMap) {
      return new tvproui.material.command.UpdateMapCommand(this, oldMap, newMap);
    },

    /* 获取新的删除命令 */

    /**
     * TODOC
     *
     * @param rowStart {var} TODOC
     * @param rowEnd {var} TODOC
     * @return {var} TODOC
     */
    _getNewDeleteCommand : function(rowStart, rowEnd) {
      return new tvproui.material.command.DeleteCommand(this, rowStart, rowEnd);
    },

    /* 加载素材数据 */

    /**
     * TODOC
     *
     * @param resourceTreeID {var} TODOC
     * @param type {var} TODOC
     */
    loadData : function(endTime, resourceTreeID, type)
    {
      if (null == resourceTreeID)
      {
        dialog.Dialog.alert("请在右侧选择相应栏目!");
        return;
      }
      this.setResoureID(resourceTreeID);
      var rows;

      // 如果类型未指定，使用相应栏目下面所有
      if (!type) {
        rows = tvproui.AjaxPort.call("Material/loadMaterial", {
          "endTime": endTime,
          "resourcetreeID" : resourceTreeID
        });
      } else {
        rows = tvproui.AjaxPort.call("Material/loadMaterialByType",
        {
          "endTime": endTime,
          "resourcetreeID" : resourceTreeID,
          "type" : type
        });
      }
      if (null == rows)
      {
        this.setDataAsMapArray([]);
        return;
      }
      for (var i = 0, l = rows.length; i < l; i++)
      {
        var row = rows[i];
        row.ID = parseInt(row.ID);

        //row.name = row.name;
        row.duration = tvproui.utils.Time.fromOffset(parseInt(row.duration));

        //row.type = row.type
        //row.content = row.content;
        //row.remark = row.remark;
        row.resourceID = parseInt(row.resourceID);
        row.reference = 0;
      }
      this.setDataAsMapArray(rows);
    },


    /**
     * TODOC
     *
     * @param row1 {var} TODOC
     * @param row2 {var} TODOC
     * @return {int | var} TODOC
     */
    _durationCompares : function(row1, row2)
    {
      var duration1 = row1[3];
      var duration2 = row2[3];
      var offset = duration1.getTime() - duration2.getTime();
      if (offset > 0) {
        return 1;
      }
      if (offset < 0) {
        return -1;
      }
      return 0;
    },

    /* 获取拷贝的数组 */

    /**
     * TODOC
     *
     * @param minIndex {var} TODOC
     * @param maxIndex {var} TODOC
     * @return {var} TODOC
     */
    getCopyData : function(minIndex, maxIndex)
    {
      var results = [];
      results.length = maxIndex - minIndex + 1;
      var pos = 0;

      /* 取出数据 */
      for (var i = minIndex; i <= maxIndex; i++)
      {
        var rowData = this.getRowDataAsMap(i);
        results[pos++] = rowData;
      }
      return results;
    },

    /* 放入复制频道数据 */

    /**
     * TODOC
     *
     * @param startPosition {var} TODOC
     * @param columnDatas {var} TODOC
     * @return {boolean} TODOC
     */
    putCopyData : function(startPosition, columnDatas)
    {

      /* 没有数据 */
      if (columnDatas.length == 0) {
        return true;
      }

      /* 循环所有数据条目 */
      for (var i = 0, l = columnDatas.length; i < l; i++)
      {
        var columnData = columnDatas[i];
        columnData.ID = tvproui.utils.IDManager.getLocalTempID();
        columnData.name += " (副本)";
        columnData.resourceID = this.getResoureID();
        var newID = this.addItem(columnData, startPosition + i);
        if (null == newID)
        {
          dialog.Dialog.error("粘贴素材时出错!");
          return false;
        }
      }
      return true;
    },

    /* 计算时段时长 */

    /**
     * TODOC
     *
     * @param items {var} TODOC
     * @return {var} TODOC
     */
    sumDuration : function(items)
    {
      var duration = 0;

      /* 取出数据 */
      for (var i = 0, l = items.length; i < l; i++)
      {
        var item = items[i];
        for (var j = item.minIndex, k = item.maxIndex; j <= k; j++)
        {
          var rowData = this.getRowDataAsMap(j);
          duration += rowData.duration.getTime();
        }
      }
      return " 共计:" + tvproui.utils.Time.fromOffset(duration).toString();
    }
  },

  // 界面之外的内容释放
  destruct : function() {
  }
});

// 释放非显示层级对象
