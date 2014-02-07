
/**
 * @author Administrator
 */

/* ************************************************************************
#asset(tvproui/*);
#asset(qx/icon/${qx.icontheme}/16/actions/*)
#asset(qx/icon/${qx.icontheme}/22/places/*)
************************************************************************ */
qx.Class.define("tvproui.resourceTree.Tree",
{
  extend : qx.ui.tree.VirtualTree,
  properties :
  {

    // 锁定状态，锁定后不可编辑
    locked :
    {
      init : true,
      check : "Boolean"
    },

    // 正在编辑用户名
    editingAlias : {
      check : "String"
    }
  },
  statics :
  {
    _lastLoadTime : new Date(),
    _lastQueryString : null,
    _lastQueryData : null,
    _lastResult : null,


    /**
     * TODOC
     *
     * @param root {var} TODOC
     * @param maxLevel {var} TODOC
     * @param nolock {var} TODOC
     * @param target {var} TODOC
     * @return {var} TODOC
     */
    loadNodeWithBuffer : function(root, maxLevel, nolock, target)
    {
      var querys = {

      };
      if (root) {
        querys["root"] = root;
      }
      if (maxLevel) {
        querys["maxLevel"] = maxLevel;
      }
      if (nolock) {
        querys["nolock"] = 1;
      } else {
        querys["nolock"] = 0;
      }
      var queryString = tvproui.utils.JSON.stringify(querys);
      if (target)
      {
        target._lastQueryString = queryString;
        target._lastQueryData = querys;
      }

      // 如果是无锁，考虑使用缓存内容
      if (nolock)
      {
        var now = new Date();

        // 比较是否有缓存
        if ((tvproui.resourceTree.Tree._lastQueryString == queryString) && (now.getTime() - tvproui.resourceTree.Tree._lastViewTime.getTime() < 3000))
        {
          var result = tvproui.resourceTree.Tree._lastResult;
          var cloneResult = qx.lang.Object.clone(result);
          cloneResult.datas = [];
          cloneResult.datas.length = result.datas.length;
          for (var i = 0, l = result.datas.length; i < l; i++) {
            cloneResult.datas[i] = qx.lang.Object.clone(result.datas[i]);
          }
          return cloneResult;
        }
      }
      var result = tvproui.AjaxPort.call("User/getUserResources", querys);
      tvproui.resourceTree.Tree._lastViewTime = now;
      tvproui.resourceTree.Tree._lastQueryString = queryString;
      tvproui.resourceTree.Tree._lastQueryData = querys;
      tvproui.resourceTree.Tree._lastResult = result;
      var cloneResult = qx.lang.Object.clone(result);
      cloneResult.datas = [];
      cloneResult.datas.length = result.datas.length;
      for (var i = 0, l = result.datas.length; i < l; i++) {
        cloneResult.datas[i] = qx.lang.Object.clone(result.datas[i]);
      }
      return cloneResult;
    }
  },
  events : {
    loaded : "qx.event.type.Data"
  },
  construct : function(maxLevel, rootID, dragSupport, writePermission)
  {
    this.base(arguments, null, "name", "children");
    this.setEnabled(false);

    //配置基本信息
    this._maxLevel = maxLevel;
    this._writePermission = writePermission ? true : false;
    this._initResourceTree();

    // 初始化拖动支持
    if (dragSupport)
    {
      this.setDraggable(true);
      if (writePermission) {
        this.setDroppable(true);
      }
      this._createDragDropSupport();
    }

    // 初始胡按钮
    this._refreshButton = new qx.ui.menu.Button("刷新", "icon/16/actions/view-refresh.png");
    this._refreshButton.addListener("execute", this._refreshCommandExecute, this);
    var timer = qx.util.TimerManager.getInstance();

    // 界面逻辑和数据逻辑分离timer
    timer.start(function(userData, timerId)
    {

      // 加载数据
      this._root = this._loadTree(maxLevel, rootID);

      // 显示数据
      this.setModel(this._root);

      // 根据权限确定菜单类型
      if (writePermission && !this.getLocked())
      {
        this._addButton = new qx.ui.menu.Button("添加", "icon/16/actions/folder-new.png");
        this._deleteButton = new qx.ui.menu.Button("删除", "icon/16/actions/edit-delete.png");
        this._propertyButton = new qx.ui.menu.Button("属性", "icon/16/actions/zoom-in.png");
        this._recycleButton = new qx.ui.menu.Button("恢复", "icon/16/actions/dialog-cancel.png");
        this._addButton.addListener("execute", this._addCommandExecute, this);
        this._deleteButton.addListener("execute", this._deleteCommandExecute, this);
        this._propertyButton.addListener("execute", this._propertyCommandExecute, this);
        this._recycleButton.addListener("execute", this._recycleCommandExecute, this);
        this.getSelection().addListener("change", this._onResourceTreeSelect, this);
      } else
      {
        var menu = new qx.ui.menu.Menu();
        menu.add(this._refreshButton);

        // 仅允许刷新
        this.setContextMenu(menu);
      }

      // 触发装载完毕事件
      this.fireDataEvent("loaded");
      this.setEnabled(true);
    }, 0, this, 100);
  },
  members :
  {
    _writePermission : null,
    _maxLevel : null,
    _root : null,
    _parentAdd : null,
    _addButton : null,
    _deleteButton : null,
    _propertyButton : null,
    _refreshButton : null,
    _dragSelection : null,
    _lastQueryString : null,
    _lastQueryData : null,

    /*  */

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onResourceTreeSelect : function(e) {
      this.setContextMenu(this._getContextMenu());
    },

    /* 构造资源树 */

    /**
     * TODOC
     *
     */
    _initResourceTree : function()
    {

      /* 配置树节点图标 */
      //this.setOpenMode("click");
      this.setIconPath("path");

      /* 配置数据操作 */
      var delegate =
      {
        configureItem : function(item) {

          // TODO: Magic number
          item.getChildControl("icon").set(
          {
            width : 27,
            height : 22,
            scale : true
          });
        },

        // delegate implementation
        createItem : function() {
          return new tvproui.resourceTree.Node();
        }
      };
      this.setDelegate(delegate);
    },


    /**
     * TODOC
     *
     * @param parentModel {var} TODOC
     * @return {void | boolean} TODOC
     */
    _loadNode : function(parentModel)
    {
      var maxLevel = this._maxLevel;

      /* 不装载最大层次之后的内容 */
      if (maxLevel && (parentModel.getLevel() >= maxLevel)) {
        return;
      }
      var parentID = parentModel.getID();
      var childLevel = parentModel.getLevel() + 1;
      var nodes = tvproui.resourceTree.Tree.loadNodeWithBuffer(parentID, maxLevel, true);
      if (null == nodes) {
        return false;
      }
      if (null == nodes.lock) {
        return false;
      }
      nodes = nodes.datas;
      var showRecycle = this._writePermission;
      var maps = {

      };
      for (var i = 0, l = nodes.length; i < l; i++)
      {
        var node = nodes[i];
        maps[node.ID] = node;
        if ((node.type == "recycle") && !showRecycle)
        {
          nodes.splice(i, 1);
          i--;
          l = nodes.length;
          continue;
        }
        node.ID = parseInt(node.ID);
        node.level = parseInt(node.level);
        node.permissions = parseInt(node.permissions);
      }
      parentModel.getChildren().removeAll();
      for (var i = 0, l = nodes.length; i < l; i++)
      {
        var node = nodes[i];
        var parent = maps[node.parentID];
        node.children = [];
        node.path = tvproui.system.fileManager.path(node.path);
        if (parent == null) {
          continue;
        }
        parent.children = parent.children ? parent.children : [];
        parent.children[parent.children.length] = node;
      }
      for (var i = 0, l = nodes.length; i < l; i++)
      {
        var node = nodes[i];
        if (node.level == childLevel)
        {
          parentModel.getChildren().push(qx.data.marshal.Json.createModel(node, true));
          continue;
        }
      }
      this._setParentNode(parentModel, null);
    },


    /**
     * TODOC
     *
     * @param maxLevel {var} TODOC
     * @param rootID {var} TODOC
     * @return {boolean | var} TODOC
     */
    _loadTree : function(maxLevel, rootID)
    {
      this.close();
      var nodes = tvproui.resourceTree.Tree.loadNodeWithBuffer(rootID, maxLevel, !this._writePermission, this);
      if (null == nodes) {
        return false;
      }
      if (null == nodes.lock) {
        return false;
      }
      var lock = (nodes.lock != 1);
      this.setLocked(lock);
      var alias = (nodes.alias == null) ? "" : nodes.alias;
      this.setEditingAlias(alias);
      nodes = nodes.datas;
      var maps = {

      };
      var lowestLevel = 9999;
      var showRecycle = this._writePermission;
      for (var i = 0, l = nodes.length; i < l; i++)
      {
        var node = nodes[i];
        maps[node.ID] = node;
        if ((node.type == "recycle") && !showRecycle)
        {
          nodes.splice(i, 1);
          i--;
          l = nodes.length;
          continue;
        }
        node.ID = parseInt(node.ID);
        node.level = parseInt(node.level);
        node.permissions = parseInt(node.permissions);
        if (node.level < lowestLevel) {
          lowestLevel = node.level;
        }
      }
      var data;
      for (var i = 0, l = nodes.length; i < l; i++)
      {
        var node = nodes[i];
        var parent = maps[node.parentID];
        node.children = [];
        node.path = tvproui.system.fileManager.path(node.path);
        if (node.level == lowestLevel)
        {
          data = node;
          continue;
        }
        parent.children = parent.children ? parent.children : [];
        parent.children[parent.children.length] = node;
      }
      var model = qx.data.marshal.Json.createModel(data, true);
      this._setParentNode(model, null);
      return model;
    },


    /**
     * TODOC
     *
     * @param item {var} TODOC
     * @param parent {var} TODOC
     */
    _setParentNode : function(item, parent)
    {
      item.parentNode = parent;
      var children = item.getChildren();
      for (var i = 0, l = children.getLength(); i < l; i++)
      {
        var child = children.getItem(i);
        this._setParentNode(child, item);
      }
    },


    /**
     * TODOC
     *
     */
    _createDragDropSupport : function()
    {

      /* 开始移动 */
      this.addListener("dragstart", function(e)
      {
        this._dragSource = this.getSelection().getItem(0);
        e.addAction("move");
        e.addType("resourceTree");
        this._dragSelection = this.getSelection().copy();
        this.setQuickSelection(true);
      }, this);

      /* 请求移动，将选区加入移动对象 */
      this.addListener("droprequest", function(e)
      {
        var type = e.getCurrentType();
        e.addData(type, this._dragSelection);
      });

      /* 移动结束，隐藏指示器 */
      this.addListener("dragend", function(e) {
        this.setQuickSelection(false);
      }, this);
      if (!this._writePermission) {
        return;
      }

      /* 放下拖动内容 */
      this.addListener("drop", function(e)
      {
        this.setQuickSelection(false);

        // 没有写权限不让拖动
        if (!this._writePermission || this.getLocked()) {
          return;
        }
        var type = e.supportsType("resourceTree");
        if (type)
        {
          var sourceNode = e.getData("resourceTree").getItem(0);
          var targetNode = this.getSelection().getItem(0);

          // 目标找不到
          if (!targetNode) {
            return;
          }
          if (!(targetNode.getPermissions() & tvproui.user.UserManagement.PERMISSION_MANAGEMENT)) {
            return;
          }
          tvproui.resourceTree.Node.moveBefore(sourceNode, targetNode);
          return;
        }
        dialog.Dialog.error("拖放类型不支持");
      }, this);
    },


    /**
     * TODOC
     *
     * @param instance {var} TODOC
     * @return {null | var} TODOC
     */
    getTreeFolder : function(instance)
    {
      if (instance == null) {
        return null;
      }
      if (instance.classname === "tvproui.resourceTree.Node") {
        return instance;
      } else {
        return this.getTreeFolder(instance.getLayoutParent());
      }
    },


    /**
     * TODOC
     *
     */
    _addCommandExecute : function() {
      this.getSelection().forEach(function(item)
      {

        /* 强制打开节点 */
        if (!this.isNodeOpen(item))
        {
          this._parentAdd = item;
          this.addListener("open", this.doAfterNodeOpen, this);
          this.openNode(item);
          return;
        }
        this.createNode(item);
      }, this);
    },


    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    doAfterNodeOpen : function(e)
    {
      this.removeListener("open", this.doAfterNodeOpen, this);
      this.createNode(this._parentAdd);
    },


    /**
     * TODOC
     *
     * @param item {var} TODOC
     */
    createNode : function(item)
    {

      // 避开回收站
      var position = item.getChildren().getLength() - 1;
      var title = null;
      var type = null;
      var imageID;
      var path;
      switch (item.getType())
      {
        case "root":type = "channel";
        title = "新建频道";
        imageID = 3;
        path = "uploads/images/3.png";
        break;
        case "channel":type = "column";
        title = "新建栏目";
        imageID = 4;
        path = "uploads/images/4.png";
        break;
        case "column":case "materialSet":type = "materialSet";
        title = "新建素材集";
        imageID = 5;
        path = "uploads/images/5.png";
        break;
      }
      var newNode = tvproui.resourceTree.Node.createSubNode(item, position, title, type, imageID, path);
      if (null != newNode)
      {
        var editWindow = tvproui.Application.desktop.loadWindow(tvproui.resourceTree.PropertyWindow, newNode);
        editWindow.addListenerOnce("close", function(e)
        {
          if (editWindow.getSuccessed()) {
            return;
          }
          tvproui.resourceTree.Node.remove(newNode);
        }, this);
      }
    },


    /**
     * TODOC
     *
     */
    _deleteCommandExecute : function() {
      this.getSelection().forEach(function(item) {
        tvproui.resourceTree.Node.remove(item);
      }, this);
    },


    /**
     * TODOC
     *
     */
    _recycleCommandExecute : function() {
      this.getSelection().forEach(function(item) {
        tvproui.resourceTree.Node.recycle(item);
      }, this);
    },


    /**
     * TODOC
     *
     */
    _refreshCommandExecute : function() {
      this.getSelection().forEach(function(item) {
        this._loadNode(item);
      }, this);
    },

    /* 刷新 */

    /**
     * TODOC
     *
     */
    loadData : function() {
      this._loadNode(this._root);
    },


    /**
     * TODOC
     *
     */
    _propertyCommandExecute : function() {
      this.getSelection().forEach(function(item) {
        tvproui.Application.desktop.loadWindow(tvproui.resourceTree.PropertyWindow, item);
      }, this);
    },

    /* 配置上下文菜单 */

    /**
     * TODOC
     *
     * @return {null | var} TODOC
     */
    _getContextMenu : function()
    {
      var menu = new qx.ui.menu.Menu();
      var item = this.getSelection().getItem(0);
      if (!item) {
        return null;
      }

      // 若节点本身已经在回收站之内
      if (item.parentNode)
      {
        if (item.parentNode.getType() == "recycle")
        {
          if (item.getPermissions() & tvproui.user.UserManagement.PERMISSION_MANAGEMENT) {
            menu.add(this._recycleButton);
          }
          menu.add(this._refreshButton);
          return menu;
        }

        // 若节点的祖先节点在回收站内
        var accent = item.parentNode.parentNode;
        while (accent)
        {
          if (accent.getType() == "recycle")
          {
            menu.add(this._refreshButton);
            return menu;
          }
          accent = accent.parentNode;
        }
      }
      var permission = item.getPermissions();
      switch (item.getType())
      {
        case "recycle":menu.add(this._refreshButton);
        break;
        case "column":case "materialSet":// 有具有频道管理员权限或者是素材维护权限的人，才可以在根下面添加，删除，修改素材集合
        if ((permission & tvproui.user.UserManagement.PERMISSION_MANAGEMENT) | (permission & tvproui.user.UserManagement.PERMISSION_MATERIAL_MAINTAIN))
        {
          menu.add(this._addButton);
          menu.add(this._deleteButton);
          menu.add(this._propertyButton);
        }
        menu.add(this._refreshButton);
        break;
        default :if (permission & tvproui.user.UserManagement.PERMISSION_MANAGEMENT)
        {
          menu.add(this._addButton);
          menu.add(this._deleteButton);
          menu.add(this._propertyButton);
        }
        menu.add(this._refreshButton);
        break;
      }


      /*
      this._addCommand = new qx.ui.core.Command("Alt+Insert");
      this._deleteCommand = new qx.ui.core.Command("Alt+Delete");
      this._propertyCommand = new qx.ui.core.Command("Alt+Enter");
      this._refreshCommand = new qx.ui.core.Command("F5");

      this._addCommand.addListener("execute", this._addCommandExecute, this);
      this._deleteCommand.addListener("execute", this._deleteCommandExecute, this);
      this._propertyCommand.addListener("execute", this._propertyCommandExecute, this);
      this._refreshCommand.addListener("execute", this._refreshCommandExecute, this);
      */
      return menu;
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

      // 如果是可写模式，关闭引用的EPGVersion
      tvproui.AjaxPort.call("resourceTree/close", this._lastQueryData);
    }
  },

  // 界面之外的内容释放
  destruct : function()
  {

    //释放锁
    this.close();

    // 去除多余的引用
    this._lastQueryString = null;
    this._lastQueryData = null;
    this._writePermission = null;
    this._maxLevel = null;
    this._root = null;
    this._parentAdd = null;
    this._addButton = null;
    this._deleteButton = null;
    this._propertyButton = null;
    this._refreshButton = null;
    this._dragSelection = null;
  }
});
