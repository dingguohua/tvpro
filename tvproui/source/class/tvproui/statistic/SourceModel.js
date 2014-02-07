
/* ************************************************************************
************************************************************************ */
qx.Class.define('tvproui.statistic.SourceModel',
{
  extend : tvproui.control.ui.treevirtual.ActionModel,
  properties :
  {
    channelID : {
      check : "Integer"
    },
    channel : {
      check : "String"
    },
    channelICON : {
      check : "String"
    },

    // 起始日期
    beginDate : {
      check : "String"
    },

    // 结束日期
    endDate: {
      check: "String"
    }
  },
  construct : function()
  {
    /* 初始化数据 */
    this.base(arguments, ["name", "type", "subversion", "broadcastdate", "alias", "correctRate", "lastEditDate", "lastCalculateDate"]);
  },
  members :
  {
    // 预排表版本数据

    /**
     * TODOC
     *
     * @return {boolean | Map} TODOC
     */
    loadData : function()
    {
      var channelID = this.getChannelID();
      var beginDate = this.getBeginDate();
      var endDate = this.getEndDate();
      var rows = tvproui.AjaxPort.call("statistic/loadStatisEpgcolumn",
      {
        "startDate" : beginDate,
        "endDate" : endDate,
        "channelID" : channelID
      });

      this.clearData();
      if (null == rows) {
        return false;
      }

      for (var i = 0, l = rows.length; i < l; i++)
      {
        var row = rows[i];
        row.ID = parseInt(row.ID);
        //row.name = row.name;
        //row.type = row.type;
        //row.broadcastdate = row.broadcastdate;
        row.subversion = parseInt(row.subversion);
        //row.alias = row.alias;
        //row.correctRate = row.correctRate;
        //row.lastEditDate = row.lastEditDate;
        //row.lastCalculateDate = row.lastCalculateDate;

        this.addBranch(0, row.name, true, false, "tvproui/layout/version.png", "tvproui/layout/version.png", row.ID);
        this.setColumnData(row.ID, 1, row.type);
        this.setColumnData(row.ID, 2, row.broadcastdate);
        this.setColumnData(row.ID, 3, row.subversion);
        this.setColumnData(row.ID, 4, row.alias);
        this.setColumnData(row.ID, 5, row.correctRate);
        this.setColumnData(row.ID, 6, row.lastEditDate);
        this.setColumnData(row.ID, 7, row.lastCalculateDate);
        this.setColumnData(row.ID, "row", row);
      }

      this.setData();

      return true;
    }
  }
});
