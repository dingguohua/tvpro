
/* ************************************************************************
************************************************************************ */
qx.Class.define('tvproui.tag.TagModel',
{
  extend : tvproui.control.ui.table.model.TransModel,
  construct : function()
  {

    /* 初始化数据 */
    this.base(arguments);

    /* 初始化列信息 */
    this.setColumns(["ID", "图标ID", "图标", "名称", "描述", "上传人"], ["ID", "imageid", "path", "name", "desc", "alias"]);

    /* 禁止编辑ID与编辑状态，这两个字段仅供维护使用，默认不作为用户内容展现 */
    this.setColumnEditable(0, false);
    this.setColumnEditable(1, false);
    this.setColumnEditable(2, true);
    this.setColumnEditable(3, true);
    this.setColumnEditable(4, true);
    this.setColumnEditable(5, false);

    /* 图标一栏仅在客户端有效 */
    this.setClientOnlyCol(2);
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
      return new tvproui.tag.command.AddCommand(this, item, position);
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
      return new tvproui.tag.command.UpdateMapCommand(this, oldMap, newMap);
    },

    /* 获取新的添加命令 */

    /**
     * TODOC
     *
     * @param rowStart {var} TODOC
     * @param rowEnd {var} TODOC
     * @return {var} TODOC
     */
    _getNewDeleteCommand : function(rowStart, rowEnd) {
      return new tvproui.tag.command.DeleteCommand(this, rowStart, rowEnd);
    },

    /* 加载素材数据 */

    /**
     * TODOC
     *
     */
    loadData : function()
    {
      var rows = tvproui.AjaxPort.call("tag/loadTagTypes");
      if (null == rows)
      {
        this.setDataAsMapArray([]);
        return;
      }
      for (var i = 0, l = rows.length; i < l; i++)
      {
        var row = rows[i];
        row.ID = parseInt(row.ID);
        row.path = tvproui.system.fileManager.path(row.path);
      }

      //"imageid", "path", "name", "desc", "alias"
      this.setDataAsMapArray(rows);
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

    /* 放入复制标签数据 */

    /**
     * TODOC
     *
     * @param startPosition {var} TODOC
     * @param columnDatas {var} TODOC
     * @return {boolean | var} TODOC
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
      }
      return this.addItems(columnDatas, startPosition);
    }
  },

  // 界面之外的内容释放
  destruct : function() {
  }
});

// 释放锁
// 释放非显示层级对象
