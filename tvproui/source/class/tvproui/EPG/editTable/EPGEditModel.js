
/* ************************************************************************
************************************************************************ */
qx.Class.define('tvproui.EPG.editTable.EPGEditModel',
{
  extend : tvproui.EPG.viewTable.EPGViewModel,

  members :
  {
    _lastSaveStep: 0,
    _editStep: 0,

    /* 获取新的添加命令 */

    /**
     * TODOC
     *
     * @param type {var} TODOC
     * @param parentID {var} TODOC
     * @param position {var} TODOC
     * @param columnData {var} TODOC
     * @param styleMap {var} TODOC
     * @return {var} TODOC
     */
    _getNewAddCommand : function(type, parentID, position, columnData, styleMap) {
      return new tvproui.EPG.editTable.command.AddCommand(this, type, parentID, position, columnData, styleMap);
    },

    /**
     * 加载EPG数据，只读
     *
     * @return {boolean | var} TODOC
     */
    loadEPGData : function()
    {
      // 获取网络数据
      var networkData = this.base(arguments);
      if(networkData.editStep === undefined)
      {
        networkData.editStep = 0;
      }

      this._lastSaveStep = networkData.editStep;
      this._editStep = networkData.editStep;

      // 获取本地记录
      var storageName = "tvpro_epgversion_" + this.getEPGVersionID();
      this._lastSaveSubVersionID = this.getSubVersionID();
      var storageSubVersion = "tvpro_epgversion_" + this.getEPGVersionID() + '_' + this._lastSaveSubVersionID;
      var localJson = tvproui.utils.Storage.get(storageName);
      var storageSubValue = tvproui.utils.Storage.get(storageSubVersion);

      // 本地记录不存在，由网络加载
      if(!localJson)
      {
        return networkData;
      }

      var localData = qx.lang.Json.parse(localJson);

      // 本地记录解析错误，由网络加载
      if(!localData)
      {
        // 否则加载网络数据
        return networkData;
      }

      // 当本地版本更新，则加载本地数据
      //加入判断子版本才可以确认本地替换
      if(localData.editStep >= networkData.editStep)
      {
        if(storageSubValue){
          this._editStep = localData.editStep;
          return localData;
        }
      }
      
      
      // 否则加载网络数据
      return networkData;
    },

    /* 获取新的添加命令 */

    /**
     * TODOC
     *
     * @param ID {var} TODOC
     * @return {var} TODOC
     */
    _getNewDeleteCommand : function(ID) {
      return new tvproui.EPG.editTable.command.DeleteCommand(this, ID);
    },

    // 将编播表保存至网络
    saveNetwork: function(description)
    {
      // 加载编播表
      var epgVersionID = this.getEPGVersionID();

      /* 本地记录EPGVersion */
      var storage = this.saveToObject();

      // 记录操作步骤
      storage.editStep = this._editStep;

      var result = tvproui.AjaxPort.call("epgVersion/saveOfflineEPGColumn", {
        "ID" : epgVersionID,
        "content": tvproui.utils.JSON.stringify(storage),
        "commandList" : this.getCommandList(),
        "description" : description
      });

      if(null === result)
      {
        dialog.Dialog.error("存盘失败!");
        return;
      }

      this._lastSaveStep = this._editStep;

      // 更新本地子版本号记录
      this.setSubVersionID(result);

      this._clearRedoList();
      this._clearUndoList();

      return;
    },

    /* 添加栏目, 时段 */

    /**
     * TODOC
     *
     * @param parentID {var} TODOC
     * @param position {var} TODOC
     * @param name {var} TODOC
     * @param idMaterial {var} TODOC
     * @param noCommit {var} TODOC
     * @return {var} TODOC
     */
    addTVColumn : function(parentID, position, name, idMaterial, noCommit)
    {
      var parent = null;
      var type;
      var beginTime;
      var level;
      if (parentID == 0)
      {
        parent = this.getRoot();
        level = 1;
        type = "栏目";

        /* 如果是根层次下第一个节目，从7:00开播，!!卫视!! */
        if (0 == position) {
          beginTime = tvproui.utils.Time.fromString("07:00:00");
        } else {

          /* 获得前一个节目 */
          var nodeBeforeID = parent.children[position - 1];
          var nodeBefore = this.getNodeByNodeId(nodeBeforeID);
          var nodeBeforeColumnData = nodeBefore.columnData;
          beginTime = nodeBeforeColumnData.endTime.clone();
        }
        if (!idMaterial) {
          idMaterial = 0;
        }
      } else
      {
        parent = this.getNodeByNodeId(parentID);
        level = 2;
        type = "时段";
        var parentRow = parent.columnData;

        /* 如果是栏目下首个子栏目，那么获取父级别的开始时间，否则获取相应位置前一个节目开始时间 */
        if (0 == position) {
          beginTime = parentRow.beginTime.clone();
        } else {
          var nodeBeforeID = parent.children[position - 1];
          var nodeBefore = this.getNodeByNodeId(nodeBeforeID);
          var nodeBeforeRowData = nodeBefore.columnData;
          beginTime = nodeBeforeRowData.endTime.clone();
        }
        if (!idMaterial) {
          idMaterial = parent.columnData.IDMaterial;
        }
      }

      /* 一开始结束时间和开始时间相同 */
      var duration = tvproui.utils.Time.fromOffset(0);
      var endTime = beginTime.clone();
      var defaultStyleMap = tvproui.system.fileManager.getCSSStyle();
      var styleMap = defaultStyleMap[type];
      var row =
      {
        name : name,
        beginTime : beginTime,
        endTime : endTime,
        duration : duration,
        IDMaterial : idMaterial,
        type : type,
        fixed : false,
        level : level,
        spare : "",
        intersection : "",
        durationcalc : "",
        changed : true
      };
      return this.addItem("branch", parentID, position, row, styleMap, noCommit);
    },

    /* 添加素材 */

    /**
     * TODOC
     *
     * @param parentID {var} TODOC
     * @param position {var} TODOC
     * @param IDMaterial {var} TODOC
     * @param name {var} TODOC
     * @param duration {var} TODOC
     * @param type {var} TODOC
     * @param noCommit {var} TODOC
     * @return {var} TODOC
     */
    addMaterial : function(parentID, position, IDMaterial, name, duration, type, noCommit)
    {
      var parent = this.getNodeByNodeId(parentID);
      var beginTime;
      if (position == 0)
      {
        var parentRow = parent.columnData;
        beginTime = parentRow.beginTime.clone();
      } else
      {
        var nodeBeforeID = parent.children[position - 1];
        var nodeBefore = this.getNodeByNodeId(nodeBeforeID);
        var nodeBeforeRowData = nodeBefore.columnData;
        beginTime = nodeBeforeRowData.endTime.clone();
      }
      var endTime = beginTime.add(duration);

      // 根据类型映射默认配置
      var defaultStyleMap = tvproui.system.fileManager.getCSSStyle();
      var styleMap = defaultStyleMap[type];
      var row =
      {
        name : name,
        beginTime : beginTime,
        endTime : endTime,
        duration : duration,
        IDMaterial : IDMaterial,
        type : type,
        fixed : false,
        spare : "",
        level : 3,
        intersection : "",
        durationcalc : "",
        changed : true
      };
      return this.addItem("leaf", parentID, position, row, styleMap, noCommit);
    },

    // 清除所有的变更记录

    /**
     * TODOC
     *
     */
    cleanChanged : function()
    {

      /* 清除更新标记 */
      var children = this.getData();
      for (var childID in children)
      {
        if (parseInt(childID) != childID) {
          continue;
        }
        var child = children[childID];
        if (!child || child.nodeID == 0) {
          continue;
        }
        var columnData = child.columnData;
        columnData.changed = false;
        columnData.spare = "";
        columnData.intersection = "";
        columnData.durationcalc = "";
      }
    },

    // 删除素材统计计数

    /**
     * TODOC
     *
     * @param materialMap {var} TODOC
     * @param ID {var} TODOC
     * @param type {var} TODOC
     * @param loading {var} TODOC
     * @return {void | boolean} TODOC
     */
    removeMaterialCount : function(materialMap, ID, type, loading)
    {
      var count = materialMap[ID];
      if (count == 0)
      {
        dialog.Dialog.error("异常的素材引用计数");
        return;
      }
      materialMap[ID]--;
      if (!loading) {
        this.fireDataEvent("MaterialChange", materialMap);
      }
    },


    /**
     * TODOC
     *
     * @param materialMap {var} TODOC
     * @param node {Node} TODOC
     */
    removeMaterialNode : function(materialMap, node)
    {
      if (node.level == 3)
      {
        var row = node.columnData;
        this.removeMaterialCount(materialMap, row.IDMaterial, row.type);
        return;
      }
      var children = node.children;
      for (var i = 0, l = children.length; i < l; i++)
      {
        var childID = children[i];
        var child = this.getNodeByNodeId(childID);
        this.removeMaterialNode(materialMap, child);
      }
    },

    /**
     * TODOC
     *
     * @param nodeID {var} TODOC
     * @return {void | var} TODOC
     */
    fixAll : function()
    {
      var root = this.getRoot();
      return this._fixAll(root);
    },

    // 从头至尾修复所有时间问题
    _fixAll: function(parent)
    {
      if(!parent)
      {
        parent = this.getRoot();
      }

      var children = parent.children;
      if(!children || children.length == 0)
      {
        return;
      }

      var parsedEnd;
      if(parent.columnData)
      {
        parsedEnd = parent.columnData.beginTime;
      }
      else
      {
        // 必须遍历至最底层节点时间
        var firstChildren = children;
        var firstChild;
        do
        {
           firstChild = this.getNodeByNodeId(firstChildren[0]);
           firstChildren = firstChild.children;
        }while(firstChildren && (firstChildren.length > 0));

        parsedEnd = firstChild.columnData.beginTime;
      }

      for(var i = 0, l = children.length; i < l; i++)
      {
        var childID = children[i];
        var child = this.getNodeByNodeId(childID);
        var columnData = child.columnData;

        if ((!columnData.beginTime.equal(parsedEnd)) && (!columnData.fixed))
        {
          // 登记修改起始时间
          this.updateItemByID(childID, "beginTime", parsedEnd, columnData.beginTime);

          //修改当前项变更标记
          columnData.changed = true;
        }

        this._fixAll(child);

        parsedEnd = columnData.endTime;
      }

      var parentID = parent.nodeID;
      var columnData = parent.columnData;

      // 不能使用上传输下来的时间，而是要使用下层实际的时间进行计算
      var firstChild = this.getNodeByNodeId(children[0]);
      var beginTime = firstChild.columnData.beginTime;

      if(columnData)
      {
        var duration;
        if(parsedEnd.after(beginTime))
        {
          duration = parsedEnd.sub(beginTime);
        }
        else
        {
          duration = beginTime.sub(parsedEnd);
        }

        this.updateItemByID(parentID, "beginTime", beginTime, columnData.beginTime);
        this.updateItemByID(parentID, "duration", duration, columnData.duration);
      }
    },

    /* 需要知道的信息有移动项目ID，目标位置的父级以及目标中的位置 */

    /**
     * TODOC
     *
     * @param nodeID {var} TODOC
     * @param targetParentID {var} TODOC
     * @param targetPosition {var} TODOC
     * @return {void | var} TODOC
     */
    moveItem : function(nodeID, targetParentID, targetPosition)
    {
      var node = this.getNodeByNodeId(nodeID);
      var sourceParentID = node.parentID;
      var sourceParent = this.getNodeByNodeId(sourceParentID);
      
      var sourcePosition = sourceParent.children.indexOf(nodeID);

      // 未发生移动，
      if ((sourceParentID == targetParentID) && (sourcePosition == targetPosition)) {
        return;
      }

      /* 插入并执行删除数据事务 */
      return this.base(arguments, nodeID, targetParentID, targetPosition);
    },

    /* 删除多行内容 */
    /* @arg Object[] itemRowRanges 要被删除的行范围数组， 其中每一个对象都包含minIndex和maxIndex */

    /**
     * TODOC
     *
     * @param itemRowRanges {var} TODOC
     * @return {var} TODOC
     */
    deleteItems : function(itemRowRanges)
    {
      var tree = [];
      this.sectionToTree(itemRowRanges, tree);
      var result = this.base(arguments, itemRowRanges, tree);
      if (result)
      {
        // 清除变更记录
        this.cleanChanged(); 
	     
        // 执行变更
        this.fixAll();

        // 准备提交事务用的描述
        var commitDescription = ["删除 ["];
        for (var i = 0, l = tree.length; i < l; i++)
        {
          var columnData = tree[i].columnData;
          commitDescription.push(columnData.beginTime.toString(), " ", columnData.type, " ", columnData.name, ", ");
        }
        commitDescription.pop();
        commitDescription.push("]");

        // 提交事务
        this.commitTrans(commitDescription.join(""));
      }
      this.check();
      return result;
    },

    /* 删除制定内容 */
    /* @arg int NodeID */

    /**
     * TODOC
     *
     * @param nodeID {var} TODOC
     * @param noCommit {var} TODOC
     * @return {var} TODOC
     */
    deleteItem : function(nodeID, noCommit)
    {

      // 获得节点信息
      var node = this.getNodeByNodeId(nodeID);

      // 真正的删除节点
      var result = this.base(arguments, nodeID);
      if (result && !noCommit)
      {

        // 清除变更记录
        this.cleanChanged();

        // 执行变更
        this.fixAll();

        // 提交事务
        var columnData = node.columnData;
        this.commitTrans(["删除 [", columnData.beginTime.toString(), " ", columnData.type, " ", columnData.name, "]"].join(""));

        // 检查数据完整性
        this.check();
      }
      return result;
    },

    /* 修改数据内容 , 一个值 */

    /**
     * TODOC
     *
     * @param ID {var} TODOC
     * @param colID {var} TODOC
     * @param value {var} TODOC
     * @param oldValue {var} TODOC
     * @param node {Node} TODOC
     * @return {var} TODOC
     */
    updateItemByID : function(ID, colID, value, oldValue, node)
    {

      /* 起始时间 */
      if (!node) {
        node = this.getNodeByNodeId(ID);
      }
      var columnData = node.columnData;
      var result = this.base(arguments, ID, colID, value, oldValue, node);

      switch (colID)
      {

        // 时长变更
        case "beginTime":this.base(arguments, ID, "endTime", value.add(columnData.duration), columnData.endTime);
        break;
        case "duration":this.base(arguments, ID, "endTime", columnData.beginTime.add(value), columnData.endTime);
        break;
        case "type":// 根据类型映射默认配置
        var defaultStyleMap = tvproui.system.fileManager.getCSSStyle();
        node.style = defaultStyleMap[value];
        break;
      }
      return result;
    },

    /* 修改数据内容 , 一个值 */

    /**
     * TODOC
     *
     * @param node {Node} TODOC
     * @param colID {var} TODOC
     * @param value {var} TODOC
     * @param oldValue {var} TODOC
     * @return {boolean | var} TODOC
     */
    updateItem : function(node, colID, value, oldValue)
    {
      var ID = node.nodeID;
      var parent = this.getNodeByNodeId(node.parentID);

      // 清除变更记录
      this.cleanChanged();

      // 父类函数
      var result = this.updateItemByID(ID, colID, value, oldValue);
      if (result)
      {
        var columnData = node.columnData;

        /* 处理TreeColumn */
        switch (colID)
        {

          // 起始时间
          case "beginTime":// 执行变更
            this.fixAll();
            break;

          //  时长
          case "duration":/* 重新计算父级时长 */
            // 执行变更
            var orginFixed = columnData.fixed;
            columnData.fixed = true;
            this.fixAll();
            columnData.fixed = orginFixed;
            break;

          // 取消固定时重新计算时长
          case "fixed":
            if (!columnData.fixed)
            {
              this.fixAll();
            }
            break;
        }

        // 变更提示
        columnData.changed = true;

        // 提交事务
        this.commitTrans(["更新 [", columnData.beginTime.toString(), " ", columnData.type, " ", columnData.name, " ", this.getColumnNameByLevelId(node.level, colID), " 为 ", value, "]"].join(""));
      }
      this.check();
      return result;
    },

    // 进行恢复节点时的引用统计
    restoreNode : function(parentID, position, node)
    {
      var columnData = node.columnData;
      if (columnData.level == 3) {
        this.addMaterialCount(this.materialMap, columnData.IDMaterial, columnData.type);
      }
      return this.base(arguments, parentID, position, node);
    },

    /**
     * TODOC
     *
     * @return {boolean} TODOC
     */
    needSaveVersion : function()
    {
      // 是否是有操作步骤，如果没有操作步骤，则无需保存版本
      if (this._lastSaveStep == this._editStep) {
        return false;
      }

      return true;
    },

    saveState: function()
    {
      /* 本地记录EPGVersion */
        var storageName = "tvpro_epgversion_" + this.getEPGVersionID();
        var storageValue = this.saveToObject();

        // 存储操作步骤计数
        storageValue.editStep = this._editStep;
        tvproui.utils.Storage.set(storageName, tvproui.utils.JSON.stringify(storageValue));
        //存储子版本信息
        var storageSubVersion = "tvpro_epgversion_" + this.getEPGVersionID() + "_" + this.getSubVersionID();
        tvproui.utils.Storage.set(storageSubVersion,tvproui.utils.JSON.stringify(this.getSubVersionID()));
    },

    removeState: function()
    {
      var storageName = "tvpro_epgversion_" + this.getEPGVersionID();
      var storageSubVersion = "tvpro_epgversion_" + this.getEPGVersionID() + "_" + this._lastSaveSubVersionID;
      tvproui.utils.Storage.remove(storageName);
      tvproui.utils.Storage.remove(storageSubVersion);
    },

    commitTrans : function(description)
    {
      this.base(arguments, description);

      // 存储操作步骤计数
      this._editStep++;
      this.saveState();
    },

    undo : function()
    {
      this.base(arguments);

      // 存储操作步骤计数
      this._editStep++;
      this.saveState();
    },

    redo: function()
    {
      this.base(arguments);

      // 存储操作步骤计数
      this._editStep++;
      this.saveState();
    },

    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    getCommandList : function()
    {
      var undoList = this.getUndoList();
      var descriptions = [];
      descriptions.length = undoList.getLength();
      for (var i = 0, l = descriptions.length; i < l; i++)
      {
        var command = undoList.getItem(i);
        descriptions[i] = command.getDescription();
      }
      descriptions.shift();
      return tvproui.utils.JSON.stringify(descriptions);
    }
  }
});
