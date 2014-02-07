
/**
 * @author Weibo Zhang
 */

/* ************************************************************************
#asset(qx/icon/${qx.icontheme}/22/apps/*)
#asset(qx/icon/${qx.icontheme}/48/apps/*)
************************************************************************ */
qx.Class.define("tvproui.user.UserPerference",
{
  extend : tvproui.control.ui.window.Window,
  statics :
  {
    applicationName : "用户配置",
    applicationIcon : "icon/22/apps/preferences-users.png",
    canMultipleSupport : false
  },

  // 可以传入用户ID，也可以不传入
  construct : function(data)
  {
    this.base(arguments);
    var result;
    if (data)
    {
      this._username = data.username;
      result = tvproui.AjaxPort.call("User/getRegisterInfo", {
        "ID" : data.userID
      });
    } else
    {
      this._username = tvproui.user.LoginWindow.currentUsername;
      result = tvproui.AjaxPort.call("User/getRegisterInfo");
    }
    if (null == result)
    {
      dialog.Dialog.error("加载用户信息失败!");
      this.close();
    }
    var layout = new qx.ui.layout.Grid(12, 6);
    this.setLayout(layout);
    this.setResizable(false);
    this.setAllowMaximize(false);
    this.setAllowMinimize(true);
    var form = new qx.ui.form.Form();
    var manager = new qx.ui.form.validation.Manager();
    var controller = new qx.data.controller.Form(null, form);

    /* 第一行 */
    /* 第一列， 用户图片和名称 */
    this._imageID = result.imageid;
    var userImage = new qx.ui.basic.Image(tvproui.system.fileManager.path(result.imagepath));
    this.add(userImage,
    {
      row : 0,
      column : 0,
      rowSpan : 2
    });
    userImage.set(
    {
      width : 48,
      height : 48,
      scale : true
    });
    userImage.setDecorator(new qx.ui.decoration.Single(1, null, "#cccccc"));
    userImage.addListener("dblclick", this._changeImage, this);
    this._imageControl = userImage;
    var usernameInput = new qx.ui.basic.Label(result.username);
    this.add(usernameInput,
    {
      row : 0,
      column : 1
    });
    var aliasInput = new qx.ui.form.TextField();
    this.add(aliasInput,
    {
      row : 1,
      column : 1
    });
    aliasInput.setPlaceholder("真实名称");
    aliasInput.setTabIndex(1);
    aliasInput.setValue(result.alias);
    form.add(aliasInput, "真实名称", null, "alias");
    manager.add(aliasInput, qx.util.Validate.regExp(/^.{2,10}$/, "请输入2~10位内容作为真实名称"));

    /* 第二列， 频道图片和名称 */
    var channelNameSelect = new qx.ui.form.SelectBox();
    this.add(channelNameSelect,
    {
      row : 0,
      column : 2,
      rowSpan : 2,
      colSpan : 2
    });
    var nodes = tvproui.AjaxPort.call("resourceTree/getResourcesByLevel", {
      "level" : "1"
    });
    if (null == nodes) {
      return;
    }
    var item;
    for (var i = 0, l = nodes.length; i < l; i++)
    {
      var node = nodes[i];
      var item = new qx.ui.form.ListItem(node.name, tvproui.system.fileManager.path(node.path), node.ID);
      channelNameSelect.add(item);
      if (result.topresourceid == node.ID) {
        channelNameSelect.getSelection().push(item);
      }
    }
    channelNameSelect.setTabIndex(4);
    channelNameSelect.setEnabled(data ? true : false);
    form.add(channelNameSelect, "频道选择", null, "channelID");

    /* 第二行 */
    /* 第一列密码 */
    this.add(new qx.ui.basic.Label("密码(6位+)"),
    {
      row : 2,
      column : 0
    });
    this.add(new qx.ui.basic.Label("重复"),
    {
      row : 3,
      column : 0
    });
    var passwordInput = new qx.ui.form.PasswordField();
    this.add(passwordInput,
    {
      row : 2,
      column : 1
    });
    passwordInput.setTabIndex(2);
    passwordInput.setPlaceholder("留白不修改");
    form.add(passwordInput, "密码", null, "password");
    var passwordInputRepeate = new qx.ui.form.PasswordField();
    this.add(passwordInputRepeate,
    {
      row : 3,
      column : 1
    });
    passwordInputRepeate.setTabIndex(3);
    passwordInputRepeate.setPlaceholder("留白不修改");
    form.add(passwordInputRepeate, "重复", null, "passwordRepeat");

    /* 第二列 手机号码、账号启用和邮箱 */
    var cellPhoneInput = new qx.ui.form.TextField();
    this.add(cellPhoneInput,
    {
      row : 2,
      column : 2
    });
    cellPhoneInput.setPlaceholder("手机号码");
    cellPhoneInput.setTabIndex(5);
    cellPhoneInput.setValue(result.mobilephone);
    cellPhoneInput.setRequired(true);
    form.add(cellPhoneInput, "手机号码", null, "mobilephone");
    manager.add(cellPhoneInput, qx.util.Validate.regExp(/^(13[0-9]{9})|(15[89][0-9]{8})|(18[0-9]{9})$/, "请输入中国境内的手机号码,不包含+86"));
    cellPhoneInput.setWidth(90);
    var actvieCheckbox = new qx.ui.form.CheckBox("账号启用");
    this.add(actvieCheckbox,
    {
      row : 2,
      column : 3
    });
    actvieCheckbox.setEnabled(data ? true : false);
    actvieCheckbox.setValue((result.status == 1));
    form.add(actvieCheckbox, "账号启用", null, "enabled");
    var emailInput = new qx.ui.form.TextField();
    this.add(emailInput,
    {
      row : 3,
      column : 2,
      colSpan : 2
    });
    emailInput.setPlaceholder("邮箱地址");
    emailInput.setTabIndex(6);
    emailInput.setRequired(true);
    emailInput.setValue(result.email);
    form.add(emailInput, "邮箱地址", null, "email");
    manager.add(emailInput, qx.util.Validate.email());

    /* 第三行 */
    var buttonConfirm = new qx.ui.form.Button("修改", "icon/22/actions/list-add.png");
    this.add(buttonConfirm,
    {
      row : 4,
      column : 2
    });
    buttonConfirm.addListener("execute", function(e)
    {
      if (!manager.validate())
      {
        dialog.Dialog.error("对不起，您填写的内容不完整或有错误，请选择红色框标出的单元格填写并获得错误信息!");
        return;
      }
      var model = controller.createModel();
      var md5 = tvproui.utils.crypt.MD5.calculate;
      var username = this._username;
      if (model.getPassword() != "") {
        var result = tvproui.AjaxPort.call("User/changePassword",
        {
          "username" : username,
          "password" : md5(model.getPassword())
        });
      }
      var map = {

      };
      map[username] =
      {
        alias : model.getAlias(),
        email : model.getEmail(),
        mobilephone : model.getMobilephone(),
        status : (model.getEnabled() ? '1' : '2'),
        imageid : this._imageID,
        topresourceid : model.getChannelID()
      };
      var result = tvproui.AjaxPort.call("User/updateItems", {
        "data" : tvproui.utils.JSON.stringify(map)
      });
      if (!result)
      {
        dialog.Dialog.error("修改提交失败!");
        return;
      }
      this.close();
    }, this);
    var buttonCancel = new qx.ui.form.Button("取消", "icon/22/actions/dialog-close.png");
    this.add(buttonCancel,
    {
      row : 4,
      column : 3
    });
    buttonCancel.addListener("execute", function(e) {
      this.close();
    }, this);
    manager.setValidator(function(items)
    {
      var patten = /.{6,20}/;
      var valid = (passwordInput.getValue() == passwordInputRepeate.getValue());
      if (!valid)
      {
        var message = "密码必须匹配.";
        passwordInput.setInvalidMessage(message);
        passwordInputRepeate.setInvalidMessage(message);
        passwordInput.setValid(false);
        passwordInputRepeate.setValid(false);
        return valid;
      }
      if (passwordInput.getValue() != null)
      {
        valid = patten.exec(passwordInput.getValue());
        if (!valid)
        {
          var message = "请输入6~20位任意内容作为密码";
          passwordInput.setInvalidMessage(message);
          passwordInputRepeate.setInvalidMessage(message);
          passwordInput.setValid(false);
          passwordInputRepeate.setValid(false);
          return valid;
        }
      }
      return valid;
    });
  },
  members :
  {
    _imageControl : null,
    _imageID : null,
    _GalleryWindow : null,
    _username : null,

    //修改用户图片

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _changeImage : function(e)
    {

      /* BUGFIX:双击事件异常 */
      if (this._GalleryWindow) {
        return;
      }
      this._GalleryWindow = tvproui.Application.desktop.loadWindow(tvproui.gallery.gallery);
      this._GalleryWindow.addListenerOnce("ImageChange", this._onGalleryWindowClose, this);
    },

    // 关闭新建用户窗口时进行刷新

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onGalleryWindowClose : function(e)
    {
      if (!this._GalleryWindow.getIconID())
      {
        this._GalleryWindow = null;
        return;
      }
      this._imageID = this._GalleryWindow.getIconID();
      this._imageControl.setSource(this._GalleryWindow.getIconPath());
      this._GalleryWindow = null;
    }
  },

  // 界面之外的内容释放
  destruct : function()
  {

    // 释放非显示层级对象
    this._imageControl = null;
    this._imageID = null;
    this._GalleryWindow = null;
    this._username = null;
  }
});
