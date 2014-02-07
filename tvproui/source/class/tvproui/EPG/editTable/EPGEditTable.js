
/**
 * @author Administrator
 */

/* ************************************************************************
#asset(qx/icon/${qx.icontheme}/22/actions/*)
#asset(qx/icon/${qx.icontheme}/22/devices/*)
#asset(qx/icon/${qx.icontheme}/22/categories/*)
#asset(tvproui/type/*)
#asset(tvproui/epg/*)
#asset(tvproui/selection/*)
************************************************************************ */
qx.Class.define("tvproui.EPG.editTable.EPGEditTable",
{
  extend : tvproui.EPG.viewTable.EPGViewTable,
  statics : {


    /**
     * TODOC
     *
     * @param typeName {var} TODOC
     * @return {var} TODOC
     */
    getMaterialTypeSelector : function(typeName)
    {
      var typeCellEditor = new tvproui.control.ui.spanTable.celleditor.SelectBox();
      var types = tvproui.system.fileManager.getSelectorData();
      if (typeName) {
        for (var i = 0, l = types.length; i < l; i++)
        {
          var type = types[i];
          if (type[0] == typeName)
          {
            typeCellEditor.setListData([type]);
            break;
          }
        }
      } else {
        typeCellEditor.setListData(types);
      }
      return typeCellEditor;
    }
  },

  construct : function(model, parentWindow)
  {
    this.base(arguments, model);
    var table = this._table;
    this._parentWindow = parentWindow;
    table.addListener("dataEdited", this._onDataEdited, this);
    table.addListener("cellClick", this._switchState, this);

    /* 初始化拖出 */
    this._initDrag();

    /* 初始化放置 */
    this._initDrop();
  },
  members :
  {

    // 父窗口
    _parentWindow : null,
    _addEntry : null,
    _deleteEntry : null,
    _cutEntry : null,
    _copyEntry : null,
    _pasteEntry : null,
    _mergeEntry : null,
    _splitEntry: null,

    _selectionEntry : null,
    _lastColumnRow : null,
    _historyBox : null,
    _selectionList : null,

    _lastCol: null,
    _lastRow: null,

    /* 初始化拖出 */

    /**
     * TODOC
     *
     */
    _initDrag : function()
    {
      var table = this._table;
      table.setDraggable(true);

      //描述拖出数据范围，描述操作为复制
      table.addListener("dragstart", function(e)
      {
        e.addType("EPG");
        e.addAction("move");
      }, this);


      /*
      var columnButton = this._table.getChildControl("column-button");
      var statusbar = this._table.getChildControl("statusbar");

      columnButton.addListener("mousemove", function(e)
      {
          var scroller = table.getPaneScroller(1);
          scroller.setScrollY(scroller.getScrollY() - 10);
      }, this);

      statusbar.addListener("mousemove", function(e)
      {
          var scroller = table.getPaneScroller(1);
          scroller.setScrollY(scroller.getScrollY() + 10);
      }, this);
      */
      //拖动请求，准备数据格式
      table.addListener("droprequest", function(e)
      {
        if (this._table.isEditing()) {
          this._table.stopEditing();
        }
        var table = this._table;
        var action = e.getCurrentAction();
        var type = e.getCurrentType();
        if (type != "EPG") {
          return;
        }
        if (action != "move") {
          return;
        }
        var selections = table.getSelectionModel().getSelectedRanges();
        if (selections.length == 0) {
          return;
        }

        // 增加数据
        e.addData(type, selections);
      }, this);
    },

    /* 初始化拖放 */

    /**
     * TODOC
     *
     */
    _initDrop : function()
    {
      var table = this._table;
      table.setDroppable(true);
      table.setFocusCellOnMouseMove(true);
      table.addListener("drop", function(e)
      {
        if (this._table.isEditing()) {
          this._table.stopEditing();
        }

        // 锁定状态不处理
        var model = this._dataModel;
        var type = e.supportsType("resourceTree");
        if (type)
        {
          this._onDropResourceTreeNode(table, e);
          return;
        }
        type = e.supportsType("material");
        if (type)
        {
          var materials = e.getData("material");
          if (materials.length == 0) {
            return;
          }
          this._addMaterial(materials);
          return;
        }
        type = e.supportsType("EPG");
        if (type)
        {
          var selections = e.getData("EPG");
          if (e._native.ctrlKey) {
            this._copyEPG(model.copyTree(selections));
          } else {
            this._moveEPG(model.sectionToTree(selections));
          }
          return;
        }
        dialog.Dialog.error("拖放类型不支持");
      }, this);
    },


    /**
     * TODOC
     *
     * @param materials {var} TODOC
     */
    _addMaterial : function(materials)
    {
      var table = this._table;
      var model = table.getTableModel();

      var focusRow = table.getFocusedRow();
      var focusCol = table.getFocusedColumn();
      if ((!materials) || (materials.length == 0))
      {
        dialog.Dialog.error("没有有效的素材，无法增加素材");
        return;
      }
      if ((null == focusRow) || (focusRow >= this._dataModel.getRowCount())) {
        return;
      }
      var focusID = this.__getProperNode(focusCol, focusRow);
      if (null === focusID)
      {
        dialog.Dialog.error("素材没有合适的拖放目标，请先拖入资源结构中的栏目，再进行操作");
        return;
      }
      var foucsNode = model.getNodeByNodeId(focusID);
      var parentID;
      var position;

      // 清除变更记录
      model.cleanChanged();

      /* 根据层次来决定如何加入素材到树上 */
      switch (foucsNode.level)
      {

        /* 选定层次为栏目，自动新建一个时段 */
        case 1:
          var columnID = foucsNode.nodeID;
          var periodPosition = foucsNode.children.length;
          parentID = model.addTVColumn(columnID, periodPosition, materials[0].name);
          if (!parentID)
          {
            dialog.Dialog.error("创建时段失败!");
            return;
          }

          //肯定是首位了
          position = 0;
          break;

        /* 选定层次为时段 */
        case 2:
          // 放在时段名称上面，则在时段下增加新时段
          if (focusCol == 2)
          {

            // 获得当前时段的父节点, 位置
            var columnID = foucsNode.parentID;
            var column = model.getNodeByNodeId(columnID);
            var periodPosition = column.children.indexOf(focusID) + 1;
            parentID = model.addTVColumn(columnID, periodPosition, materials[0].name);

            //肯定是首位了
            position = 0;
          } 
          else
          {
            parentID = foucsNode.nodeID;
            position = 0;

            /* 将素材加入时段首部  */
          }
          break;

        /* 选定层次为素材  */
        case 3:
          parentID = foucsNode.parentID;
          var parent = model.getNodeByNodeId(parentID);
          
          position = parent.children.indexOf(foucsNode.nodeID) + 1;

          /* 素材加入当前选中素材位置后面  */
          break;
        default :
          return;
          break;
      }

      /* 循环将素材加入编播表 */
      var insertNodesID = [];
      for (var i = 0, l = materials.length; i < l; i++)
      {
        var material = materials[i];
        insertNodesID.push(model.addMaterial(parentID, position + i, material.ID, material.name, material.duration, material.type));
      }

      // 执行修订
      model.fixAll();

      // 提交更新
      var commitDescription = ["增加  ["];
      for (var i = 0, l = insertNodesID.length; i < l; i++)
      {
        var ID = insertNodesID[i];
        var node = model.getNodeByNodeId(ID);
        var rowData = node.columnData;
        commitDescription.push(rowData.beginTime.toString(), " ", rowData.type, " ", rowData.name, ", ");
      }

      commitDescription.pop();
      commitDescription.push("]");

      // 提交事务
      model.commitTrans(commitDescription.join(""));

      // 进行检查
      model.check();

      // 清理选中区域
      var selectionModel = this._selectionModel;
      selectionModel.resetSelection();

      for (var i = 0, l = insertNodesID.length; i < l; i++)
      {
        var ID = insertNodesID[i];
        var node = model.getNodeByNodeId(ID);
        // 修改selection
        var row = model.getRowFromNodeId(ID);
        selectionModel.addSelectionInterval(row, row, node.level, node.level);
      }
      
    },

    // 处理资源树节点的拖动

    /**
     * TODOC
     *
     * @param table {var} TODOC
     * @param e {Event} TODOC
     */
    _onDropResourceTreeNode : function(table, e)
    {
      var count = 1;

      /* 获取插入点位置 */
      var model = this._dataModel;

      // 清除变更记录
      model.cleanChanged();
      var focusRow = table.getFocusedRow();
      var focusCol = table.getFocusedColumn();
      var position;

      // 如果聚焦节点不存在，或者异常，那么加在最后一位
      if ((null == focusRow) || (focusRow >= model.getRowCount()))
      {
        position = model.getRowCount();
        count = 0;
      } else
      {

        // 焦点存在，根据焦点项目决定位置
        var focusColumn = this.getLevelItem(focusRow, 1);
        if (focusColumn)
        {
          var root = model.getRoot();
          position = root.children.indexOf(focusColumn.nodeID);
        } else
        {
          position = 0;
          count = 0;
        }
      }
      var treeNodes = e.getData("resourceTree");
      var length = treeNodes.getLength();
      if (0 == length)
      {
        dialog.Dialog.error("没有有效的源节点，无法完成栏目创建");
        return;
      }
      var columnNames = [];
      var insertNodes = [];
      for (var i = 0, l = length; i < l; i++)
      {
        var node = treeNodes.getItem(i);
        switch (node.getType())
        {
          case "channel":var children = node.getChildren();
          for (var j = 0, len = children.getLength(); j < len; j++)
          {
            var child = children.getItem(j);
            insertNodes.push(model.addTVColumn(0, position + (count++), child.getName(), null, child.getID()));
          }
          break;
          case "column":insertNodes.push(model.addTVColumn(0, position + (count++), node.getName(), null, node.getID()));
          break;
        }
      }

      // 执行修订
      model.fixAll();

      // 提交更新
      var commitDescription = ["增加  ["];
      for (var i = 0, l = insertNodes.length; i < l; i++)
      {
        var rowData = model.getNodeByNodeId(insertNodes[i]).columnData;
        commitDescription.push(rowData.beginTime.toString(), " ", rowData.type, " ", rowData.name, ", ");
      }
      commitDescription.pop();
      commitDescription.push("]");

      // 提交事务
      model.commitTrans(commitDescription.join(""));

      // 进行检查
      model.check();

      // 清理选中区域
      var selectionModel = this._selectionModel;
      selectionModel.resetSelection();

      // 调整 selection
      for (var i = 0, l = insertNodes.length; i < l; i++)
      {
        var ID = insertNodes[i];
        var node = model.getNodeByNodeId(ID);
        var row = model.getRowFromNodeId(ID);
        selectionModel.addSelectionInterval(row, row, node.level, node.level);
      }
    },


    /**
     * TODOC
     *
     * @param col {var} TODOC
     * @param row {var} TODOC
     * @return {var} TODOC
     */
    __getProperNode : function(col, row)
    {
      var destID = null;
      var model = this._dataModel;
      if (col == 0) {
        col = 1;
      }
      do {
        destID = model.getNodeID(col--, row);
      }while (null == destID);
      return destID;
    },

    /* 移动EPG项目处理 */

    /**
     * TODOC
     *
     * @param EPGs {var} TODOC
     */
    _moveEPG : function(EPGs)
    {
      var table = this._table;
      var model = this._dataModel;
      var focusRow = table.getFocusedRow();
      var focusCol = table.getFocusedColumn();
      var selectionModel = this._selectionModel;
      selectionModel.resetSelection();
      if ((null == focusRow) || (focusRow >= model.getRowCount())) {
        return;
      }

      // 清除变更记录
      model.cleanChanged();

      var orginBeginTimes = [];

      /* 现在知道选中的目标节点，循环当前需要移动的源节点 */
      for (var i = 0, l = EPGs.length; i < l; i++)
      {
        var sourceItem = EPGs[i];
        var sourceID = sourceItem.nodeID;
        var sourceParentID = sourceItem.parentID;
        var destID = this.__getProperNode(focusCol, focusRow);
        var isMoveUP = sourceItem.row > focusRow;
        var parentID;
        var position;
        switch (sourceItem.level)
        {

          /* 栏目: 将栏目移动到目标栏目/目标所处栏目之后 */
          case 1:
            var beforeColumn = this.getLevelItemByID(destID, 1);
            if (null == beforeColumn)
            {
              dialog.Dialog.error("找不到合适的前向节点");
              continue;
            }

            var beforeColumnParent = model.getNodeByNodeId(beforeColumn.parentID);
            parentID = beforeColumn.parentID;
            position = beforeColumnParent.children.indexOf(destID);
            break;

          /* 时段: 目标位时段/素材，将时段移动到相应时段之后，目标为栏目则移动到栏目之首 */
          case 2:/* 获取目标位置的前一个时段 */
            var beforePeriod = this.getLevelItemByID(destID, 2);

            /* 未获取到，则查找第一个栏目，并且移动到相应栏目之后 */
            if (null == beforePeriod)
            {
              var focusColumn = this.getLevelItemByID(destID, 1);
              if (null == focusColumn)
              {
                dialog.Dialog.error("找不到合适栏目节点进行移动");
                continue;
              }

              parentID = focusColumn.nodeID;
              position = 0;
            }
            else
            {
              /* 或得到则移动到选定目标之后 */
              parentID = beforePeriod.parentID;
              var beforePeriodParent = model.getNodeByNodeId(parentID);
              var beforePeriodPosition = beforePeriodParent.children.indexOf(destID);
              position = beforePeriodPosition + (isMoveUP ? 0 : (sourceParentID == parentID ? 0 : 1));
            }
            break;

          /* 素材: 目标为素材, 移动到素材之后，目标为时段，作为时段中首个素材，目标位栏目，在栏目最后新建时段，并将素材移入 */
          case 3:
            /* 获取目标位置的前一个素材 */
            var beforeMaterial = this.getLevelItemByID(destID, 3);
            if (null == beforeMaterial)
            {
              var focusPeriod = this.getLevelItemByID(destID, 2);
              if (focusPeriod == null)
              {

                // 如果放置目标为栏目
                var focusColumn = this.getLevelItemByID(destID, 1);
                var columnID = focusColumn.nodeID;
                var periodPosition = focusColumn.children.length;
                parentID = model.addTVColumn(columnID, periodPosition, sourceItem.columnData.name);
              } else
              {

                // 放在时段名称上面，则在时段下增加新时段
                if (focusCol == 2)
                {

                  // 获得当前时段的父节点, 位置
                  var columnID = focusPeriod.parentID;
                  var column = model.getNodeByNodeId(columnID);
                  
                  var periodPosition = column.children.indexOf(destID) + 1;
                  parentID = model.addTVColumn(columnID, periodPosition, sourceItem.columnData.name);
                } else
                {
                  parentID = focusPeriod.nodeID;
                }
              }
              position = 0;
            } else
            {

              /* 或得到则移动到选定目标之后 */
              parentID = beforeMaterial.parentID;
              var beforeMaterialParent = model.getNodeByNodeId(parentID);
              var beforeMaterialPosition = beforeMaterialParent.children.indexOf(destID);
              position = beforeMaterialPosition + (isMoveUP ? 0 : (sourceParentID == parentID ? 0 : 1));
            }
            break;
        }
        model.moveItem(sourceID, parentID, position);
        model.setData();
        focusRow = model.getRowFromNodeId(sourceID) + (isMoveUP ? 1 : 0);
        orginBeginTimes.push(sourceItem.columnData.beginTime.toString());
      }

      // 执行变更
      model.fixAll();

      // 提交更新
      var commitDescription = ["移动  ["];
      for (var i = 0, l = EPGs.length; i < l; i++)
      {
        var sourceRowData = EPGs[i].columnData;
        commitDescription.push(orginBeginTimes[i], " ", sourceRowData.type, " ", sourceRowData.name, " 至 ", sourceRowData.beginTime.toString(), ", ");
      }
      commitDescription.pop();
      commitDescription.push("]");

      // 提交事务
      model.commitTrans(commitDescription.join(""));

      // 进行检查
      model.check();

      // 恢复选中
      for (var i = 0, l = EPGs.length; i < l; i++)
      {
        var node = EPGs[i];
        var row = model.getRowFromNodeId(node.nodeID);
        selectionModel.addSelectionInterval(row, row, node.level, node.level);
      }
    },


    /**
     * TODOC
     *
     * @param EPGs {var} TODOC
     */
    _copyEPG : function(EPGs)
    {
      var table = this._table;
      var model = this._dataModel;
      var focusRow = table.getFocusedRow();
      var focusCol = table.getFocusedColumn();

      if(undefined === focusRow)
      {
        focusRow = this._lastRow;
      }

      if(undefined === focusCol)
      {
        focusCol = this._lastCol;
      }

      var selectionModel = this._selectionModel;
      var insertNodes = [];
      selectionModel.resetSelection();
      if ((null == focusRow) || (focusRow >= model.getRowCount())) {
        return;
      }

      // 清除变更记录
      model.cleanChanged();

      /* 现在知道选中的目标节点，循环当前需要拷贝的源节点 */
      for (var i = 0, l = EPGs.length; i < l; i++)
      {
        var sourceItem = EPGs[i];
        var sourceID = sourceItem.nodeID;
        var sourceParentID = sourceItem.parentID;
        var sourceColumn = sourceItem.columnData;
        var destID = this.__getProperNode(focusCol, focusRow);
        var isMoveUP = sourceItem.row > focusRow;
        var parentID;
        var position;
        switch (sourceItem.level)
        {

          /* 栏目: 将栏目拷贝到目标栏目/目标所处栏目之后 */
          case 1:
          var beforeColumn = this.getLevelItemByID(destID, 1);
          if (null == beforeColumn)
          {
            dialog.Dialog.error("找不到合适的前向节点");
            continue;
          }

          parentID = beforeColumn.parentID;
          var beforeColumnParent = model.getNodeByNodeId(parentID);
          position = beforeColumnParent.children.indexOf(destID);
          sourceID = model.addTVColumn(parentID, position, sourceColumn.name, sourceColumn.IDMaterial);
          this.copySubItems(sourceID, sourceItem.children);
          break;

          /* 时段: 目标位时段/素材，将时段移动到相应时段之后，目标为栏目则移动到栏目之首 */
          case 2:/* 获取目标位置的前一个时段 */
            var beforePeriod = this.getLevelItemByID(destID, 2);

            /* 未获取到，则查找第一个栏目，并且移动到相应栏目之后 */
            if (null == beforePeriod)
            {
              var focusColumn = this.getLevelItemByID(destID, 1);
              if (null == focusColumn)
              {
                dialog.Dialog.error("找不到合适栏目节点进行移动");
                continue;
              }
              parentID = focusColumn.nodeID;
              position = 0;
            } else
            {

              /* 或得到则移动到选定目标之后 */
              parentID = beforePeriod.parentID;
              var beforePeriodParent = model.getNodeByNodeId(parentID);
              
              var beforePeriodPosition = beforePeriodParent.children.indexOf(destID);
              position = beforePeriodPosition + (isMoveUP ? 0 : 1);
            }
            sourceID = model.addTVColumn(parentID, position, sourceColumn.name, sourceColumn.IDMaterial);
            this.copySubItems(sourceID, sourceItem.children);
            break;

          /* 素材: 目标为素材, 移动到素材之后，目标为时段，作为时段中首个素材，目标位栏目，在栏目最后新建时段，并将素材移入 */
          case 3:/* 获取目标位置的前一个素材 */
            var beforeMaterial = this.getLevelItemByID(destID, 3);
            if (null == beforeMaterial)
            {
              var focusPeriod = this.getLevelItemByID(destID, 2);
              if (focusPeriod == null)
              {

                // 如果放置目标为栏目
                var focusColumn = this.getLevelItemByID(destID, 1);
                var columnID = focusColumn.nodeID;
                var periodPosition = focusColumn.children.length;
                parentID = model.addTVColumn(columnID, periodPosition, sourceItem.columnData.name);
              } else
              {

                // 放在时段名称上面，则在时段下增加新时段
                if (focusCol == 2)
                {

                  // 获得当前时段的父节点, 位置
                  var columnID = focusPeriod.parentID;
                  var column = model.getNodeByNodeId(columnID);
                  
                  var periodPosition = column.children.indexOf(destID) + 1;
                  parentID = model.addTVColumn(columnID, periodPosition, sourceItem.columnData.name);
                } else
                {
                  parentID = focusPeriod.nodeID;
                }
              }
              position = 0;
            } else
            {

              /* 或得到则移动到选定目标之后 */
              parentID = beforeMaterial.parentID;
              var beforeMaterialParent = model.getNodeByNodeId(parentID);
              var beforeMaterialPosition = beforeMaterialParent.children.indexOf(destID);
              position = beforeMaterialPosition + (isMoveUP ? 0 : 1);
            }
            sourceID = model.addMaterial(parentID, position, sourceColumn.IDMaterial, sourceColumn.name, sourceColumn.duration, sourceColumn.type);
          break;
        }
        model.setData();
        focusRow = model.getRowFromNodeId(sourceID) + (isMoveUP ? 1 : 0);
        insertNodes.push(model.getNodeByNodeId(sourceID));
      }

      // 执行变更
      model.fixAll();

      // 提交更新
      var commitDescription = ["拷贝  ["];
      for (var i = 0, l = insertNodes.length; i < l; i++)
      {
        var EPGRowData = EPGs[i].columnData;
        var sourceRowData = insertNodes[i].columnData;
        commitDescription.push(EPGRowData.beginTime.toString(), " ", sourceRowData.type, " ", sourceRowData.name, " 至 ", sourceRowData.beginTime.toString(), ", ");
      }
      commitDescription.pop();
      commitDescription.push("]");

      // 提交事务
      model.commitTrans(commitDescription.join(""));

      // 进行检查
      model.check();

      // 恢复选中
      for (var i = 0, l = insertNodes.length; i < l; i++)
      {
        var node = insertNodes[i];
        var row = model.getRowFromNodeId(node.nodeID);
        selectionModel.addSelectionInterval(row, row, node.level, node.level);
      }
    },

    /* 初始化工具栏 */

    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    _initToolBar : function()
    {
      var result = this.base(arguments);
      var actionPart = this._actionPart;

      // 流程分段
      var toolbar = this._toolbar;

      /* 工具栏的编辑分段 */
      var editPart = new qx.ui.toolbar.Part();
      this._editPart = editPart;
      toolbar.addAt(editPart, 0);

      /* 加入接续按钮到检查分段中 */
      var flowMenu = new qx.ui.menu.Menu();
      var flowButton = new qx.ui.toolbar.MenuButton("工具", "icon/22/apps/office-project.png", flowMenu);
      editPart.add(flowButton);

      /* "增加" 栏目，时段 */
      /* "增加"菜单，可以用于增加栏目，时段以及修改添加方向 */
      var addMenu = new qx.ui.menu.Menu();

      var addColumnButton = new qx.ui.menu.Button("栏目", "icon/22/actions/format-justify-fill.png");
      addColumnButton.addListener("execute", this._onAddColumnButton, this);
      var addPeriodButton = new qx.ui.menu.Button("时段", "icon/22/actions/format-indent-more.png");
      addPeriodButton.addListener("execute", this._onAddPeriodButton, this);
      this._addDirection = new qx.ui.menu.CheckBox("向前添加");

      addMenu.add(addColumnButton);
      addMenu.add(addPeriodButton);
      addMenu.add(this._addDirection);

      // 增加按钮
      var addButton = new qx.ui.toolbar.MenuButton("增加", "icon/22/actions/list-add.png", addMenu);
      editPart.add(addButton);

      /* 加入删除按钮到编辑分段中 */
      this._deleteButton = new qx.ui.toolbar.Button("删除", "icon/22/actions/list-remove.png");
      this._deleteButton.addListener("execute", this._onDeleteButton, this);
      editPart.add(this._deleteButton);

      var replaceMaterialButton = new qx.ui.menu.Button("全局素材替换", "tvproui/process/replace.png");
      replaceMaterialButton.addListener("execute", this._onReplaceMaterialButton, this);
      flowMenu.add(replaceMaterialButton);
      var replaceStringButton = new qx.ui.menu.Button("全局替换文本", "icon/22/actions/edit-find.png");
      replaceStringButton.addListener("execute", this._onReplaceStringButton, this);
      flowMenu.add(replaceStringButton);
      var repairPairButton = new qx.ui.menu.Button("数据修复", "icon/22/actions/edit-find.png");
      repairPairButton.addListener("execute", this._onRepairButton, this);
      flowMenu.add(repairPairButton);
      var durationNameMenu = new qx.ui.menu.Menu;
      var durationNameFromBeginButton = new qx.ui.menu.Button("作为起点", "tvproui/epg/start.png");
      var durationNameContinueButton = new qx.ui.menu.Button("继续编号", "tvproui/epg/continue.png");
      durationNameMenu.add(durationNameFromBeginButton);
      durationNameMenu.add(durationNameContinueButton);
      durationNameFromBeginButton.addListener("execute", this._onDurationNameFromBeginButton, this);
      durationNameContinueButton.addListener("execute", this._onDurationNameContinueButton, this);
      var durationNamingButton = new qx.ui.menu.Button("时段编号", "tvproui/epg/time.png", null, durationNameMenu);
      flowMenu.add(durationNamingButton);

      /* 监听事件决定是否启用删除按钮 */
      var undoList = this._dataModel.getUndoList();
      this._historyBox = new qx.ui.form.VirtualSelectBox(undoList).set( {
        labelPath : "description"
      });
      this._historyBox.bind("selection[0].description", this._historyBox, "toolTipText", null);

      var delegate = {
        bindItem : function(controller, item, id)
        {
          controller.bindDefaultProperties(item, id);
          controller.bindProperty("description", "toolTipText", null, item, id);
        }
      };

      this._historyBox.setDelegate(delegate);
      editPart.add(this._historyBox);
      this._historyBox.setWidth(250);
      undoList.addListener("change", this._onUndoAdd, this);
      
      this._selectionList = new qx.data.Array();
      this._historyBox.setSelection(this._selectionList);

      //加入撤销按钮到编辑分段中
      var undoCommand = new qx.ui.core.Command("Ctrl+Z");
      this._undoButton = new qx.ui.toolbar.Button("撤销", "icon/22/actions/edit-undo.png", undoCommand);
      this._undoButton.addListener("execute", this._onUndoButton, this);
      editPart.add(this._undoButton);

      /* 加入保存按钮到编辑分段中 */
      var saveButton = new qx.ui.toolbar.Button("保存", "icon/22/actions/document-save.png");
      saveButton.addListener("execute", this._onSaveButton, this);
      editPart.add(saveButton);

      // 监听事件决定是否启用撤销按钮
      this._dataModel.addListener("canUndo", this._onUndoListLengthChange, this);
      return result;
    },

    /* 初始化 列渲染器 */

    /**
     * TODOC
     *
     * @param columnModel {var} TODOC
     */
    _initTableColumnRender : function(columnModel)
    {
      this.base(arguments, columnModel);
      columnModel.setCellEditorFactory(3, new tvproui.control.ui.table.celleditor.TimeCellEditor());
      columnModel.setCellEditorFactory(5, new tvproui.control.ui.table.celleditor.TimeCellEditor());

      // 初始化节目名称素材选择
      var materialSelector = new tvproui.EPG.editTable.MaterialSelector();
      materialSelector.setUserData("channelID", this._dataModel.getChannelID());
      columnModel.setCellEditorFactory(6, materialSelector);
      columnModel.setCellEditorFactory(7, new tvproui.control.ui.table.celleditor.TimeCellEditor());
      columnModel.setCellEditorFactory(8, tvproui.EPG.editTable.EPGEditTable.getMaterialTypeSelector());
    },


    /**
     * TODOC
     *
     */
    _initContextMenu : function()
    {

      /* 增加菜单，可以用于增加栏目，时段以及修改添加方向 */
      var addMenu = new qx.ui.menu.Menu();
      var addColumnButton = new qx.ui.menu.Button("栏目", "icon/22/actions/format-justify-fill.png");
      var addPeriodButton = new qx.ui.menu.Button("时段", "icon/22/actions/format-indent-more.png");
      addMenu.add(addColumnButton);
      addMenu.add(addPeriodButton);
      addColumnButton.addListener("execute", this._onAddColumnButton, this);
      addPeriodButton.addListener("execute", this._onAddPeriodButton, this);
      var addEntry = new qx.ui.menu.Button("增加", "icon/22/actions/list-add.png", null, addMenu);
      this._addEntry = addEntry;

      // 删除按钮
      var deleteEntry = new qx.ui.menu.Button("删除", "icon/22/actions/list-remove.png");
      deleteEntry.addListener("execute", this._onDeleteButton, this);
      this._deleteEntry = deleteEntry;

      // 剪切按钮
      var cutEntry = new qx.ui.menu.Button("剪切", "icon/22/actions/edit-cut.png");
      cutEntry.addListener("execute", this._onCutButton, this);
      this._cutEntry = cutEntry;

      // 复制按钮
      var copyEntry = new qx.ui.menu.Button("复制", "icon/22/actions/edit-copy.png");
      copyEntry.addListener("execute", this._onCopyButton, this);
      this._copyEntry = copyEntry;

      // 粘贴按钮
      var pasteEntry = new qx.ui.menu.Button("粘贴", "icon/22/actions/edit-paste.png");
      pasteEntry.addListener("execute", this._onPasteButton, this);
      this._pasteEntry = pasteEntry;

      // 合并按钮
      var mergeEntry = new qx.ui.menu.Button("合并", "icon/22/actions/window-new.png");
      mergeEntry.addListener("execute", this._onMergeButton, this);
      this._mergeEntry = mergeEntry;

      // 拆分按钮
      var splitEntry = new qx.ui.menu.Button("拆分", "icon/22/categories/utilities.png");
      splitEntry.addListener("execute", this._onSplitButton, this);
      this._splitEntry = splitEntry;

      // 继承父类
      this.base(arguments);
    },

    // 菜单处理

    /**
     * TODOC
     *
     * @param col {var} TODOC
     * @param row {var} TODOC
     * @param table {var} TODOC
     * @param dataModel {var} TODOC
     * @param contextMenu {var} TODOC
     * @return {boolean} TODOC
     */
    _contextMenuHandler : function(col, row, table, dataModel, contextMenu)
    {
      var dataModel = this._dataModel;
      contextMenu.add(this._addEntry);

      contextMenu.add(this._deleteEntry);
      contextMenu.add(this._cutEntry);

      contextMenu.add(this._copyEntry);
      contextMenu.add(this._pasteEntry);
      contextMenu.add(this._mergeEntry);
      contextMenu.add(this._splitEntry);

      this._lastCol = col;
      this._lastRow = row;

      return this.base(arguments, col, row, table, dataModel, contextMenu);
    },


    /**
     * 根据选中目标加载素材
     *
     * @param e {Event} TODOC
     */
    _onSelectionChanged : function(e)
    {
      this.base(arguments, e);

      // 开启删除按钮
      this._deleteButton.setEnabled(e.getTarget().getSelectedCount() > 0);
    },

    /**
     * 添加栏目
     *
     * @param e {Event} TODOC
     */
    _onAddColumnButton : function(e)
    {
      var model = this._dataModel;

      // 清理变更记录
      model.cleanChanged();
      var nodeID = this.addColumn("新栏目");

      // 执行变更
      model.fixAll();

      // 提交更新
      var node = model.getNodeByNodeId(nodeID);

      // 提交事务
      model.commitTrans("增加 [" +node.columnData.beginTime.toString() + " 新栏目]");

      // 进行检查
      model.check();

      // 清理选中区域, 调整选中范围
      var selectionModel = this._selectionModel;
      selectionModel.resetSelection();
      var row = model.getRowFromNodeId(nodeID);
      selectionModel.addSelectionInterval(row, row, node.level, node.level);
    },

    /* 添加时段 */

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onAddPeriodButton : function(e)
    {
      var model = this._dataModel;

      // 清理变更记录
      model.cleanChanged();
      var nodeID = this.addPeriod("新时段");

      // 执行变更
      model.fixAll();

      // 提交更新
      var node = model.getNodeByNodeId(nodeID);

      // 提交事务
      model.commitTrans("增加 [" + node.columnData.beginTime.toString() + " 新时段]");

      // 进行检查
      model.check();

      // 清理选中区域, 调整选中范围
      var selectionModel = this._selectionModel;
      selectionModel.resetSelection();
      var row = model.getRowFromNodeId(nodeID);
      selectionModel.addSelectionInterval(row, row, node.level, node.level);
    },

    /**
     * TODOC
     *
     * @param label {var} TODOC
     * @return {void | var} TODOC
     */
    addColumn : function(label)
    {

      /* 获取选中栏目层级节点 */
      var model = this._dataModel;
      var columnRow = this.getSelectedItem(1);
      if (!columnRow)
      {
        dialog.Dialog.error("请选择添加位置");
        return;
      }

      var root = model.getRoot();
      var parentID = root.nodeID;
      var position = root.children.indexOf(columnRow.nodeID);

      /* 获取方向 */
      var reserveDirection = this._addDirection.getValue();
      if (!reserveDirection) {
        position++;
      }

      return model.addTVColumn(parentID, position, label);
    },

    /**
     * TODOC
     *
     * @param label {var} TODOC
     * @return {void | var} TODOC
     */
    addPeriod : function(label)
    {

      /* 获取选中栏目层级节点 */
      var model = this._dataModel;
      var columnRow = this.getSelectedItem(1);
      if (!columnRow)
      {
        dialog.Dialog.error("请选择添加位置");
        return;
      }
      var periodRow = this.getSelectedItem(2);
      var parentID = columnRow.nodeID;
      var position;
      var columnNode = model.getNodeByNodeId(parentID);
      if (periodRow)
      {
        position = columnNode.children.indexOf(periodRow.nodeID);

        /* 获取方向 */
        var reserveDirection = this._addDirection.getValue();
        if (!reserveDirection) {
          position++;
        }
      } else
      {
        position = columnNode.children.length;
      }
      return model.addTVColumn(parentID, position, label);
    },

    /* 当按下删除按钮 */

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onDeleteButton : function(e)
    {

      /* 根据选择范围来删除 */
      var selectionModel = this._table.getSelectionModel();
      var selections = selectionModel.getSelectedRanges();
      this._dataModel.deleteItems(selections);

      /* 清除选区 */
      selectionModel.resetSelection();
      var table = this._table;
      var rowCount = this._dataModel.getRowCount();
      if (rowCount > 0) {
        table.setFocusedCell(table.getFocusedColumn(), rowCount - 1);
      } else {
        table.setFocusedCell(null, null);
      }
    },

    /* 剪切 */

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onCutButton : function(e)
    {

      /* 停止编辑行为 */
      if (this._table.isEditing()) {
        this._table.stopEditing();
      }

      /* 决定复制项目 */
      var model = this._dataModel;
      var selectionModel = this._table.getSelectionModel();
      var selections = selectionModel.getSelectedRanges();
      if (selections.length == 0) {
        return;
      }
      var copyData = model.copyTree(selections);
      tvproui.utils.Clipper.putInto("EPG", copyData);

      /* 根据选择范围来删除 */
      this._dataModel.deleteItems(selections);

      /* 清除选区 */
      selectionModel.resetSelection();
    },

    /* 复制 */

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onCopyButton : function(e)
    {

      /* 停止编辑行为 */
      if (this._table.isEditing()) {
        this._table.stopEditing();
      }

      /* 决定复制项目 */
      var model = this._dataModel;
      var selectionModel = this._table.getSelectionModel();
      var selections = selectionModel.getSelectedRanges();
      if (selections.length == 0) {
        return;
      }
      var copyData = model.copyTree(selections);
      tvproui.utils.Clipper.putInto("EPG", copyData);
    },

    // 拷贝子项

    /**
     * TODOC
     *
     * @param parentID {var} TODOC
     * @param children {var} TODOC
     */
    copySubItems : function(parentID, children)
    {
      if (!children) {
        return;
      }
      var model = this._dataModel;
      var parent = model.getNodeByNodeId(parentID);
      for (var i = 0, l = children.length; i < l; i++)
      {
        var item = children[i];
        var row = item.columnData;
        var subChildren = children[i].children;
        switch (item.level)
        {
          case 2:
            var childID = model.addTVColumn(parentID, i, row.name, row.IDMaterial);
            this.copySubItems(childID, subChildren);
            break;
          case 3:
            if (parent.level == 1) {
              parentID = model.addTVColumn(parentID, i, row.name, null, parent.columnData.IDMaterial);
            }
            model.addMaterial(parentID, i, row.IDMaterial, row.name, row.duration, row.type);
            break;
        }
      }
    },

    /* 粘贴 */

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onPasteButton : function(e)
    {
      var table = this._table;

      // 停止编辑行为
      if (table.isEditing()) {
        table.stopEditing();
      }

      // 获取剪切板中栏目数据
      var EPGs = tvproui.utils.Clipper.getLastProperItem("EPG");

      // 是否没有编播表内容可以粘贴
      if (null == EPGs) {
        return;
      }

      this._copyEPG(EPGs);
    },

    _onMergeButton : function(e)
    {
      /* 根据选择范围来合并 */
      var model = this._dataModel;
      var selectionModel = this._table.getSelectionModel();
      var selections = selectionModel.getSelectedRanges();
      var targettree = [];
      model.sectionToTree(selections, targettree);

      // 清除变更记录
      model.cleanChanged();
      if (targettree.length <= 1)
      {
        dialog.Dialog.error("请选择多个范围，我们将把后续目标并入当前节点");
        return;
      }
      var targetParent = targettree[0];
      var targetParentID = targetParent.nodeID;
      var targetlevel = targetParent.level;

      // 目标节点层次不可以是素材级别
      if (targetlevel == 3)
      {
        dialog.Dialog.error("选择合并目标单元不可以是素材");
        return;
      }

      // 检查，选中的合并项必须存在于同一个层次上
      for (var i = 1, l = targettree.length; i < l; i++) {
        if (targettree[i].level != targetlevel)
        {
          dialog.Dialog.error("选择合并目标单元不属于同一层次");
          return;
        }
      }

      // 移动位置
      var targetPosition = targetParent.children.length;
      var commitDescription = ["合并[", targetParent.columnData.name];

      // 将后续节点移动至主节点
      for (var i = 1, l = targettree.length; i < l; i++)
      {
        var mergeItem = targettree[i];
        var mergeID = mergeItem.nodeID;

        // 加入合并项目名称
        commitDescription.push(mergeItem.columnData.name, ",");
        var mergeChildren = mergeItem.children;
        var nodeIDs = [];

        // 将其他节点的孩子节点移动到新的主节点旗下
        for (var j = 0, cl = mergeChildren.length; j < cl; j++) {
          nodeIDs.push(mergeChildren[j]);
        }
        for (var k = 0, cl = nodeIDs.length; k < cl; k++) {
          model.moveItem(nodeIDs[k], targetParentID, targetPosition++);
        }

        // 删除当前主节点
        model.deleteItem(mergeID, true);
      }

      // 修正注释
      commitDescription.pop();
      commitDescription.push("]");
      model.setData();

      // 执行变更
      model.fixAll();

      // 提交事务
      model.commitTrans(commitDescription.join(""));

      //检查
      model.check();
    },

    // 数据拆分
    _onSplitButton: function(e)
    {
      /* 根据选择范围来合并 */
      var model = this._dataModel;
      var selectionModel = this._table.getSelectionModel();
      var selections = selectionModel.getSelectedRanges();
      var targetTree = [];

      model.sectionToTree(selections, targetTree);

      // 清除变更记录
      model.cleanChanged();
      var commitDescription = ["拆分["];
      
      // 循环每一个拆分点
      for(var i = 0, l = targetTree.length; i < l; i++)
      {
        var node = targetTree[i];
        if(node.level == 1)
        {
          dialog.Dialog.error("不支持对于栏目 " + node.columnData.name + " 的拆分， 请选择时段和素材进行拆分!");
          continue;
        }

        // 获取栏目或素材的父节点
        var parentID = node.parentID;
        var parent = model.getNodeByNodeId(parentID);

        // 准备下半部分的父节点
        var ancestorID = parent.parentID;
        var ancestor = model.getNodeByNodeId(ancestorID);
        var bottomParentPosition = ancestor.children.indexOf(parentID) + 1;
        var bottomParentID = model.addTVColumn(ancestorID, bottomParentPosition, parent.columnData.name + "(拆分)");

        // 计算切割点
        var children = qx.lang.Object.clone(parent.children);
        var childrenLength = children.length;
        var splitPosition = children.indexOf(node.nodeID) + 1;

        // 对于末尾数据的特殊处理
        if(splitPosition == childrenLength)
        {
          splitPosition--;
        }

        var front = 0;

        for(var j = splitPosition; j < childrenLength; j++)
        {
          var childID = children[j];
          model.moveItem(childID, bottomParentID, front++);
        }

        commitDescription.push(parent.columnData.name + " 由 " + node.columnData.name + "被拆分,");
      }

      // 修正注释
      commitDescription.pop();
      commitDescription.push("]");
      this._dataModel.setData();

      // 执行变更
      this._dataModel.fixAll();

      // 提交事务
      this._dataModel.commitTrans(commitDescription.join(""));

      //检查
      this._dataModel.check();
    },

    /* 编辑数据 */

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onDataEdited : function(e)
    {
      var data = e.getData();
      var model = this._dataModel;

      // 素材引用替换
      if (data.node.level == 3)
      {
        var columnData = data.node.columnData;
        switch (data.columnID)
        {
          case "name":// 如果是素材替换，素材新建
          var material = tvproui.EPG.editTable.MaterialSelector.lastMaterial;
          if (!material) {
            return;
          }

          // 验证返回的素材ID是否与当前素材ID一致
          if ((material.name == columnData.name) && (material.type == columnData.type) && (material.id == columnData.IDMaterial) && (material.duration == columnData.duration)) {
            return;
          }
          var changeNote = ["替换素材 [", columnData.beginTime.toString(), " ", columnData.type, " ", columnData.name, " 为 "];
          if (material.id != columnData.IDMaterial)
          {

            // 统计素材计数
            model.removeMaterialNode(model.materialMap, data.node);
            model.addMaterialCount(model.materialMap, material.id, material.type);
          }

          // 清除变更记录
          model.cleanChanged();
          model.updateItemByID(data.node.nodeID, "name", material.name, columnData.name);
          model.updateItemByID(data.node.nodeID, "type", material.type, columnData.type);
          model.updateItemByID(data.node.nodeID, "IDMaterial", material.id, columnData.IDMaterial);
          model.updateItemByID(data.node.nodeID, "duration", material.duration, columnData.duration);

          // 执行变更
          var orginFixed = columnData.fixed;
          columnData.fixed = true;
          model.fixAll();
          columnData.fixed = orginFixed;

          // 变更提示
          columnData.changed = true;

          // 提交事务
          changeNote.push(material.type, " ", data.value, "]");
          model.commitTrans(changeNote.join(""));
          return;
          case "type":var IDMaterial = columnData.IDMaterial;
          var item = {

          };
          item[data.columnID] = data.value;
          var map = {

          };
          map[IDMaterial] = item;
          tvproui.material.command.UpdateMapCommand.executeServer(map);
          break;
        }
      }

      // 正常变更处理
      if (data.value == data.oldValue) {
        return;
      }
      model.updateItem(data.node, data.columnID, data.value, data.oldValue);
    },

    /* 撤销列表长度变化 */

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onUndoListLengthChange : function(e)
    {
      var canUndo = e.getData();
      if (canUndo) {
        this._undoButton.setEnabled(true);
      } else {
        this._undoButton.setEnabled(false);
      }
    },

    /* 重做列表长度变化 */

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onRedoListLengthChange : function(e)
    {
      var canRedo = e.getData();
      if (canRedo) {
        this._redoButton.setEnabled(true);
      } else {
        this._redoButton.setEnabled(false);
      }
    },

    /* 撤销按钮处理 */

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onUndoButton : function(e)
    {
      if (!this._undoButton.getEnabled()) {
        return;
      }
      this._dataModel.undo();
    },

    /* 重做按钮处理 */

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onRedoButton : function(e)
    {
      if (!this._redoButton.getEnabled()) {
        return;
      }
      this._dataModel.redo();
    },


    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    loadData : function()
    {
      if (this._table.isEditing()) {
        this._table.stopEditing();
      }

      /* 默认关闭删除，保存按钮功能 */
      this._deleteButton.setEnabled(false);

      /* 清除选区 */
      this._table.getSelectionModel().resetSelection();

      /* 数据模型 */
      var model = this._dataModel;
      return model.loadData();
    },

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _switchState : function(e)
    {
      var dataModel = this._dataModel;

      var table = this._table;
      var focusRow = table.getFocusedRow();
      var focusCol = table.getFocusedColumn();
      if ((null == focusRow) || (focusRow >= dataModel.getRowCount())) {
        return;
      }

      // Just parse fixed column
      if (focusCol != 4) {
        return;
      }
      var node = dataModel.getNodeByRowColumn(focusCol, focusRow);
      var row = node.columnData;

      if(!row.fixed)
      {
        dialog.Dialog.confirm("确定要启用定时?", function(result)
        {
          if(!result)
          {
            return;
          }

          dataModel.updateItem(node, "fixed", !row.fixed, row.fixed);
        }, this);

        return;
      }

      dataModel.updateItem(node, "fixed", !row.fixed, row.fixed);
    },

    // 编辑之前的判断

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _beforeEdit : function(e)
    {
      var table = this._table;
      var focusRow = table.getFocusedRow();
      var focusCol = table.getFocusedColumn();
      var dataModel = this._dataModel;
      if ((null == focusRow) || (focusRow >= dataModel.getRowCount() || focusCol == 4))
      {
        table.cancelEditing();
        return;
      }

      var node = dataModel.getNodeByRowColumn(focusCol, focusRow);
      var row = node.columnData;
      switch (node.level)
      {
        // 时段
        case 2:
          switch (focusCol)
          {
            // 禁止编辑时段时长
            case 3:
              table.cancelEditing();
              break;
          }
          break;
        // 素材
        case 3:
          switch (focusCol)
          {
            // 如果一定要编辑素材时间，那么自动设定为定时
            case 5:
              if(!row.fixed)
              {
                dialog.Dialog.confirm("确定要启用定时?", function(result)
                {
                  if(!result)
                  {
                    table.cancelEditing();
                    return;
                  }

                  dataModel.updateItem(node, "fixed", true, false);
                }, this);
              }
              break;
          }
        default :
          break;
      }
    },


    /**
     * 替换选中素材
     *
     * @param e {Event} TODOC
     */
    _onReplaceMaterialButton : function(e)
    {
      var model = this._dataModel;
      var EPGVersionID = model.getEPGVersionID();
      var channelID = model.getChannelID();
      var createMaterialWindow = tvproui.Application.desktop.loadWindow(tvproui.EPG.editTable.ReplaceMaterialWindow,
      {
        EPGVersionID : EPGVersionID,
        channelID : channelID,
        dataModel : model
      });
    },


    /**
     * 替换选中文本
     *
     * @param e {Event} TODOC
     */
    _onReplaceStringButton : function(e)
    {
      var formData =
      {
        'find' :
        {
          'type' : "TextField",
          'label' : "查找目标",
          'value' : ""
        },
        'replace' :
        {
          'type' : "TextField",
          'label' : "替换为",
          'value' : ""
        }
      };
      dialog.Dialog.form("全文替换", formData, function(result)
      {
        if (!result) {
          return;
        }

        // 清除变更记录
        var model = this._dataModel;

        // 循环整表
        var nodes = model.getData();
        model.cleanChanged();
        var commitDescription = ["替换名称 ["];
        var count = 0;

        for (var nodeID in nodes)
        {
          if (0 == nodeID) {
            continue;
          }
          var node = nodes[nodeID];
          var columnData = node.columnData;
          if (columnData.name.indexOf(result.find) < 0) {
            continue;
          }
          commitDescription.push(columnData.beginTime.toString(), columnData.type, " ", columnData.name, ", ");

          // 修改名称
          var newName = columnData.name.replace(result.find, result.replace);
          model.updateItemByID(nodeID, "name", newName, columnData.name);
          count++;
        }

        // 提交更新
        commitDescription.pop();
        commitDescription.push("]", result.find, " 为 ", result.replace);

        // 提交事务
        model.commitTrans(commitDescription.join(""));

        // 提示
        dialog.Dialog.alert("完成替换" + count + "次!");
      }, this);
    },


    /**
     * TODOC
     *
     * @param duration {var} TODOC
     * @param columnData {var} TODOC
     * @param parentID {var} TODOC
     */
    __changeDuration : function(duration, columnData, parentID)
    {

      /* 修改父层 时长 */
      duration = tvproui.utils.Time.fromOffset(duration);
      var oldDuration = columnData.duration;

      /* 当新旧时长相同时，不处理 */
      if (duration.equal(oldDuration)) {
        return;
      }

      // 清除变更记录
      var model = this._dataModel;

      // 登记修改服务器
      model.updateItemByID(parentID, "duration", duration, oldDuration);
      columnData.changed = true;
    },


    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onRepairButton : function(e)
    {
      // 清除变更记录
      var model = this._dataModel;

      // 循环整表
      var nodes = model.getData();
      model.cleanChanged();
      var commitDescription = ["数据修复"];

      // 重新计算全部时长
      var root = nodes[0];
      var columnIDs = root.children;
      for (var columnPos in columnIDs)
      {

        // 节目
        var columnID = columnIDs[columnPos];
        var column = model.getNodeByNodeId(columnID);
        var intervalIDs = column.children;
        var columnDuration = 0;
        for (var intervalPos in intervalIDs)
        {

          // 时段
          var intervalID = intervalIDs[intervalPos];
          var interval = model.getNodeByNodeId(intervalID);
          var materialIDs = interval.children;
          var intervalDuration = 0;
          for (var materialPos in materialIDs)
          {
            // 素材
            var materialID = materialIDs[materialPos];
            var material = model.getNodeByNodeId(materialID);
            intervalDuration += material.columnData.duration.getTime();
          }
          this.__changeDuration(intervalDuration, interval.columnData, interval.nodeID);
          columnDuration += interval.columnData.duration.getTime();
        }
        this.__changeDuration(columnDuration, column.columnData, column.nodeID);
      }

      // 重新计算接续
      model.fixAll();

      // 提交事务
      model.commitTrans(commitDescription.join(""));
    },

    // 进行时段编号

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onDurationNameFromBeginButton : function(e)
    {

      // 获得当前选中的素材
      var model = this._dataModel;
      var selectionModel = this._table.getSelectionModel();
      var selections = selectionModel.getSelectedRanges();

      // 只有一个selection,则起始于该selection, 终止于表结束
      // 有多个selection,则起始于首个selection，终止于最后的selection
      var scanBegin = 0;
      var scanEnd = model.getRowCount() - 1;
      if (selections && selections.length)
      {
        scanBegin = selections[0].minIndex;
        scanEnd = 0;
        for (var i = 0, l = selections.length; i < l; i++)
        {
          var selection = selections[i];
          if (selection.maxIndex > scanEnd) {
            scanEnd = selection.maxIndex;
          }
        }
        if (scanBegin == scanEnd) {
          scanEnd = model.getRowCount() - 1;
        }
      }

      // 建立时段编号查找表, 建立已处理ID表
      var scanNodeMap = {

      };
      var tagMap = {

      };

      // 清除变更记录
      model.cleanChanged();
      var commitDescription = ["重新开始时段编号"];

      // 从起始行起循环到终止行
      for (var i = scanBegin; i <= scanEnd; i++)
      {
        var node = model.getNodeByLevel(2, i);

        // 节点不存在
        if (!node) {
          continue;
        }
        var nodeID = node.nodeID;

        // 如果数据已经处理过，那么不处理
        if (scanNodeMap[nodeID]) {
          continue;
        }
        scanNodeMap[nodeID] = true;

        // 获取时段名称
        var name = node.columnData.name;

        // 如果时段名称不符合^[A-Z]{1}\([A-Z]{1}\), 那么跳过不处理
        var tag = name.match(/^\w\(\w\)/);
        if (!tag) {
          continue;
        }
        tag = tag[0];
        var value = tagMap[tag];
        if (value) {

          // 若编号存在，则编号为表内值+1，存入编号查找表(编号，表内值+1)
          value++;
        } else {

          // 查找编号查找表，若编号不存在，则编号为匹配字段加1，存入编号查找表(编号，1)
          value = 1;
        }
        tagMap[tag] = value;
        var newName = tag + value.toString();
        model.updateItemByID(nodeID, "name", newName, name);
        commitDescription.push(name, "->", newName, ",");
      }
      commitDescription.pop();

      // 提交事务
      model.commitTrans(commitDescription.join(""));
    },

    // 进行时段编号

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onDurationNameContinueButton : function(e)
    {

      // 获得当前选中的素材
      var model = this._dataModel;
      var selectionModel = this._table.getSelectionModel();
      var selections = selectionModel.getSelectedRanges();

      // 只有一个selection,则起始于该selection, 终止于表结束
      // 有多个selection,则起始于首个selection，终止于最后的selection
      var scanBegin = 0;
      var scanEnd = model.getRowCount() - 1;
      if (selections && selections.length)
      {
        scanBegin = selections[0].minIndex;
        scanEnd = 0;
        for (var i = 0, l = selections.length; i < l; i++)
        {
          var selection = selections[i];
          if (selection.maxIndex > scanEnd) {
            scanEnd = selection.maxIndex;
          }
        }
        if (scanBegin == scanEnd) {
          scanEnd = model.getRowCount() - 1;
        }
      }

      // 建立时段编号查找表, 建立已处理ID表
      var scanNodeMap = {

      };
      var tagMap = {

      };

      // 清除变更记录
      model.cleanChanged();
      var commitDescription = ["重新开始时段编号"];
      var reg = /(^\w\(\w\))(\d+)/;

      // 从起始行起循环到终止行
      for (var i = scanBegin; i <= scanEnd; i++)
      {
        var node = model.getNodeByLevel(2, i);

        // 节点不存在
        if (!node) {
          continue;
        }
        var nodeID = node.nodeID;

        // 如果数据已经处理过，那么不处理
        if (scanNodeMap[nodeID]) {
          continue;
        }
        scanNodeMap[nodeID] = true;

        // 获取时段名称
        var name = node.columnData.name;

        // 如果时段名称不符合^[A-Z]{1}\([A-Z]{1}\), 那么跳过不处理
        var tagValues = reg.exec(name);
        if (!tagValues || tagValues.length < 2) {
          continue;
        }
        var tag = tagValues[1];
        var value = tagMap[tag];
        if (value) {

          // 若编号存在，则编号为表内值+1，存入编号查找表(编号，表内值+1)
          value++;
        } else {

          // 查找编号查找表，若编号不存在，则编号为匹配字段加1，存入编号查找表(编号，1)
          value = tagValues[2];
          if (!value) {
            value = 1;
          }
        }
        tagMap[tag] = value;
        var newName = tag + value.toString();
        model.updateItemByID(nodeID, "name", newName, name);
        commitDescription.push(name, "->", newName, ",");
      }
      commitDescription.pop();

      // 提交事务
      model.commitTrans(commitDescription.join(""));
    },


    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onUndoAdd : function(e)
    {
      var model = this._dataModel;
      var undoList = model.getUndoList();
      var length = undoList.getLength();
      if (1 == length) {
        return;
      }
      this._selectionList.setItem(0, undoList.getItem(length - 1));
    },

    _onSaveButton: function(e)
    {
      var model = this._dataModel;
      // 保存至服务
      
      if(!model.needSaveVersion())
      {
        return;
      }

      var formData = {
        'description' :
        {
          'type' : "TextArea",
          'label' : "版本描述",
          'lines' : 4,
          'value' : "进行了修改"
        }
      };

      dialog.Dialog.form("提交版本记录", formData, function(result)
      {
        if (!result) {
          return;
        }

        model.saveNetwork(result.description);
      }, this);
    }
  },

  // 界面之外的内容释放
  destruct : function()
  {
    this._addEntry = null;
    this._deleteEntry = null;
    this._cutEntry = null;
    this._copyEntry = null;
    this._pasteEntry = null;
    this._mergeEntry = null;
    this._splitEntry = null;

    this._lastColumnRow = null;
    this._historyBox = null;
    this._selectionList = null;
  }
});
