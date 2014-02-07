
/*
  消息窗口实现
*/

/* ************************************************************************
************************************************************************ */
qx.Class.define("tvproui.messager.MessagerWindow",
{
  extend : tvproui.control.ui.window.Window,
  statics :
  {
    applicationName : "消息",
    applicationIcon : "tvproui/messager/nomail.png",
    canMultipleSupport : false
  },
  construct : function()
  {
    this.base(arguments);
    this.set( {
      contentPadding : 0
    });
    this._createUI();
  },
  members :
  {
    messenger : null,
    _toolBar : null,
    _attachment : null,


    /**
     * TODOC
     *
     */
    _createUI : function()
    {
      var layout = new qx.ui.layout.VBox();
      layout.setSeparator("separator-vertical");
      this.setLayout(layout);
      this.messenger = new tvproui.messager.messenger.Roster();
      this.add(this.messenger, {
        flex : 1
      });
      this.add(this.createToolbar());
      var textArea = this.textArea = new qx.ui.form.TextArea();
      textArea.setPlaceholder("请输入发送内容");
      this.add(textArea);

      // 初始化拖放
      this._initDrop();

      // 界面逻辑和数据逻辑分离timer
      var timer = qx.util.TimerManager.getInstance();
      timer.start(function(userData, timerId)
      {
        this.add(this.createSendLine());
        this.refresh();
      }, 0, this, 150);
    },


    /**
     * TODOC
     *
     */
    refresh : function()
    {
      var model = tvproui.messager.messenger.MessageModel.loadModel();
      this.messenger.setModel(model);
    },


    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    createToolbar : function()
    {
      var toolbar = new qx.ui.toolbar.ToolBar();
      var part = new qx.ui.toolbar.Part();
      toolbar.add(part);
      this._toolBar = part;
      part.add(new qx.ui.basic.Label("附件"));


      /*
            var delButton = new qx.ui.toolbar.Button(
              "", "tvproui/imicons/user_delete.png"
            ).set({
              show: "icon"
            });

            this.messenger.bind("selection.length", delButton, "enabled", {
              converter : function(value) {
                return value > 0;
              }
            });

            delButton.addListener("execute", function() {
              this.messenger.getModel().remove(this.messenger.getSelection().getItem(0));
            }, this);
            part.add(delButton);
      */
      return part;
    },


    /**
     * TODOC
     *
     */
    _initDrop : function()
    {
      this.setDroppable(true);
      this.addListener("drop", function(e)
      {
        var type = e.supportsType("EPGVersion");
        if (type)
        {
          var dropData = e.getData("EPGVersion");
          var EPGVersions = dropData.data;
          var channelIcon = dropData.icon;
          for (var i = 0; i < EPGVersions.length; i++)
          {
            var node = EPGVersions[i].item;
            var row = node.columnData.row;
            var configuration =
            {
              EPGVersionID : node.nodeId,
              channelID : row.channelID,
              channelName : row.channelName,
              channelICON : channelIcon,
              broadcastdate : row.broadcastdate,
              name : row.name + " (" + row.broadcastdate + ")",
              type : "epgVersion",
              displayName : row.name,
              icon : node.icon,
              status : row.status
            };
            this.addAttachment(row.name, tvproui.utils.JSON.stringify(configuration), node.icon);
          }
        }
      }, this);
    },


    /**
     * TODOC
     *
     * @param name {var} TODOC
     * @param json {var} TODOC
     * @param icon {var} TODOC
     */
    addAttachment : function(name, json, icon)
    {
      var toolBar = this._toolBar;
      var button = new qx.ui.toolbar.Button(name, icon);
      toolBar.add(button);
      button.addListener("execute", function(e)
      {
        if (!confirm("是否要删除附件?")) {
          return;
        }
        toolBar.remove(button);
        this._attachment = null;
      }, this);
      if (this._attachment) {
        toolBar.remove(this._attachment.button);
      }
      this._attachment =
      {
        button : button,
        json : json
      };
    },


    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    createSendLine : function()
    {
      var composite = new qx.ui.container.Composite(new qx.ui.layout.Canvas());
      composite.add(new qx.ui.basic.Label("发送给"),
      {
        left : 10,
        top : 10
      });
      var sentTo = this.sentTo = new qx.ui.form.SelectBox();
      sentTo.getChildControl("atom").getChildControl("icon").set(
      {
        width : 22,
        height : 22,
        scale : true
      });
      var result = tvproui.AjaxPort.call("Message/getAvailableUsers");
      if (null == result)
      {
        dialog.Dialog.error("获取可用目标用户失败!");
        this.close();
      }
      for (var i = 0, l = result.length; i < l; i++)
      {
        var user = result[i];
        sentTo.add(new qx.ui.form.ListItem(user.alias, tvproui.system.fileManager.path(user.imagepath), user.username));
      }
      var sendButton = new qx.ui.form.Button("发送");
      composite.add(sentTo, {
        left : 55
      });
      composite.add(sendButton,
      {
        right : 10,
        top : 3
      });
      sendButton.addListener("execute", this.onSendButton, this);
      return composite;
    },


    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    onSendButton : function(e)
    {

      // 取日发送数据
      var subject = this.textArea.getValue();

      // 取发送目标
      var receivers = this.sentTo.getModelSelection().getItem(0);
      var link = "没有附件";
      if (this._attachment) {
        link = this._attachment.json;
      }

      // 发送
      var result = tvproui.messager.messenger.MessageModel.sendMessage(subject, receivers, link);
      if (null == result)
      {
        dialog.Dialog.error("发送消息失败!");
        this.close();
      }

      // 清理附件
      var toolBar = this._toolBar;
      if (this._attachment) {
        toolBar.remove(this._attachment.button);
      }

      // 清理发送内容
      var subject = this.textArea.setValue("");
    },


    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    createDetailsView : function()
    {
      var controller = new qx.data.controller.Object();
      this.messenger.bind("selection[0]", controller, "model");
      var box = new qx.ui.groupbox.GroupBox("Contact Details");
      var grid = new qx.ui.layout.Grid(5, 5);
      grid.setColumnAlign(0, "right", "middle");
      box.setLayout(grid);
      box.add(new qx.ui.basic.Label("Name: "),
      {
        row : 0,
        column : 0
      });
      var inpName = new qx.ui.form.TextField();
      controller.addTarget(inpName, "value", "name", true);
      box.add(inpName,
      {
        row : 0,
        column : 1
      });
      box.add(new qx.ui.basic.Label("Group: "),
      {
        row : 1,
        column : 0
      });
      var inpGroup = new qx.ui.form.VirtualComboBox();
      inpGroup.setLabelPath("name");
      inpGroup.setModel(this.messenger.getGroups());
      controller.addTarget(inpGroup, "value", "group", true);
      box.add(inpGroup,
      {
        row : 1,
        column : 1
      });
      box.add(new qx.ui.basic.Label("Avatar: ").set( {
        alignY : "top"
      }),
      {
        row : 3,
        column : 0
      });
      var inpAvatar = new qx.ui.basic.Image().set(
      {
        alignX : "center",
        maxWidth : 70,
        maxHeight : 70,
        scale : true
      });
      controller.addTarget(inpAvatar, "source", "avatar");
      box.add(inpAvatar,
      {
        row : 3,
        column : 1
      });
      return box;
    }
  },

  // 界面之外的内容释放
  destruct : function()
  {

    // 释放非显示层级对象
    // 去除多余的引用
    this._toolBar = null;
    this._attachment = null;
  }
});
