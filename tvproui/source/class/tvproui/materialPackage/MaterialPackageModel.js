
/* ************************************************************************
************************************************************************ */
qx.Class.define('tvproui.materialPackage.MaterialPackageModel',
{
  extend : tvproui.control.ui.table.model.ActionModel,
  construct : function()
  {

    /* 初始化数据 */
    this.base(arguments);

    /* 初始化列信息 */
    this.setColumns(["ID", "素材ID", "名称", "类型", "时长", "生效", "失效", "编号", "上传", "打包", "标签"], ["ID", "materialID", "name", "type", "duration", "beginTime", "endTime", "artId", "uploadAlias", "packageAlias", "tag"]);

    /* 禁止编辑ID与编辑状态，这两个字段仅供维护使用，默认不作为用户内容展现 */
    this.setColumnEditable(0, false);
    this.setColumnEditable(1, false);
    this.setColumnEditable(2, true);
    this.setColumnEditable(3, true);
    this.setColumnEditable(4, true);
    this.setColumnEditable(5, true);
    this.setColumnEditable(6, true);
    this.setColumnEditable(7, true);
    this.setColumnEditable(8, false);
    this.setColumnEditable(9, false);
    this.setColumnEditable(10, true);

    // 初始化上次访问时间
    this._lastViewTime = new Date();
  },
  properties :
  {
    parentMaterialID : {
      check : "Integer"
    },
    broadcastDate : {
      check : "String"
    },

    // 锁定状态，锁定后不可编辑
    locked :
    {
      init : true,
      check : "Boolean"
    },

    // 正在编辑用户名
    editingAlias :
    {
      init : "",
      check : "String"
    }
  },
  statics :
  {


    /**
     * TODOC
     *
     * @param materialID {var} TODOC
     * @param broadcastDate {var} TODOC
     * @return {var} TODOC
     */
    calculatePackageDuration : function(materialID, broadcastDate)
    {

      // 加载数据
      var result = tvproui.AjaxPort.call("materialpackage/calculatePackageDuration",
      {
        "parentMaterialID" : materialID,
        "broadcastDate" : broadcastDate
      });
      return tvproui.utils.Time.fromOffset(result);
    },


    /**
     * TODOC
     *
     * @param ID {var} TODOC
     * @param broadcastDate {var} TODOC
     * @return {null | var} TODOC
     */
    getPackageItems : function(ID, broadcastDate)
    {

      // 加载数据
      var rows = tvproui.AjaxPort.call("materialpackage/load",
      {
        "parentMaterialID" : ID,
        "broadcastDate" : broadcastDate,
        "nolock" : "true"
      });
      if (null == rows) {
        return null;
      }
      if (null == rows.lock) {
        return null;
      }
      return rows.datas;
    }
  },
  members :
  {
    _lastMaterialID : null,
    _lastBroadcastDate : null,
    _lastViewTime : null,

    /* 获取新的添加命令 */

    /**
     * TODOC
     *
     * @param item {var} TODOC
     * @param position {var} TODOC
     * @return {var} TODOC
     */
    _getNewAddCommand : function(item, position) {
      return new tvproui.materialPackage.command.AddCommand(this, item, position);
    },

    /* 获取新的添加命令 */

    /**
     * TODOC
     *
     * @param ID {var} TODOC
     * @param col {var} TODOC
     * @param value {var} TODOC
     * @param oldValue {var} TODOC
     * @param materialID {var} TODOC
     * @return {var} TODOC
     */
    _getNewUpdateCommand : function(ID, col, value, oldValue, materialID) {
      return new tvproui.materialPackage.command.UpdateCommand(this, ID, col, value, oldValue, materialID);
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
      return new tvproui.materialPackage.command.DeleteCommand(this, rowStart, rowEnd);
    },

    /* 获取新的移动命令, 用以被重载使用 */

    /**
     * TODOC
     *
     * @param row {var} TODOC
     * @param position {var} TODOC
     * @return {var} TODOC
     */
    _getNewMoveCommand : function(row, position) {
      return new tvproui.materialPackage.command.MoveCommand(this, row, position);
    },

    // overridden

    /**
     * TODOC
     *
     * @param columnIndex {var} TODOC
     * @return {boolean | var} TODOC
     */
    isColumnEditable : function(columnIndex)
    {
      if (this.getLocked()) {
        return false;
      }
      return this.base(arguments, columnIndex);
    },

    /* 加载素材数据 */

    /**
     * TODOC
     *
     * @param readonly {var} TODOC
     * @param materialID {var} TODOC
     * @param broadcastDate {var} TODOC
     * @return {var | int} TODOC
     */
    loadData : function(readonly, materialID, broadcastDate)
    {
      this.close();
      this.setParentMaterialID(materialID);
      this.setBroadcastDate(broadcastDate);
      var now = new Date();

      // 比较是否有缓存
      if ((this._lastMaterialID == materialID) && (this._lastBroadcastDate == broadcastDate) && (now.getTime() - this._lastViewTime.getTime()) < 3000)
      {
        this.setDataAsMapArray(this._lastRows);
        return this._lastRows ? this._lastRows.length : 0;
      }

      // boolean转换为熟知
      readonly = readonly ? readonly : 0;

      // 加载数据
      var rows = tvproui.AjaxPort.call("materialpackage/load",
      {
        "parentMaterialID" : materialID,
        "broadcastDate" : broadcastDate,
        "nolock" : readonly
      });
      if (null == rows)
      {
        this.setLocked(false);
        this.setEditingAlias("");
        this.setDataAsMapArray([]);
        return 0;
      }
      if (null == rows.lock)
      {
        this.setLocked(false);
        this.setEditingAlias("");
        this.setDataAsMapArray([]);
        return 0;
      }
      var lock = (rows.lock != 1);
      this.setLocked(lock);
      var alias = (rows.alias == null) ? "" : rows.alias;
      this.setEditingAlias(alias);
      rows = rows.datas;
      if (null == rows)
      {
        this.setDataAsMapArray([]);
        return 0;
      }

      // 保存至缓存
      this._lastViewTime = now;
      this._lastMaterialID = materialID;
      this._lastBroadcastDate = broadcastDate;
      for (var i = 0, l = rows.length; i < l; i++)
      {
        var row = rows[i];
        row.ID = parseInt(row.ID);

        //row.artId = row.artId;
        //row.beginTime = row.beginTime;
        //row.broadcastdate = row.broadcastdate;
        row.duration = tvproui.utils.Time.fromString(row.duration);

        //row.endTime = row.endTime;
        row.materialID = parseInt(row.materialID);
      }

      //row.name = row.name
      //row.packageAlias = row.packageAlias;
      //row.recordtime = row.recordtime;
      //row.uploadAlias = row.uploadAlias;
      this.setDataAsMapArray(rows);
      this._lastRows = rows;
      return rows.length;
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
      return this.addItems(columnDatas, startPosition);
    },

    /* 修改数据内容 , 一个值 */

    /**
     * TODOC
     *
     * @param row {var} TODOC
     * @param col {var} TODOC
     * @param value {var} TODOC
     * @param oldValue {var} TODOC
     * @return {var} TODOC
     */
    updateItem : function(row, col, value, oldValue)
    {
      var rowData = this.getRowData(row);

      // 获取行ID
      var ID = rowData[0];

      // 素材ID
      var materialID = rowData[1];

      /* 插入并执行修改数据事务 */
      return this._doCommand(this._getNewUpdateCommand(ID, col, value, oldValue, materialID));
    },

    /* 获取拷贝的数组 */

    /**
     * TODOC
     *
     * @param fullTime {var} TODOC
     * @param ADTime {var} TODOC
     * @return {var} TODOC
     */
    calcDuration : function(fullTime, ADTime)
    {
      var duration = 0;
      var ADDuration = 0;
      var rows = this.getData();

      /* 取出数据 */
      for (var i = 0, l = rows.length; i < l; i++)
      {
        var row = rows[i];
        var rowDuration = row[4].getTime();
        duration += rowDuration;
        if (row[3] == "硬广告") {
          ADDuration += rowDuration;
        }
      }
      var sumDuration = tvproui.utils.Time.fromOffset(duration);
      fullTime.setValue(sumDuration.toString());
      ADTime.setValue(tvproui.utils.Time.fromOffset(ADDuration).toString());
      return sumDuration;
    },

    /* 获取拷贝的数组 */

    /**
     * TODOC
     *
     * @param items {var} TODOC
     * @return {var} TODOC
     */
    sumDuration : function(items)
    {
      var duration = 0;
      var ADDuration = 0;

      /* 取出数据 */
      for (var i = 0, l = items.length; i < l; i++)
      {
        var item = items[i];
        for (var j = item.minIndex, k = item.maxIndex; j <= k; j++)
        {
          var rowData = this.getRowDataAsMap(j);
          var rowDuration = rowData.duration.getTime();
          duration += rowDuration;
          if (rowData.type == "硬广告") {
            ADDuration += rowDuration;
          }
        }
      }
      return " 共计:" + tvproui.utils.Time.fromOffset(duration).toString() + " 硬广告:" + tvproui.utils.Time.fromOffset(ADDuration).toString();
    },


    /**
     * TODOC
     *
     */
    close : function()
    {

      // 锁定用户不需要关闭
      if (this.getLocked()) {
        return;
      }
      var broadcastDate = this.getBroadcastDate();
      var materialID = this.getParentMaterialID();

      // 如果是可写模式，关闭引用的素材包
      tvproui.AjaxPort.call("materialpackage/close",
      {
        "broadcastDate" : broadcastDate,
        "parentMaterialID" : materialID
      });
    }
  },
  destruct : function()
  {
    this.close();
    this._lastMaterialID = null;
    this._lastBroadcastDate = null;
    this._lastViewTime = null;
  }
});
