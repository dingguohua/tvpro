
/**
 * @author Weibo Zhang
 */

/* ************************************************************************
#asset(qx/icon/${qx.icontheme}/22/categories/*)
#asset(qx/icon/${qx.icontheme}/22/apps/*)
#asset(qx/icon/${qx.icontheme}/22/status/*)
************************************************************************ */
qx.Class.define("tvproui.user.UserManagement",
{
  extend : tvproui.control.ui.window.Window,
  statics :
  {
    applicationName : "用户管理工具",
    applicationIcon : "icon/22/apps/preferences-users.png",
    canMultipleSupport : false,
    PERMISSION_READ : 1 << 1,
    PERMISSION_WRITE : 1 << 2,
    PERMISSION_MANAGEMENT : 1 << 3,
    PERMISSION_MATERIAL_MAINTAIN : 1 << 4,
    PERMISSION_WEEKLY_EDIT : 1 << 5,
    PERMISSION_DAILY_EDIT : 1 << 6,
    PERMISSION_AUDIT : 1 << 7,
    PERMISSION_ONLINEWAPPER_EDIT : 1 << 8,
    PERMISSION_STATISTIC: 1 << 9
  },
  construct : function()
  {
    this.base(arguments);
    this.setLayout(new qx.ui.layout.VBox());
    this.setResizable(false);
    this.setAllowMaximize(false);
    var hboxMain = new qx.ui.container.Composite(new qx.ui.layout.HBox());
    this.add(hboxMain);
    hboxMain.add(this._initUserList());
    this.loadUserData();
    hboxMain.add(new qx.ui.core.Spacer(20));
    hboxMain.add(this._initTree("授权范围", "_regionTree"));
    this._regionTree.getSelection().addListener("change", this.onChooseRegionTree, this);
    hboxMain.add(new qx.ui.core.Spacer(20));
    hboxMain.add(this._initTree("授权类型", "_typeTree"));
    this._typeTree.setHideRoot(true);
    this.add(this._initToolBar());
  },
  members :
  {
    _userList : null,
    _regionTree : null,
    _typeTree : null,
    _actionPart : null,
    _currentUsername : null,
    _currentRegion : null,
    _waitCall : false,

    // 新用户窗口
    _newUserWindow : null,

    /* 初始化用户名单 */

    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    _initUserList : function()
    {
      var container = new qx.ui.container.Composite(new qx.ui.layout.VBox());
      var title = new qx.ui.basic.Label("用户列表").set(
        {
          font:"bold"
        });

      container.add(title);

      var list = new qx.ui.list.List().set({
        height: 200,
        width:140,
        labelPath : "label",
        iconPath : "icon",
        iconOptions:{
          converter: tvproui.system.fileManager.path
        },
        selectionMode:"single"
      });
      container.add(list);

      var delegate =
      {
        configureItem : function(item) {
          item.getChildControl("icon").set(
          {
            width : 48,
            height : 48,
            scale : true
          });
        },
        bindItem : function(controller, item, id)
        {
          controller.bindDefaultProperties(item, id);
          controller.bindProperty("enabled", "backgroundColor", {
            converter : function(data) {

              // 0 用户被禁用  1 用户启用不在线  2 用户启用 在线 3 用户正在离线
              switch (data)
              {
                case 0:return "#AA2222";
                break;
                case 1:return "#FFFFFF";
                break;
                case 2:return "#A2D246";
                break;
                case 3:return "#D3DCE3";
                break;
              }
            }
          }, item, id);
        }
      };

      // sets the delegate to the list
      list.setDelegate(delegate);
      this._userList = list;
      list.getSelection().addListener("change", this._onChangeUserSelection, this);
      return container;
    },

    /* 当用户改变了选项 */

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onChangeUserSelection : function(e)
    {
      var typeTree = this._typeTree;
      var regionTree = this._regionTree;
      var actionPart = this._actionPart;
      var selection = e.getTarget();
      if (selection.getLength() == 0)
      {
        this._currentUsername = null;
        regionTree.setModel(null);
        regionTree.setEnabled(false);
        actionPart.setEnabled(false);
      } else
      {
        var userItem = selection.getItem(0);
        this._currentUsername = userItem.getUsername();
        this._loadRegionTree(this._currentUsername);
        regionTree.setEnabled(true);
        actionPart.setEnabled(true);
        var stopButton = this._stopButton;
        if (userItem.getEnabled()) {

          // 账户目前启用， 显示停用功能
          stopButton.setLabel("停用");
        } else {

          // 账户停用功能， 显示启用功能
          stopButton.setLabel("启用");
        }
      }
      typeTree.setEnabled(false);
    },

    /* 初始化用户名数据 */

    /**
     * TODOC
     *
     */
    loadUserData : function()
    {
      var list = this._userList;
      var users = tvproui.AjaxPort.call("User/getAllUsersInfo");

      // Creates model data
      var rawData = [];
      var length = users ? users.length : 0;
      rawData.length = length;
      for (var i = 0; i < length; i++)
      {
        var user = users[i];

        // 0 用户被禁用  1 用户启用不在线  2 用户启用 在线 3 用户正在离线
        var status = (user.status == 0) ? 0 : (parseInt(user.status) + parseInt(user.online));
        rawData[i] =
        {
          username : user.username,
          imageID : user.imageid,
          description : user.desc,
          label : user.alias,
          icon : user.path,
          enabled : status
        };
      }
      var model = qx.data.marshal.Json.createModel(rawData);
      list.setModel(model);

      // Sets the list item size to all items.
      // This is needed, because we use images with different size.
      var rowConfig = list.getPane().getRowConfig();
      for (var i = 0; i < length; i++) {
        rowConfig.setItemSize(i, 56);
      }
    },


    /**
     * TODOC
     *
     * @param label {var} TODOC
     * @param treeName {var} TODOC
     * @param converter {var} TODOC
     * @return {var} TODOC
     */
    _initTree : function(label, treeName, converter)
    {
      var container = new qx.ui.container.Composite(new qx.ui.layout.VBox());
      var title = new qx.ui.basic.Label(label).set( {
        font : "bold"
      });
      container.add(title);
      var tree = new qx.ui.tree.VirtualTree(null, "name", "children").set(
      {
        height : 200,
        width : 160,
        enabled : false
      });
      container.add(tree);
      tree.setIconPath("path");
      tree.setDelegate(
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
        bindItem : function(controller, item, id)
        {
          controller.bindDefaultProperties(item, id);
          controller.bindProperty("checked", "checked", {
            converter : converter
          }, item, id);
          controller.bindPropertyReverse("checked", "checked", null, item, id);
        },

        // delegate implementation
        createItem : function() {
          return new tvproui.user.RegionTreeItem();
        }
      });
      this[treeName] = tree;
      return container;
    },


    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    onChooseRegionTree : function(e)
    {
      var selection = e.getTarget();
      if (selection.getLength() == 0) {
        return;
      }
      var region = selection.getItem(0);
      this._currentRegion = region;
      this._loadTypeTree(region.getType(), region.getPermissions());
      this._typeTree.setEnabled(true);
    },


    /**
     * TODOC
     *
     * @param username {var} TODOC
     */
    _loadRegionTree : function(username)
    {
      var permissions = tvproui.AjaxPort.call("User/getResourcePower", {
        "username" : username
      });
      var permissionMap = {

      };
      if (permissions) {
        for (var i = 0, l = permissions.length; i < l; i++)
        {
          var permission = permissions[i];
          permissionMap[permission.resourcetree_ID] = parseInt(permission.power);
        }
      }
      var nodes = tvproui.AjaxPort.call("resourceTree/getResourcesByLevel",
      {
        "username" : username,
        "level" : "3"
      });
      var maps = {

      };
      var lowestLevel = 9999;
      for (var i = 0, l = nodes.length; i < l; i++)
      {
        var node = nodes[i];
        maps[node.ID] = node;
        if (node.type == "recycle")
        {
          nodes.splice(i, 1);
          i--;
          l = nodes.length;
          continue;
        }
        node.permissions = permissionMap[node.ID] ? permissionMap[node.ID] : 0;
        if (node.level < lowestLevel) {
          lowestLevel = node.level;
        }
      }
      var data;
      for (var i = 0, l = nodes.length; i < l; i++)
      {
        var node = nodes[i];
        var parent = maps[node.parentID];
        node.checked = node.permissions & tvproui.user.UserManagement.PERMISSION_READ ? true : false;
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

      // data binding
      this._regionTree.setModel(model);
      this._configureChangeEvent(model, this._onRegionTreeChecked);
    },


    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onRegionTreeChecked : function(e)
    {
      var target = e.getTarget();
      var checked = target.getChecked();
      var permissions = target.getPermissions();
      var resourceID = target.getID();
      if (checked) {

        /* 增加读取权限 */
        permissions |= tvproui.user.UserManagement.PERMISSION_READ;
      } else {

        /* 去除所有权限 */
        permissions = 0;
        this._loadTypeTree(target.getType(), permissions);
      }
      target.setPermissions(permissions);
      if (!this._waitCall)
      {
        var regionTree = this._regionTree;
        regionTree.getSelection().push(target);
        var result = tvproui.AjaxPort.call("permission/grantUser",
        {
          "username" : this._currentUsername,
          "resourceid" : resourceID,
          "power" : permissions
        });
        if (!result) {
          dialog.Dialog.error("给用户" + this._currentUsername + "授权时发生错误，请联系管理员!");
        }
      }
    },


    /**
     * TODOC
     *
     * @param type {var} TODOC
     * @param permission {var} TODOC
     */
    _loadTypeTree : function(type, permission)
    {
      var data;
      switch (type)
      {
        case "root":
        case "channel":
        data =
        {
          name : "全部权限",
          type : 0,
          path : "icon/22/apps/preferences-users.png",
          children : [
          {
            name : "素材维护",
            type : tvproui.user.UserManagement.PERMISSION_MATERIAL_MAINTAIN,
            path : "icon/22/apps/preferences-users.png"
          },
          {
            name : "周播表编辑",
            type : tvproui.user.UserManagement.PERMISSION_WEEKLY_EDIT,
            path : "icon/22/apps/preferences-users.png"
          },
          {
            name : "日播表编辑",
            type : tvproui.user.UserManagement.PERMISSION_DAILY_EDIT,
            path : "icon/22/apps/preferences-users.png"
          },
          {
            name : "审核",
            type : tvproui.user.UserManagement.PERMISSION_AUDIT,
            path : "icon/22/apps/preferences-users.png"
          },
          {
            name : "在线包装编辑",
            type : tvproui.user.UserManagement.PERMISSION_ONLINEWAPPER_EDIT,
            path : "icon/22/apps/preferences-users.png"
          },
          {
            name : "频道管理",
            type : tvproui.user.UserManagement.PERMISSION_MANAGEMENT,
            path : "icon/22/apps/preferences-users.png"
          },
          {
            name : "统计",
            type : tvproui.user.UserManagement.PERMISSION_STATISTIC,
            path : "icon/22/apps/preferences-users.png"
          }]
        };
        break;
        case "materialSet":
        case "column":
        data =
        {
          name : "全部权限",
          path : "icon/22/apps/preferences-users.png",
          type : 0,
          children : [
          {
            name : "素材维护",
            type : tvproui.user.UserManagement.PERMISSION_MATERIAL_MAINTAIN,
            path : "icon/22/apps/preferences-users.png"
          },
          {
            name : "部门管理",
            type : tvproui.user.UserManagement.PERMISSION_MANAGEMENT,
            path : "icon/22/apps/preferences-users.png"
          }]
        };
        break;
      }
      this._configTypeTreeChecked(permission, data);
      var model = qx.data.marshal.Json.createModel(data, true);

      // data binding
      this._typeTree.setModel(model);
      this._configureChangeEvent(model, this._onTypeTreeChecked);
    },


    /**
     * TODOC
     *
     * @param permission {var} TODOC
     * @param item {var} TODOC
     */
    _configTypeTreeChecked : function(permission, item)
    {
      item.checked = permission & item.type ? true : false;
      if (item.children == null) {
        return;
      }
      for (var i = 0, l = item.children.length; i < l; i++)
      {
        var child = item.children[i];
        this._configTypeTreeChecked(permission, child);
      }
    },


    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onTypeTreeChecked : function(e)
    {
      var target = e.getTarget();
      var checked = target.getChecked();
      var type = target.getType();
      var resourceID = this._currentRegion.getID();
      var permissions;
      if (0 === type) {
        return;
      }
      if (checked)
      {

        /* 强制添加读取权限 */
        if (!this._currentRegion.getChecked())
        {
          this._waitCall = true;
          this._currentRegion.setChecked(true);
          this._waitCall = false;
        }
        permissions = this._currentRegion.getPermissions();
        permissions |= type;
      } else
      {
        permissions = this._currentRegion.getPermissions();
        permissions &= ~type;
      }
      this._currentRegion.setPermissions(permissions);
      var result = tvproui.AjaxPort.call("permission/grantUser",
      {
        "username" : this._currentUsername,
        "resourceid" : resourceID,
        "power" : permissions
      });
      if (!result) {
        dialog.Dialog.error("给用户" + this._currentUsername + "授权时发生错误，请联系管理员!");
      }
    },


    /**
     * TODOC
     *
     * @param item {var} TODOC
     * @param eventFunc {var} TODOC
     */
    _configureChangeEvent : function(item, eventFunc)
    {
      item.addListener("changeChecked", eventFunc, this);
      if (item.getChildren == null) {
        return;
      }
      var children = item.getChildren();
      for (var i = 0, l = children.getLength(); i < l; i++)
      {
        var child = children.getItem(i);
        this._configureChangeEvent(child, eventFunc);
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
      var toolbar = new qx.ui.toolbar.ToolBar();

      var editPart = new qx.ui.toolbar.Part();
      toolbar.add(editPart);

      //zhuce
      var registerButton = new qx.ui.toolbar.Button("注册", "icon/22/actions/list-add.png");
      editPart.add(registerButton);
      registerButton.addListener("execute",this._addNewUser,this);

      /* 刷新 */
      var refreshButton = new qx.ui.toolbar.Button("刷新", "icon/22/actions/view-refresh.png");
      editPart.add(refreshButton);
      refreshButton.addListener("execute", this.loadUserData, this);

      /* 工具栏的操作分段 */
      var actionPart = new qx.ui.toolbar.Part();
      toolbar.add(actionPart);
      this._actionPart = actionPart;
      actionPart.setEnabled(false);

      //tingzhi
      var stopButton = new qx.ui.toolbar.Button("停止","icon/22/actions/process-stop.png");
      actionPart.add(stopButton);
      this._stopButton = stopButton;
      stopButton.addListener("execute",this._setUserEnable,this);

      var resetPasswordButton = new qx.ui.toolbar.Button("重置密码","icon/22/status/dialog-password.png");
      actionPart.add(resetPasswordButton);
      resetPasswordButton.addListener("execute",this._setUserPassword,this);

      /* 请求登出 */
      var offlineButton = new qx.ui.toolbar.Button("请求登出", "icon/22/actions/system-log-out.png");
      actionPart.add(offlineButton);
      offlineButton.addListener("execute", this._offLineUser, this);

      /* 离线 */
      var forceOfflineButton = new qx.ui.toolbar.Button("强制退出", "icon/22/actions/dialog-close.png");
      actionPart.add(forceOfflineButton);
      forceOfflineButton.addListener("execute", this._forceOfflineButton, this);

      /* 审计 */
      var historyButton = new qx.ui.toolbar.Button("审计", "icon/22/apps/utilities-notes.png");
      actionPart.add(historyButton);
      toolbar.add(actionPart);
      return toolbar;
    },

    //添加新用户

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _addNewUser : function(e)
    {
      this._newUserWindow = tvproui.Application.desktop.loadWindow(tvproui.user.UserRegister);
      this._newUserWindow.addListener("UserRegister", this._onNewUserWindowClose, this);
    },

    // 关闭新建用户窗口时进行刷新

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onNewUserWindowClose : function(e)
    {
      this._newUserWindow.removeListener("UserRegister", this._onNewUserWindowClose, this);
      this.loadUserData();
    },

    /* 启停用户 */

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _setUserEnable : function(e)
    {
      var selection = this._userList.getSelection();
      var user = selection.getItem(0);
      var enabled = (user.getEnabled() != 0);
      var username = user.getUsername();
      if (user.getEnabled() == 3) {
        this._offLineUser();
      }
      var result = tvproui.AjaxPort.call(enabled ? "User/disableUser" : "User/enableUser", {
        "username" : username
      });
      if (!result)
      {
        dialog.Dialog.error("启用/停用账号" + this._currentUsername + "时发生错误，请联系管理员!");
        return;
      }
      user.setEnabled(enabled ? 0 : 1);
      selection.removeAll();
    },

    /* 启停用户 */

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _offLineUser : function(e)
    {
      var selection = this._userList.getSelection();
      var user = selection.getItem(0);
      var username = user.getUsername();
      var result = tvproui.AjaxPort.call("User/kickOffUser", "username=" + username);
      if (!result)
      {
        dialog.Dialog.error("服务端拒绝了您的请求!");
        return;
      }
      user.setEnabled(3);
      selection.removeAll();
    },


    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _forceOfflineButton : function(e)
    {
      var selection = this._userList.getSelection();
      var user = selection.getItem(0);
      var username = user.getUsername();
      var result = tvproui.AjaxPort.call("User/kickOffUser",
      {
        "username" : username,
        "force" : "1"
      });
      if (!result)
      {
        dialog.Dialog.error("服务端拒绝了您的请求!");
        return;
      }
      user.setEnabled(1);
      selection.removeAll();
    },

    /* 重置密码 */

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _setUserPassword : function(e)
    {
      /*获取用户名*/
      var selection = this._userList.getSelection();
      var user = selection.getItem(0);
      var username = user.getUsername();
      /*弹出prompt对话框*/
      dialog.Dialog.prompt("输入密码",function(result){

        if(null==result){
          return;
        }

        var md5 = tvproui.utils.crypt.MD5.calculate;
        var password = md5(result);
        tvproui.AjaxPort.call("user/changePassword",{
          username: username,
          password: password
        });
      });

    },


    /**
     * TODOC
     *
     */
    refresh : function() {
      this.loadUserData();
    }
  },

  // 界面之外的内容释放
  destruct : function()
  {

    // 释放非显示层级对象
    this._userList = null;
    this._regionTree = null;
    this._typeTree = null;
    this._actionPart = null;
    this._currentUsername = null;
    this._currentRegion = null;
    this._waitCall = false;
    this._newUserWindow = null;
  }
});
