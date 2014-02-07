
/* ************************************************************************
************************************************************************ */
qx.Class.define('tvproui.EPG.viewTable.EPGViewModel',
{
  extend : tvproui.control.ui.spanTable.model.TransModel,
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

    // EPG子版本号
    SubVersionID: 
    {
      check : "Integer"
    },

    // 播出日期
    broadcastDate : {
      check : "String"
    },

    // 根节点ID
    rootID : {
      check : "Integer"
    },

    // 正在编辑用户名
    editingAlias : {
      check : "String"
    }
  },
  construct : function(EPGVersionID, SubVersionID, channelID, broadcastDate)
  {
    this.base(arguments);
    this.setEPGVersionID(EPGVersionID);
    this.setSubVersionID(SubVersionID);
    this.setChannelID(channelID);
    this.setBroadcastDate(broadcastDate);

    /* 初始化数据 */
    this.addColumn("sequence", "序号", 3, false);
    this.addColumn("name", "栏目名称", 1, true);
    this.addColumn("name", "时段名称", 2, true);
    this.addColumn("duration", "时段时长", 2, true);
    this.addColumn("fixed", "定时", 3, true);
    this.addColumn("beginTime", "播出时间", 3, true);
    this.addColumn("name", "节目名称", 3, true);
    this.addColumn("duration", "节目时长", 3, true);
    this.addColumn("type", "类型", 3, true);
  },
  events : {
    MaterialChange : "qx.event.type.Data"
  },
  members :
  {
    materialMap : null,

    /**
     * 加载EPG数据，只读
     *
     * @return {boolean | var} TODOC
     */
    loadEPGData : function()
    {
      var epgVersionID = this.getEPGVersionID();
      var subVersionID = this.getSubVersionID();

      // 加载编播表
      var result = tvproui.AjaxPort.call("epgVersion/getSelectedEPGVersion",
      {
        "ID" : epgVersionID,
        "subversion": subVersionID
      });

      if (null == result) {
        return {IDPool:0, nodeMap :{0:{nodeID:0,level:0,children:[],row:0}}};
      }

      var data = qx.lang.Json.parse(result.content);
      if(!data)
      {
        return null;
      }

      return data;
    },

    // 增加素材统计计数

    /**
     * TODOC
     *
     * @param materialMap {var} TODOC
     * @param ID {var} TODOC
     * @param type {var} TODOC
     * @param loading {var} TODOC
     * @return {boolean} TODOC
     */
    addMaterialCount : function(materialMap, ID, type, loading)
    {
      var count = materialMap[ID];
      if (!count) {
        materialMap[ID] = 1;
      } else {
        materialMap[ID] = count + 1;
      }
      if (!loading) {
        this.fireDataEvent("MaterialChange", materialMap);
      }
    },

    /* 加载素材数据 */

    /**
     * TODOC
     *
     * @return {boolean | Map} TODOC
     */
    loadData : function()
    {
      // 加载编播表
      var result = this.loadEPGData();

      if(!result)
      {
        return false;
      }

      this.loadFromOjbect(result);

      // 初始化素材映射图
      var materialMap = {

      };
      this.materialMap = materialMap;

      // 加载编播表
      var nodes = this.getData();
      for (var nodeID in nodes)
      {
        var node = nodes[nodeID];
        if(node.level != 3)
        {
          continue;
        }

        var columnData = node.columnData;
        this.addMaterialCount(materialMap, columnData.IDMaterial, columnData.type, true);
      }

      // 检查表格状态
      this.check();

      // 更新素材表
      this.fireDataEvent("MaterialChange", materialMap);
      return true;
    },

    //检查

    /**
     * TODOC
     *
     * @param nodeID {var} TODOC
     * @param node {Node} TODOC
     * @param subCheck {var} TODOC
     * @return {void | boolean} TODOC
     */
    check : function()
    {
      var root = this.getRoot();
      var columnIDs = root.children;
      if (columnIDs.length == 0) {
        return;
      }

      var parsedEnd;
      var parseDuration;

      // 循环栏目
      for(var columnPos = 0, columnLength = columnIDs.length; columnPos < columnLength; columnPos++)
      {
        var columnID = columnIDs[columnPos];
        var columnNode = this.getNodeByNodeId(columnID);
        var subColumnIDs = columnNode.children;

        // 循环栏目下子栏目
        for(var subColumnPos = 0, subColumnLength = subColumnIDs.length; subColumnPos < subColumnLength; subColumnPos++)
        {
          var subColumnID = subColumnIDs[subColumnPos];
          var subColumnNode = this.getNodeByNodeId(subColumnID);
          var materialIDs = subColumnNode.children;

          // 循环子栏目下素材
          for(var materialIDPos = 0, materialIDLength = materialIDs.length; materialIDPos < materialIDLength; materialIDPos++)
          {
            var materialID = materialIDs[materialIDPos];
            var materialNode = this.getNodeByNodeId(materialID);
            var columnData = materialNode.columnData;

            // 验证时段时长是否与素材起始时间结束时间相一致
            if(!columnData.endTime.sub(columnData.beginTime).equal(columnData.duration))
            {
              this.setNodeAttr(materialNode, "durationcalc", "←");
            }

            // 第一条素材，获得起始时长，获得起始时段
            if(null == parsedEnd)
            {
              parsedEnd = columnData.endTime;
              parseDuration = tvproui.utils.Duration.fromStartEnd(columnData.beginTime, columnData.endTime);
              continue;
            }

            // 尝试计算当前素材与之前累计时段之间是否相交
            var currentStart = columnData.beginTime;
            var currentEnd = columnData.endTime;
            var currentDuration = tvproui.utils.Duration.fromStartEnd(currentStart, currentEnd);
            var intersection = parseDuration.intersection(currentDuration);

            // 相交则一定不留白
            if (intersection != null) 
            {
              this.setNodeAttr(materialNode, "intersection", "←");
            }
            else 
            {
              // 尝试计算当前节目和之前节目之间是否有留白
              var spare = currentStart.getTime() - parsedEnd.getTime();
              if (spare > 0) {
                this.setNodeAttr(materialNode, "spare", "←");
              }
              if (spare < 0)
              {
                this.setNodeAttr(materialNode, "spare", "←");
                parseDuration = currentDuration;
              }
            }

            // 将当前素材结束时间作为下一条记录开始时间，将处理时段延长至上一条结束
            parsedEnd = currentEnd;
            parseDuration.extendTo(parsedEnd);
          }
        }
      }

      this.setData();
    },
    /**
     * TODOC
     *
     * @param node {Node} TODOC
     * @param type {var} TODOC
     * @return {var | int} TODOC
     */
    calcTypeTime : function(node, type)
    {
      var columnData = node.columnData;
      var children = node.children;
      if (children && (children.length > 0))
      {
        var duration = 0;
        for (var i = 0, l = children.length; i < l; i++) {
          var childID = children[i];
          var child = this.getNodeByNodeId(childID);
          duration += this.calcTypeTime(child, type);
        }
        return duration;
      }
      if (columnData.type != type) {
        return 0;
      }
      return columnData.duration.getTime();
    },

    /* 统计选中项目时长 */

    /**
     * TODOC
     *
     * @param itemRowRanges {var} TODOC
     * @return {var} TODOC
     */
    sumItems : function(itemRowRanges)
    {
      var tree = [];
      this.sectionToTree(itemRowRanges, tree);
      var duration = 0;
      var ADDuration = 0;
      for (var i = 0, l = tree.length; i < l; i++)
      {
        var node = tree[i];
        var columnData = node.columnData;
        var time = columnData.duration.getTime();
        duration += time;
        ADDuration += this.calcTypeTime(node, "硬广告");
      }
      return " 共计:" + tvproui.utils.Time.fromOffset(duration).toString() + " 硬广告:" + tvproui.utils.Time.fromOffset(ADDuration).toString();
    },

    // override: 将时间该写为秒计数
    saveToObject: function()
    {
      var nodeMap = qx.lang.Object.clone(this._nodeMap);

      for(var nodeID in nodeMap)
      {
        var node = qx.lang.Object.clone(nodeMap[nodeID]);
        if(!node.columnData)
        {
          continue;
        }

        delete node.style;

        var columnData = qx.lang.Object.clone(node.columnData);
        columnData.beginTime = columnData.beginTime.getTime();
        columnData.endTime = columnData.endTime.getTime();
        delete columnData.duration;
        delete columnData.intersection;
        delete columnData.spare;
        delete columnData.durationcalc;

        node.columnData = columnData;
        nodeMap[nodeID] = node;
      }

      var storage = {IDPool: this._localIDPool, nodeMap: nodeMap};
      return storage;
    },

    // override: 将秒计数改写为时间
    loadFromOjbect: function(storage)
    {
      // 清理数据
      this.clearData();

      this._localIDPool = storage.IDPool;
      var nodeMap = storage.nodeMap;
      var defaultStyleMap = tvproui.system.fileManager.getCSSStyle();

      for(var nodeID in nodeMap)
      {
        var node = nodeMap[nodeID];
        if(!node.columnData)
        {
          continue;
        }

        var columnData = node.columnData;
        columnData.beginTime = tvproui.utils.Time.fromOffset(columnData.beginTime);
        columnData.endTime = tvproui.utils.Time.fromOffset(columnData.endTime);
        columnData.duration = columnData.endTime.sub(columnData.beginTime);
        columnData.intersection = "";
        columnData.spare = "";
        columnData.durationcalc = "";

        if(columnData.ID)
        {
          delete columnData.ID;
        }

        if(columnData.epgID)
        {
          delete columnData.epgID;
        }

        if(columnData.epgversionid)
        {
          delete columnData.epgversionid;
        }

        if(columnData.level)
        {
          delete columnData.level;
        }
        
        if(columnData.position)
        {
          delete columnData.position;
        }
        
        if(columnData.treeLeft)
        {
          delete columnData.treeLeft;
        }
        
        if(columnData.treeRight)
        {
          delete columnData.treeRight;
        }
        
        if(columnData.userID)
        {
          delete columnData.userID;
        }
        
        if(columnData.versionID)
        {
          delete columnData.versionID;
        }

        // 刷新样式表
    		if(!defaultStyleMap[columnData.type])
    		{
    			dialog.Dialog.error("未定义的数据类型" + columnData.type);
          node.style = defaultStyleMap["未知类型"];
    		}
  		  else
        {
          node.style = defaultStyleMap[columnData.type];
        }
      }

      this._nodeMap = nodeMap;
      this.setData();

      return true;
    }
  }
});
