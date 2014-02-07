
/* ************************************************************************
************************************************************************ */
qx.Class.define('tvproui.materialType.MaterialTypeModel',
{
  /*TransModel*/
  extend : tvproui.control.ui.table.model.TransModel,
  construct : function()
  {

    /* 初始化数据 */
    this.base(arguments);

    /* 初始化列信息 */
    this.setColumns(["ID", "图标ID", "图标", "类型", "背景色", "字体大小", "字色", "加粗", "斜体", "层次"], ["ID", "imageID", "path", "type", "backcolor", "fontsize", "fontcolor", "bold", "italic", "level"]);

    /* 禁止编辑ID与编辑状态，这两个字段仅供维护使用，默认不作为用户内容展现 */
    this.setColumnEditable(0, false);
    this.setColumnEditable(1, false);

    // 仅管理员才可以修改类型名称(会引起下面大的问题)
    if (tvproui.user.LoginWindow.currentUsername == "admin")
    {
      this.setColumnEditable(2, true);
      this.setColumnEditable(3, true);
      this.setColumnEditable(9, true);
    } else
    {
      this.setColumnEditable(2, false);
      this.setColumnEditable(3, false);
      this.setColumnEditable(9, false);
    }
    this.setColumnEditable(4, true);
    this.setColumnEditable(5, true);
    this.setColumnEditable(6, true);
    this.setColumnEditable(7, false);
    this.setColumnEditable(8, false);

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
      return new tvproui.materialType.command.AddCommand(this,item,position);
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
      return new tvproui.materialType.command.UpdateMapCommand(this, oldMap, newMap);
    },

    /* 加载素材数据 */

    /**
     * TODOC
     *
     */
    loadData : function()
    {
      /*materialType/load parseInt ID imageID path bold italic*/
      var rows = tvproui.AjaxPort.call("materialType/load");
      if(null == rows){
        this.setDataAsMapArray([]);
        return;
      }
      for(var i = 0,l = rows.length; i < l; i++)
      {
        var row = rows[i];
        row.ID = parseInt(row.ID);
        row.imageID = parseInt(row.imageID);
        row.path = tvproui.system.fileManager.path(row.path);
        row.bold = row.bold == 1 ? true: false;
        row.italic = row.italic == 1 ? true: false;
      }

      // "imageID" "type", "backcolor", "fontsize", "fontcolor", "alias"
      this.setDataAsMapArray(rows);
    }
  },

  // 界面之外的内容释放
  destruct : function() {
  }
});

// 释放锁
// 释放非显示层级对象
