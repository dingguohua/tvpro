
/* ************************************************************************
************************************************************************ */
qx.Class.define('tvproui.epgVersion.EPGMultipleVersionModel',
{
  extend : tvproui.control.ui.table.model.ActionModel,
  construct : function(EPGVersionID, channelID, broadcastDate)
  {
    this.setEPGVersionID(EPGVersionID);
    this.setChannelID(channelID);
    this.setBroadcastDate(broadcastDate);

    /* 初始化数据 */
    this.base(arguments);

    /* 初始化列信息 */
    this.setColumns(["ID", "版本号", "版本注释", "修订人", "修订时间"], ["ID", "version", "description", "submitAlias", "submitTime"]);

    /* 禁止编辑ID与编辑状态，这两个字段仅供维护使用，默认不作为用户内容展现 */
    this.setColumnEditable(0, false);
    this.setColumnEditable(1, false);
    this.setColumnEditable(2, false);
    this.setColumnEditable(3, false);
    this.setColumnEditable(4, false);
    this.loadData();
  },
  properties :
  {

    // 频道编号
    channelID : {
      check : "Integer"
    },

    // EPG版本号
    EPGVersionID : {
      check : "Integer"
    },

    // 播出日期
    broadcastDate : {
      check : "String"
    }
  },
  members : {

    /* 加载素材数据 */

    /**
     * TODOC
     *
     * @return {var | int} TODOC
     */
    loadData : function()
    {
      var EPGVersionID = this.getEPGVersionID();

      // 加载数据
      var rows = tvproui.AjaxPort.call("epgVersion/listByEPGVersionID", {
        "ID" : EPGVersionID
      });
      if (null == rows)
      {
        this.setDataAsMapArray([]);
        return 0;
      }
      for (var i = 0, l = rows.length; i < l; i++)
      {
        var row = rows[i];
        row.ID = parseInt(row.id);
        row.version = parseInt(row.subversion);
        row.submitAlias = row.checkAlias;
        row.submitTime = row.committime;
      }

      //row.description = row.description;
      this.setDataAsMapArray(rows);
      return rows.length;
    }
  },
  destruct : function() {
  }
});
