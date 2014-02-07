
/* ************************************************************************
************************************************************************ */
qx.Class.define('tvproui.EPG.commandList.commandListModel',
{
  extend : tvproui.control.ui.table.model.ActionModel,
  properties : {
    EPGVersionID :
    {
      check : "Integer",
      nullable : false
    },

    SubVersionID:
    {
      check : "Integer",
      nullable : false
    }
  },
  construct : function(EPGVersionID, subVersionID)
  {

    /* 初始化数据 */
    this.base(arguments);
    this.setEPGVersionID(EPGVersionID);
    this.setSubVersionID(subVersionID);

    /* 初始化列信息 */
    this.setColumns(["ID", "操作"], ["ID", "commandstring"]);

    /* 禁止编辑 */
    this.setColumnEditable(0, false);
    this.setColumnEditable(1, false);
  },
  members : {

    /* 加载素材数据 */

    /**
     * TODOC
     *
     * @return {int | var} TODOC
     */
    loadData : function()
    {
      var EPGVersionID = this.getEPGVersionID();
      var subVersionID = this.getSubVersionID();

      // 加载数据
      var rows = tvproui.AjaxPort.call("commandlist/getOfflineCommandlist", {
        "EPGVersionID" : EPGVersionID,
        "subVersionID" : subVersionID
      });

      if (null == rows)
      {
        this.setDataAsMapArray([]);
        return 0;
      }
      for (var i = 0, l = rows.length; i < l; i++)
      {
        var row = rows[i];
        row.ID = parseInt(row.ID);
        row.commandstring = row.commandstring;
      }
      this.setDataAsMapArray(rows);
      
      return rows.length;
    }
  },

  // 界面之外的内容释放
  destruct : function() {
  }
});

// 释放锁
// 释放非显示层级对象
