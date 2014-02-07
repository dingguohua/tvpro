
/**
 * @author Weibo Zhang
 */

/*************************************************************************
#asset(tvproui/*)
#asset(tvproui/aboutUS/*)
#asset(tvproui/login/*)
************************************************************************* */
qx.Class.define("tvproui.user.LoginWindow",
{
  extend : tvproui.control.ui.window.Window,
  events : {
    "login-success" : "qx.event.type.Event"
  },
  statics :
  {
    currentHostID: null,
    currentUsername : null,
    currentUserAlias : null,
    applicationName : "用户登录",
    applicationIcon : "tvproui/iconSmall.png",
    canMultipleSupport : false
  },
  construct : function()
  {
    this.base(arguments);
    this.setModal(true);
    this.setResizable(false);
    this.setShowMaximize(false);
    this.setShowMinimize(false);
    this.setShowClose(false);
    this.setAllowMaximize(false);
    this.setWidth(522);
    this.setHeight(324);
    this.setContentPadding(140, 0, 0, 100);
    this.setLayout(new qx.ui.layout.Dock());
    this.setAppearance("tvproLogin");
    var form = new qx.ui.form.Form();
    this._form = form;
    var usernameInput = new qx.ui.form.TextField();
    usernameInput.setRequired(true);
    form.add(usernameInput, "账号", null, "Username");
    this._usernameInput = usernameInput;
    var passwordInput = new qx.ui.form.PasswordField();
    passwordInput.setRequired(true);
    form.add(passwordInput, "密码", null, "Password");
    this._passwordInput = passwordInput;
    var verifyInput = new qx.ui.form.TextField();
    this._verifyInput = verifyInput;
    verifyInput.setRequired(true);
    form.add(verifyInput, "验证码", null, "Verify");
    var loginButton = new qx.ui.form.Button("登录");
    form.addButton(loginButton);
    this._loginButton = loginButton;
    var clearButton = new qx.ui.form.Button("清除");
    form.addButton(clearButton);
    var verifyOutput = new qx.ui.form.Button("刷新");
    form.addButton(verifyOutput);
    this._verifyOutput = verifyOutput;
    this._refreshVerfyCode();
    var resetter = new qx.ui.form.Resetter();
    this._resetter = resetter;

    //resetter.add(usernameInput);
    resetter.add(passwordInput);
    resetter.add(verifyInput);
    var renderer = new qx.ui.form.renderer.Single(form);
    var gLayout = renderer.getLayout();
    renderer.setMaxWidth(300);
    renderer.setMinWidth(300);
    renderer.setPaddingBottom(15);
    gLayout.setColumnWidth(0, 60);
    gLayout.setColumnFlex(1, 90);
    this.add(renderer, {
      edge : "center"
    });
    verifyOutput.addListener("execute", this._refreshVerfyCode, this);
    this.addListener("keydown", this._onKeyDown, this);
    loginButton.addListener("execute", this._onLoginButton, this);
    clearButton.addListener("execute", function() {
      resetter.reset();
    }, this);


    /*
        qx.event.Timer.once(function(e)
        {
            usernameInput.setValue("admin");
            passwordInput.setValue("kclo3");
            verifyInput.setValue("8888");
            loginButton.fireEvent("execute");
        }, this, 2000);
    */
    this.addListener("appear", this._onThisShowUI, this);
  },
  members :
  {
    _usernameInput : null,
    _passwordInput : null,
    _verifyOutput : null,
    _form : null,
    _resetter : null,
    _verifyInput : null,
    _loginButton : null,


    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _refreshVerfyCode : function(e)
    {
      var timenow = new Date().getTime();
      this._verifyOutput.setIcon("../../controller.php/User/verify/" + timenow);
    },


    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onThisShowUI : function(e)
    {
      this.removeListener("appear", this._onThisShowUI, this);

      /* 恢复上次登录成功用户的用户名称 */
      var username = tvproui.utils.Storage.get("tvpro_username");
      if (username)
      {
        this._usernameInput.setValue(username);
        this._passwordInput.focus();
      }
      else
      {
        this._usernameInput.focus();
      }
    },

    // 处理回车

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onKeyDown : function(e)
    {
      var key = e.getKeyCode();
      if (key != 13) {
        return;
      }
      qx.ui.core.FocusHandler.getInstance().focusNext();
    },

    _login: function(username, password, verify, hostID, hostName)
    {
      var md5 = tvproui.utils.crypt.MD5.calculate;
      var postData = {
        "username" : username,
        "password" : md5(password),
        "verify" : md5(verify),
        "hostID": hostID
      };

      if(hostName)
      {
        postData.hostName = hostName;
      }

      var result = tvproui.AjaxPort.call("User/login", postData, true);

      // 清除数据
      var resetter = this._resetter;
      if ((null == result) || ((null != result) && (result.type != "OK")))
      {
        this._refreshVerfyCode();
        this._effect = qx.bom.element.Animation.animate(this.getContainerElement().getDomElement(),
        {
          duration : 800,
          keyFrames :
          {
            0 : {
              translate : "0px"
            },
            10 : {
              translate : "-10px"
            },
            20 : {
              translate : "10px"
            },
            30 : {
              translate : "-10px"
            },
            40 : {
              translate : "10px"
            },
            50 : {
              translate : "-10px"
            },
            60 : {
              translate : "10px"
            },
            70 : {
              translate : "-10px"
            },
            80 : {
              translate : "10px"
            },
            90 : {
              translate : "-10px"
            },
            100 : {
              translate : "0px"
            }
          }
        });

        if (result.type != "Logon")
        {
          this._passwordInput.focus();
          dialog.Dialog.error(result.message);
          resetter.reset();
          this._loginButton.setEnabled(true);
          return;
        }

        dialog.Dialog.confirm(result.message + ",您希望注销之前的账号登陆吗?", function(result)
        {
          if (!result)
          {
            this._loginButton.setEnabled(true);
            return;
          }
          if (tvproui.AjaxPort.call("User/kickOffUser",
          {
            "username" : username,
            "password" : md5(password)
          }))
          {
            dialog.Dialog.alert("您的注销请求已经被提交至服务端，请您30秒后重新尝试登录");
            this._verifyInput.setValue("");
            this._verifyInput.focus();
          } else
          {
            dialog.Dialog.error("服务端拒绝了您的请求!");
          }
          this._loginButton.setEnabled(true);
        }, this);
        return;
      }

      /* 记录登录成功用户的用户名称 */
      tvproui.utils.Storage.set("tvpro_username", username);

      // 若为新建主机
      if(-1 == hostID)
      {
        var terminal = result.terminal;
        tvproui.utils.Storage.set("tvpro_hostID", terminal.id);
        tvproui.utils.Storage.set("tvpro_hostName", terminal.hostname);
      }

      // 记录当前用户信息
      tvproui.user.LoginWindow.currentUserAlias = result.message;
      tvproui.user.LoginWindow.currentHostID = hostID;

      /* 登录成功，关闭登录窗口 */
      this.fireEvent("login-success");
      this.close();
    },

    /**
     * TODOC
     *
     */
    _onLoginButton : function()
    {
      var form = this._form;
      if (!form.validate()) {
        return;
      }
      this._loginButton.setEnabled(false);
      var controller = new qx.data.controller.Form(null, form);
      controller.createModel();
      var model = controller.getModel();
      tvproui.user.LoginWindow.currentUsername = model.getUsername();
      
      var username = model.getUsername();
      var password = model.getPassword();
      var verify = model.getVerify();

      // 浏览器不支持本地存储功能，服务器端限制只读操作
        // 新计算机，还不认识
        var hostID = tvproui.utils.Storage.get("tvpro_hostID");
        if(!hostID)
        {
          hostID = -1;
          var formData =  
          {
            'hostName'   : 
            {
             'type'  : "ComboBox", 
              'label' : "请选择或输入您登陆的位置（非常重要）",
              'value' : "办公室",
              'options' : [
                 { 'label' : "办公室" }, 
                 { 'label' : "笔记本" }, 
                 { 'label' : "家里" }
               ]
            }
          };

          dialog.Dialog.form("定位离线存储位置",formData, function( result )
          {
            if(!result)
            {
              dialog.Dialog.error("您必须输入结果方可登陆!");
              this._refreshVerfyCode();
              this._loginButton.setEnabled(true);
              return;
            }

            this._login(username, password, verify, hostID, result.hostName);
          }, this);

          return;
        }

      this._login(username, password, verify, hostID, null);
    }
  },

  // 界面之外的内容释放
  destruct : function()
  {

    // 释放非显示层级对象
    // 去除多余的引用
    this._usernameInput = null;
    this._passwordInput = null;
    this._verifyOutput = null;
    this._form = null;
    this._resetter = null;
    this._verifyInput = null;
  }
});
