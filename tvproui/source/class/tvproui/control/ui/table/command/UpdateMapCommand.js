
/**
 * @author 张未波
 * 更新命令
 */
qx.Class.define("tvproui.control.ui.table.command.UpdateMapCommand",
{
  extend : tvproui.control.ui.command.Command,
  construct : function(model, oldMap, newMap)
  {
    this.base(arguments, model);
    this._oldMap = oldMap;
    this._newMap = newMap;
  },
  members :
  {
    _oldMap : null,
    _newMap : null,

    /* 执行保存命令 */

    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    executeServer : function()
    {
      this.base(arguments);
      return this._executeServer(this._readyServerData(this._newMap, this._oldMap));
    },

    // 执行撤销命令

    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    cancelServer : function()
    {
      this.base(arguments);
      return this._executeServer(this._readyServerData(this._oldMap, this._newMap));
    },


    /**
     * TODOC
     *
     * @param map {Map} TODOC
     * @param map2 {var} TODOC
     * @return {var} TODOC
     */
    _readyServerData : function(map, map2)
    {
      var result = {

      };
      var model = this._target;
      var ID;
      for (ID in map)
      {
        if (parseInt(ID) != ID) {
          continue;
        }

        // 取出数据，将旧ID链接删除，获取新ID，重新置入
        var colMap = map[ID];
        var newID = tvproui.utils.IDManager.getNewID(ID);
        if (newID != ID)
        {
          var colMap2 = map2[ID];
          delete map[ID];
          delete map2[ID];
          map[newID] = colMap;
          map2[newID] = colMap2;
          ID = newID;
        }
        var row = {

        };
        result[ID] = row;
        var col;
        for (col in colMap)
        {
          if (parseInt(col) != col) {
            continue;
          }

          // 客户端专有列不外发
          if (model.getClientOnlyCol(col)) {
            continue;
          }
          var value = colMap[col];
          var columnName = model.getColumnId(col);
          row[columnName] = value;
        }
      }
      return result;
    },

    /* 服务器端执行添加操作, 请覆盖本函数 */
    /* @arg Integer ID 修改记录的ID */
    /* @arg String columnName 列名称 */
    /* @arg String value 修改记录的值 */
    /* @return true/false */

    /**
     * TODOC
     *
     * @param map {Map} TODOC
     * @return {boolean} TODOC
     */
    _executeServer : function(map) {
      return true;
    },

    // 在本地执行替换

    /**
     * TODOC
     *
     * @param map {Map} TODOC
     * @return {boolean} TODOC
     */
    _executeClient : function(map)
    {
      var model = this._target;
      var ID;
      for (ID in map)
      {
        if (parseInt(ID) != ID) {
          continue;
        }
        var colMap = map[ID];
        var col;
        for (col in colMap)
        {
          if (parseInt(col) != col) {
            continue;
          }
          col = parseInt(col);
          var value = colMap[col];
          var row = model.getRowOfID(ID);
          model.setValue(col, row, value);
        }
      }
      return true;
    },

    // 在本地执行替换

    /**
     * TODOC
     *
     * @param map {Map} TODOC
     * @return {boolean} TODOC
     */
    _cancelClient : function(map)
    {
      var model = this._target;
      var ID;
      for (ID in map)
      {
        if (parseInt(ID) != ID) {
          continue;
        }
        var colMap = map[ID];
        var col;
        for (col in colMap)
        {
          if (parseInt(col) != col) {
            continue;
          }
          col = parseInt(col);
          var value = colMap[col];
          var row = model.getRowOfID(ID);
          model.setValue(col, row, value);
        }
      }
      return true;
    },

    /* 执行命令 */

    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    executeClient : function()
    {
      this.base(arguments);
      return this._executeClient(this._newMap);
    },

    /* 取消命令 */

    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    cancelClient : function()
    {
      this.base(arguments);
      return this._cancelClient(this._oldMap);
    }
  },
  destruct : function()
  {
    this._oldMap = null;
    this._newMap = null;
  }
});
