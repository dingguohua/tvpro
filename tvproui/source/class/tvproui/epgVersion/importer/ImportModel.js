
/* ************************************************************************
************************************************************************ */
qx.Class.define('tvproui.epgVersion.importer.ImportModel',
{
  extend : qx.ui.table.model.Filtered,
  properties :
  {
    channelID :
    {
      check : "Integer",
      nullable : false
    },
    channelName :
    {
      check : "String",
      nullable : false
    },
    channelICON :
    {
      check : "String",
      nullable : false
    }
  },
  construct : function(channelID, channelName, channelICON)
  {

    /* 初始化数据 */
    this.base(arguments);

    // 设定频道编号
    this.setChannelID(channelID);
    this.setChannelName(channelName);
    this.setChannelICON(channelICON);

    /* 初始化列信息 */
    this.setColumns(["文件名", "路径", "标题", "播出日期", "文件格式", "EPGVersionID"], ["fileName", "path", "title", "broadcastDate", "fileFormat", "EPGVersionID"]);

    /* 禁止编辑ID与编辑状态，这两个字段仅供维护使用，默认不作为用户内容展现 */
    this.setColumnEditable(0, false);
    this.setColumnEditable(1, false);
    this.setColumnEditable(2, true);
    this.setColumnEditable(3, true);
    this.setColumnEditable(4, false);
    this.setColumnEditable(5, false);
  },
  members :
  {


    /**
     * TODOC
     *
     * @param fileName {var} TODOC
     * @param path {var} TODOC
     */
    addItem : function(fileName, path)
    {

      // 查询服务器预览信息
      var previewResult = tvproui.AjaxPort.call("epgVersion/PreviewImportEPG", {
        "path" : path
      });
      if (null == previewResult)
      {
        dialog.Dialog.error("无法预览文件" + fileName + "请联系长江龙新媒体公司解决!");
        return;
      }

      // 组织插入数据
      var row =
      {
        fileName : fileName,
        path : path,
        title : previewResult.title,
        broadcastDate : previewResult.date,
        fileFormat : previewResult.version,
        EPGVersionID : -1
      };

      // 插入并且显示
      this.addRowsAsMapArray([row]);
    },


    /**
     * TODOC
     *
     * @return {boolean} TODOC
     */
    upload : function()
    {
      var channelID = this.getChannelID();
      var rows = this.getDataAsMapArray();
      for (var i = 0, l = rows.length; i < l; i++)
      {
        var row = rows[i];

        // 建立EPGVersion
        var offLineEPGVersionID = tvproui.AjaxPort.call("epgVersion/addOfflineEpgversion",
        {
          "name" : row.title,
          "type" : "日播表",
          "broadcastdate" : row.broadcastDate,
          "channelid" : channelID
        });

        if (null == offLineEPGVersionID)
        {
          dialog.Dialog.error("新建编播表" + row.title + "时出现错误, 请联系长江龙新媒体公司解决!");
          continue;
        }

        // checkout 新建的EPGVersion
        tvproui.AjaxPort.call("epgVersion/checkoutByEPGVersionID", {
          "ID" : offLineEPGVersionID
        });

        // 插入EPGVersion数据
        var result = tvproui.AjaxPort.call("epgVersion/importOfflineEPGVersion",
        {
          "ID" : offLineEPGVersionID,
          "path" : row.path
        });
        if (null == result)
        {
          dialog.Dialog.error("导入编播表" + row.title + "时出现错误, 请联系长江龙新媒体公司解决!");
          continue;
        }

        // checkout 新建的EPGVersion
        tvproui.AjaxPort.call("epgVersion/checkinByEPGVersionID", {
          "ID" : offLineEPGVersionID
        });

        // 模型写入EPGVersionID
        this.setValue(5, i, offLineEPGVersionID);
      }
      return true;
    }
  },

  // 界面之外的内容释放
  destruct : function() {
  }
});

// 释放锁
// 释放非显示层级对象
