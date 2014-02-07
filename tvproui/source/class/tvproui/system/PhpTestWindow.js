
/**
 * @author Administrator
 */

/* ************************************************************************
#asset(qx/icon/${qx.icontheme}/22/categories/*)
************************************************************************ */
qx.Class.define("tvproui.system.PhpTestWindow",
{
  extend : tvproui.control.ui.window.Window,
  statics :
  {
    applicationName : "PHP测试窗口",
    applicationIcon : "icon/22/places/network-server.png",
    canMultipleSupport : true
  },

  construct : function()
  {
    this.base(arguments);
    this.setLayout(new qx.ui.layout.VBox());

    // adjust size
    //this.setMinWidth(250);
    //this.setMinHeight(200);
    //this.setModal(true);
    var form = new qx.ui.form.Form();
    var URLInput = new qx.ui.form.TextField();
    URLInput.setRequired(true);
    form.add(URLInput, "URL", null, "URL");
    var parameterInput = new qx.ui.form.TextField();
    parameterInput.setRequired(true);
    form.add(parameterInput, "参数", null, "paramter");


    /*
    var methodRadioGroup = new qx.ui.form.RadioButtonGroup();
    var methodGetButton = new qx.ui.form.RadioButton("GET");
    var methodPostButton = new qx.ui.form.RadioButton("POST");
    methodGetButton.setModel("GET");
    methodPostButton.setModel("POST");

    methodRadioGroup.add(methodGetButton);
    methodRadioGroup.add(methodPostButton);

    form.add(methodRadioGroup, "模式", null, 'method');
    */
    var controller = new qx.data.controller.Form(null, form);
    controller.createModel();
    var sendbutton = new qx.ui.form.Button("发送");
    form.addButton(sendbutton);
    var testbutton = new qx.ui.form.Button("测试");
    form.addButton(testbutton);
    var renderer = new qx.ui.form.renderer.Single(form);
    var gLayout = renderer.getLayout();
    renderer.setMinWidth(300);
    gLayout.setColumnWidth(0, 60);
    gLayout.setColumnFlex(1, 90);
    this.add(renderer);

    //this.add(sendbutton);
    testbutton.addListener("execute", function()
    {
      if (this.command) {
        this.command();
      }
      return;

      /* 时间测试 */
      if (tvproui.utils.Time.test()) {
        dialog.Dialog.error("时间测试成功!");
      } else {
        dialog.Dialog.error("时间测试失败!");
      }
      if (tvproui.utils.Duration.test()) {
        dialog.Dialog.error("时间间隔测试成功!");
      } else {
        dialog.Dialog.error("时间测试失败!");
      }
    }, this);
    sendbutton.addListener("execute", function() {
      if (form.validate())
      {
        var model = controller.getModel();
        var result = tvproui.AjaxPort.call(model.getURL(), model.getParamter());
        dialog.Dialog.error(result);
      }
    }, this);
  },

  // 界面之外的内容释放
  destruct : function() {
  }
});
