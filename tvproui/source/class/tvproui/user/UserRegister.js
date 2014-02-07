
/**
 * @author Weibo Zhang
 */

/* ************************************************************************
#asset(qx/icon/${qx.icontheme}/22/apps/*)
#asset(qx/icon/${qx.icontheme}/48/apps/*)
************************************************************************ */
qx.Class.define("tvproui.user.UserRegister",
{
  extend: tvproui.control.ui.window.Window,
  statics:
  {
    applicationName: "注册新用户",
    applicationIcon: "icon/22/apps/preferences-users.png",
    canMultipleSupport: false
  },
  events: {
    UserRegister: "qx.event.type.Data"
  },
  construct : function()
  {
    this.base(arguments);
    var layout = new qx.ui.layout.Grid(12, 6);
    this.setLayout(layout);
    this.setModal(true);
    this.setResizable(false);
    this.setAllowMaximize(false);
    this.setAllowMinimize(false);
    var form = new qx.ui.form.Form();
    var manager = new qx.ui.form.validation.Manager();
    var controller = new qx.data.controller.Form(null, form);

    /* 第一行 */
    /* 第一列， 用户图片和名称 */
    this._imageID = 1;
    /*创建image并加入到this,rowSpan 2*/
    var userImage = new qx.ui.basic.Image(tvproui.system.fileManager.path("uploads/images/1.png"));
    this.add(userImage,{
      row: 0,
      column: 0,
      rowSpan: 2
    });
    /*设置48*48 scale 为true*/
    userImage.set({
      width:48,
      height:48,
      scale: true
    })
    userImage.setDecorator(new qx.ui.decoration.Single(1, null, "#cccccc"));
    userImage.addListener("dblclick", this._changeImage, this);
    this._imageControl = userImage;
    /*name*/
    var usernameInput = new qx.ui.form.TextField();
    this.add(usernameInput,{
      row: 0,
      column: 1
    });

    usernameInput.setPlaceholder("用户姓名");
    usernameInput.setRequired(true);
    usernameInput.setTabIndex(1);
    form.add(usernameInput,"登录名称",null,"username");

    manager.add(usernameInput, qx.util.Validate.regExp(/^[a-zA-Z]{1}([a-zA-Z0-9]|[._]){2,9}$/, "请输入3~10位非字母开头的字符串作为登录名称"));
    var aliasInput = new qx.ui.form.TextField();
    this.add(aliasInput,
    {
      row : 1,
      column : 1
    });
    aliasInput.setPlaceholder("真实名称");
    aliasInput.setTabIndex(2);
    aliasInput.setRequired(true);
    aliasInput.setValue("");
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
    for (var i = 0, l = nodes.length; i < l; i++)
    {
      var node = nodes[i];
      channelNameSelect.add(new qx.ui.form.ListItem(node.name, tvproui.system.fileManager.path(node.path), node.ID));
    }
    channelNameSelect.setTabIndex(5);
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
    passwordInput.setTabIndex(3);
    passwordInput.setRequired(true);
    form.add(passwordInput, "密码", null, "password");
    manager.add(passwordInput, qx.util.Validate.regExp(/.{6,20}/, "请输入6~20位任意内容作为密码"));
    var passwordInputRepeate = new qx.ui.form.PasswordField();
    this.add(passwordInputRepeate,
    {
      row : 3,
      column : 1
    });
    passwordInputRepeate.setTabIndex(4);
    passwordInputRepeate.setRequired(true);
    form.add(passwordInputRepeate, "重复", null, "passwordRepeat");
    manager.add(passwordInputRepeate, qx.util.Validate.regExp(/.{6,20}/, "请输入6~20位任意内容作为密码"));

    /* 第二列 手机号码、账号启用和邮箱 */
    var cellPhoneInput = new qx.ui.form.TextField();
    this.add(cellPhoneInput,
    {
      row : 2,
      column : 2
    });
    cellPhoneInput.setPlaceholder("手机号码");
    cellPhoneInput.setTabIndex(6);
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
    actvieCheckbox.setTabIndex(7);
    actvieCheckbox.setValue(true);
    form.add(actvieCheckbox, "账号启用", null, "enabled");
    var emailInput = new qx.ui.form.TextField();
    this.add(emailInput,
    {
      row : 3,
      column : 2,
      colSpan : 2
    });
    emailInput.setPlaceholder("邮箱地址");
    emailInput.setTabIndex(8);
    emailInput.setRequired(true);
    form.add(emailInput, "邮箱地址", null, "email");
    manager.add(emailInput, qx.util.Validate.email());

    /* 第三行 */
    var buttonConfirm = new qx.ui.form.Button("注册", "icon/22/actions/list-add.png");
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
      var result = tvproui.AjaxPort.call("User/registerUser",
      {
        "username" : model.getUsername(),
        "alias" : model.getAlias(),
        "password" : md5(model.getPassword()),
        "email" : model.getEmail(),
        "mobilephone" : model.getMobilephone(),
        "status" : (model.getEnabled() ? '1' : '2'),
        "imageid" : this._imageID,
        "resourceid" : model.getChannelID()
      });
      if (!result)
      {
        dialog.Dialog.error("用户注册失败!");
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
      var valid = passwordInput.getValue() == passwordInputRepeate.getValue();
      if (!valid)
      {
        var message = "密码必须匹配.";
        passwordInput.setInvalidMessage(message);
        passwordInputRepeate.setInvalidMessage(message);
        passwordInput.setValid(false);
        passwordInputRepeate.setValid(false);
      }
      return valid;
    });
  },
  members :
  {
    _imageControl : null,
    _imageID : null,
    _GalleryWindow : null,

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
    },


    /**
     * TODOC
     *
     */
    close : function()
    {
      this.fireDataEvent("UserRegister");
      this.base(arguments);
    }
  },

  // 界面之外的内容释放
  destruct : function()
  {

    // 释放非显示层级对象
    this._imageControl = null;
    this._imageID = null;
    this._GalleryWindow = null;
  }
});
