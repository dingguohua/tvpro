
/**
 * @author Administrator
 */
qx.Class.define("tvproui.resourceTree.PropertyWindow",
{
  extend : tvproui.control.ui.window.Window,
  statics :
  {
    applicationName : "资源树属性",
    applicationIcon : "icon/22/places/user-home.png",
    canMultipleSupport : false
  },
  properties : {
    successed : {
      init : false
    }
  },
  construct : function(node)
  {
    this._node = node;
    this.base(arguments);
    this.setCaption(node.getName() + " 属性");
    this.setModal(true);
    this.setResizable(false);
    this.setShowMaximize(false);
    this.setShowMinimize(false);
    this.setAllowMaximize(false);
    var layout = new qx.ui.layout.Grid(12, 6);
    this.setLayout(layout);

    /* 图片控件 第一行第一列 */
    this._imageID = node.getImageid();
    this._oldImageID = this._imageID;
    var userImage = new qx.ui.basic.Image(node.getPath());
    this.add(userImage,
    {
      row : 0,
      column : 0
    });
    userImage.set(
    {
      width : 22,
      height : 22,
      scale : true
    });
    userImage.setDecorator(new qx.ui.decoration.Single(1, null, "#cccccc"));
    userImage.addListener("dblclick", this._changeImage, this);
    this._imageControl = userImage;

    /* 名称控件 第一行第二列，跨过一列 */
    var form = new qx.ui.form.Form();
    this._form = form;
    var labelInput = new qx.ui.form.TextField(node.getName());
    labelInput.setRequired(true);
    form.add(labelInput, "名称", null, "label");
    this.add(labelInput,
    {
      row : 0,
      column : 1,
      colSpan : 2
    });
    var editButton = new qx.ui.form.Button("修改");
    this.add(editButton,
    {
      row : 1,
      column : 1
    });
    var clearButton = new qx.ui.form.Button("复原");
    this.add(clearButton,
    {
      row : 1,
      column : 2
    });
    var resetter = new qx.ui.form.Resetter();
    resetter.add(labelInput);
    var controller = new qx.data.controller.Form(null, form);
    controller.createModel();
    this._controller = controller;
    this._resetter = resetter;
    labelInput.selectAllText();
    editButton.addListener("execute", this.onEditButton, this);
    clearButton.addListener("execute", this.onClearButton, this);
  },
  members :
  {
    _oldImageID : null,
    _imageID : null,
    _imageControl : null,
    _controller : null,
    _resetter : null,
    _node : null,

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
      this._GalleryWindow.addListener("disappear", this._onGalleryWindowClose, this);
    },

    // 关闭新建用户窗口时进行刷新

    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onGalleryWindowClose : function(e)
    {
      this._GalleryWindow.removeListener("disappear", this._onGalleryWindowClose, this);
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
     * @return {boolean} TODOC
     */
    onEditButton : function()
    {
      var node = this._node;
      var form = this._form;
      var controller = this._controller;
      var resetter = this._resetter;
      if (!form.validate()) {
        return false;
      }
      var model = controller.getModel();
      if (!tvproui.resourceTree.Node.rename(node, model.getLabel()))
      {
        resetter.reset();
        this.close();
        return false;
      }

      //修改图片在服务器上的ID
      if (this._oldImageID != this._imageID)
      {
        node.setPath(this._imageControl.getSource());
        tvproui.resourceTree.Node.changeIcon(node, this._imageID);
      }
      resetter.reset();
      this.setSuccessed(true);

      /* 修改成功，关闭登录窗口 */
      this.close();
    },


    /**
     * TODOC
     *
     */
    onClearButton : function()
    {
      var resetter = this._resetter;
      resetter.reset();
    }
  },

  // 界面之外的内容释放
  destruct : function()
  {

    // 去除多余的引用
    this._oldImageID = null;
    this._imageID = null;
    this._imageControl = null;
    this._controller = null;
    this._resetter = null;
    this._node = null;
  }
});
