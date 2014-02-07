
/* ************************************************************************
#asset(qx/icon/${qx.icontheme}/32/places/*)
#asset(qx/icon/${qx.icontheme}/22/actions/*)
************************************************************************ */
qx.Class.define("tvproui.gallery.gallery",
{
  extend : tvproui.control.ui.window.Window,
  statics :
  {
    applicationName : "选择图片",
    applicationIcon : "icon/22/places/user-home.png",
    canMultipleSupport : false
  },
  events : {
    ImageChange : "qx.event.type.Data"
  },
  properties :
  {
    iconPath : {
      init : null
    },
    iconID : {
      init : null
    },
    selected : {
      init : false
    }
  },
  construct : function()
  {
    this.base(arguments);
    this.set(
    {
      contentPadding : 0,
      modal : true
    });
    var layout = new qx.ui.layout.Grid();
    layout.setRowFlex(0, 1);
    layout.setColumnFlex(0, 1);
    this.setLayout(layout);

    // auto size
    var container = new qx.ui.container.Composite(new qx.ui.layout.Grow()).set(
    {
      width : 400,
      height : 250
    });
    this.add(container,
    {
      row : 0,
      column : 0
    });
    this.itemHeight = 80;
    this.itemWidth = 80;
    this.itemPerLine = 1;
    this.items = this._generateItems();
    var scroller = this._createScroller();
    scroller.set(
    {
      scrollbarX : "off",
      scrollbarY : "auto"
    });
    scroller.getPane().addListener("resize", this._onPaneResize, this);
    container.add(scroller);
    this.manager = new qx.ui.virtual.selection.CellRectangle(scroller.getPane(), this).set( {
      mode : "single"
    });
    this.manager.attachMouseEvents();
    this.manager.attachKeyEvents(scroller);
    this.__cell = new tvproui.gallery.galleryCell();
    this.add(this._initToolBar(),
    {
      row : 1,
      column : 0
    });
  },
  members :
  {
    items : null,
    __cell : null,
    _prefecher : null,

    /* 初始化工具栏 */

    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    _initToolBar : function()
    {
      var toolbar = new qx.ui.toolbar.ToolBar();

      /* 工具栏的编辑分段 */
      var editPart = new qx.ui.toolbar.Part();
      toolbar.add(editPart);

      /* 注册用户 */
      var uploadButton = new com.zenesis.qx.upload.UploadToolbarButton("上传", "icon/22/actions/list-add.png");
      var uploader = new com.zenesis.qx.upload.UploadMgr(uploadButton, "../../controller.php/file/upload");
      var progress = new qx.ui.indicator.ProgressBar(0, 100);
      var label = new qx.ui.basic.Label();
      var actionPart;
      editPart.add(uploadButton);

      //addButton.addListener("execute", this._addNewUser, this);
      uploader.setAutoUpload(true);
      uploader.setParam("subDirectory", "images");
      uploader.addListener("addFile", function(evt)
      {
        var file = evt.getData();
        actionPart.show();
        var progressListenerId = file.addListener("changeProgress", function(evt)
        {
          var current = evt.getData();
          progress.setValue(current);
          label.setValue(file.getFilename() + ": " + Math.round(current / file.getSize() * 100) + "%");
        }, this);
        var stateListenerId = file.addListener("changeState", function(evt)
        {
          var state = evt.getData();
          if (state == "uploaded")
          {
            var target = evt.getTarget();
            var fileNames = tvproui.AjaxPort.responseParse("../../controller.php/file/upload", target.getResponse(), false, "subDirectory=images");
            for (var i = 0, l = fileNames.length; i < l; i++)
            {
              var fileName = fileNames[i];
              var imageResult = tvproui.AjaxPort.call("image/uploadImage",
              {
                "imagename" : file.getFilename(),
                "desc" : "",
                "path" : fileName
              });
              if (!imageResult)
              {
                dialog.Dialog.error("上传图片" + fileName + "信息至服务器失败，请联系管理员!");
                continue;
              }
              this.onRefresh();
            }
          } else if (state == "cancelled") {
          }

          if (state == "uploaded" || state == "cancelled")
          {
            actionPart.hide();
            file.removeListenerById(stateListenerId);
            file.removeListenerById(progressListenerId);
          }
        }, this);
      }, this);

      /* 删除图片 */
      var deleteButton = new qx.ui.toolbar.Button("删除", "icon/22/actions/list-remove.png");
      editPart.add(deleteButton);
      deleteButton.addListener("execute", this._onDelete, this);

      /* 刷新 */
      var refreshButton = new qx.ui.toolbar.Button("刷新", "icon/22/actions/view-refresh.png");
      editPart.add(refreshButton);
      refreshButton.addListener("execute", this.onRefresh, this);
      actionPart = new qx.ui.toolbar.Part();
      toolbar.add(actionPart);
      actionPart.add(progress);
      actionPart.add(label);
      actionPart.hide();
      return toolbar;
    },


    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onDelete : function(e)
    {
      var itemPos = this.manager.getSelectedItem();
      var item = this.getItemData(itemPos.row, itemPos.column);
      var deleteResult = tvproui.AjaxPort.call("image/deleteImage", {
        "ID" : item.ID
      });
      if (!deleteResult) {
        dialog.Dialog.error("删除图片时服务器失败，请联系管理员!");
      }
      this.onRefresh();
    },


    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    onRefresh : function(e)
    {
      this.items = this._generateItems();
      this.layer.updateLayerData();
    },


    /**
     * TODOC
     *
     * @param row {var} TODOC
     * @param column {var} TODOC
     * @return {var} TODOC
     */
    getItemData : function(row, column) {
      return this.items[row * this.itemPerLine + column];
    },


    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    _createScroller : function()
    {
      var scroller = new qx.ui.virtual.core.Scroller(1, this.itemPerLine, this.itemHeight, this.itemWidth);
      this.layer = new qx.ui.virtual.layer.WidgetCell(this);
      scroller.getPane().addLayer(this.layer);

      // Creates the prefetch behavior
      this._prefecher = new qx.ui.virtual.behavior.Prefetch(scroller,
      {
        minLeft : 0,
        maxLeft : 0,
        minRight : 0,
        maxRight : 0,
        minAbove : 200,
        maxAbove : 300,
        minBelow : 600,
        maxBelow : 800
      }).set( {
        interval : 500
      });
      return scroller;
    },


    /**
     * TODOC
     *
     * @param item {var} TODOC
     * @return {var} TODOC
     */
    isItemSelectable : function(item) {
      return !!this.getItemData(item.row, item.column);
    },


    /**
     * TODOC
     *
     * @param item {var} TODOC
     * @param type {var} TODOC
     * @param wasAdded {var} TODOC
     */
    styleSelectable : function(item, type, wasAdded)
    {
      if (type !== "selected") {
        return;
      }
      var widgets = this.layer.getChildren();
      for (var i = 0; i < widgets.length; i++)
      {
        var widget = widgets[i];
        var row = widget.getUserData("cell.row");
        var column = widget.getUserData("cell.column");
        if (item.row !== row || item.column !== column) {
          continue;
        }
        if (wasAdded) {
          this.__cell.updateStates(widget, {
            selected : 1
          });
        } else {
          this.__cell.updateStates(widget, {

          });
        }
      }
    },


    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    _onPaneResize : function(e)
    {
      var pane = e.getTarget();
      var width = e.getData().width;
      var colCount = Math.floor(width / this.itemWidth);
      if (colCount == this.itemsPerLine) {
        return;
      }
      this.itemPerLine = colCount;
      var rowCount = Math.ceil(this.itemCount / colCount);
      pane.getColumnConfig().setItemCount(colCount);
      pane.getRowConfig().setItemCount(rowCount);
    },


    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    _generateItems : function()
    {
      var items = [];
      var images = tvproui.AjaxPort.call("image/listAllImage");
      var count = images.length;
      this.itemCount = count;
      for (var i = 0; i < count; i++)
      {
        var image = images[i];
        var url = tvproui.system.fileManager.path(image.path);
        items[i] =
        {
          ID : image.ID,
          label : image.imagename,
          description : image.desc,
          icon : url
        };
      }
      return items;
    },


    /**
     * TODOC
     *
     * @param row {var} TODOC
     * @param column {var} TODOC
     * @return {null | var} TODOC
     */
    getCellWidget : function(row, column)
    {
      var itemData = this.getItemData(row, column);
      if (!itemData) {
        return null;
      }
      var cell =
      {
        row : row,
        column : column
      };
      var states = {

      };
      if (this.manager.isItemSelected(cell)) {
        states.selected = true;
      }
      var widget = this.__cell.getCellWidget(itemData, states);
      widget.setUserData("cell", cell);
      widget.setUserData("ID", itemData.ID);
      widget.addListener("dblclick", this.onIconDoubleClick, this);
      return widget;
    },


    /**
     * TODOC
     *
     * @param e {Event} TODOC
     */
    onIconDoubleClick : function(e)
    {
      var clickedIcon = e.getTarget();

      /* BUGFIX:双击事件异常 */
      if (this.getIconPath()) {
        return;
      }
      this.setIconPath(clickedIcon.getIcon());
      this.setIconID(clickedIcon.getUserData("ID"));
      this.setSelected(true);
      this.close();
    },


    /**
     * TODOC
     *
     * @param widget {var} TODOC
     */
    poolCellWidget : function(widget)
    {
      widget.removeListener("dbclick", this.onIconDoubleClick, this);
      this.__cell.pool(widget);
    },


    /**
     * TODOC
     *
     */
    refresh : function() {
      this.onRefresh();
    },


    /**
     * TODOC
     *
     */
    close : function()
    {
      this.fireDataEvent("ImageChange", this.getIconID());
      this.base(arguments);
    }
  },
  destruct : function()
  {
    this._disposeObjects("_prefecher");
    this._disposeObjects("manager");
    this.items = null;
    this.__cell = null;
    this._prefecher = null;
  }
});
