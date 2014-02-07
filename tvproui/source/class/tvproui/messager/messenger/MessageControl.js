
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
   * Fabian Jakobs (fjakobs)
   * Jonathan Weiß (jonathan_rass)
   * Christian Hagendorn (chris_schmidt)

************************************************************************ */

/* ************************************************************************
************************************************************************ */
qx.Class.define("tvproui.messager.messenger.MessageControl",
{
  extend : qx.ui.core.Widget,
  construct : function()
  {
    this.base(arguments);
    this.set( {
      padding : [0, 3]
    });
    var layout = new qx.ui.layout.Grid();
    this._setLayout(layout);
    this._add(this.getChildControl("content"),
    {
      row : 0,
      column : 0
    });
    this._add(this.getChildControl("attachment"),
    {
      row : 1,
      column : 0
    });
    this._add(this.getChildControl("icon"),
    {
      row : 0,
      column : 1
    });
    this._add(this.getChildControl("name"),
    {
      row : 1,
      column : 1
    });
    layout.setColumnFlex(0, 1);
  },
  properties :
  {

    // overridden
    appearance :
    {
      refine : true,
      init : "listitem"
    },
    dataID : {
      check : "Integer"
    },
    name :
    {
      check : "String",
      apply : "_applyName",
      init : ""
    },
    content :
    {
      check : "String",
      apply : "_applyContent",
      init : ""
    },
    avatar :
    {
      check : "String",
      apply : "_applyAvatar",
      init : ""
    },
    status :
    {
      check : "Integer",
      apply : "_applyStatus",
      init : 0
    },
    attachment :
    {
      check : "String",
      apply : "_applyAttachment",
      init : ""
    }
  },
  members :
  {

    // overridden

    /**
     * TODOC
     *
     * @param id {var} TODOC
     * @param hash {Map} TODOC
     * @return {var} TODOC
     */
    _createChildControlImpl : function(id, hash)
    {
      var control;
      switch (id)
      {
        case "name":control = new qx.ui.basic.Label().set(
        {
          padding : 3,
          alignX : "center"
        });
        break;
        case "content":control = new qx.ui.basic.Label().set(
        {
          padding : 3,
          rich : true
        });
        break;
        case "attachment":control = new qx.ui.basic.Label().set(
        {
          padding : 3,
          rich : true,
          alignX : "right"
        });
        break;
        case "icon":control = new qx.ui.basic.Image().set(
        {
          width : 48,
          height : 48,
          scale : true
        });
        break;
      }
      return control || this.base(arguments, id);
    },

    // apply method

    /**
     * TODOC
     *
     * @param value {var} TODOC
     * @param old {var} TODOC
     */
    _applyName : function(value, old) {
      this.getChildControl("name").setValue(value);
    },

    // apply method

    /**
     * TODOC
     *
     * @param value {var} TODOC
     * @param old {var} TODOC
     */
    _applyContent : function(value, old)
    {
      var boldLeft = "<b class='listItemBold'>";
      var boldRight = "</b>";
      if (0 == this.getStatus()) {
        this.getChildControl("content").setValue(boldLeft + value + boldRight);
      } else {
        this.getChildControl("content").setValue(value);
      }
    },

    // apply method

    /**
     * TODOC
     *
     * @param value {var} TODOC
     * @param old {var} TODOC
     */
    _applyAvatar : function(value, old) {
      this.getChildControl("icon").setSource(value);
    },


    /**
     * TODOC
     *
     * @param value {var} TODOC
     * @param old {var} TODOC
     */
    _applyAttachment : function(value, old)
    {
      if (value == "没有附件")
      {
        this.getChildControl("attachment").hide();
        return;
      }
      var item = qx.lang.Json.parse(value);
      var control = this.getChildControl("attachment");
      control.setValue("<span style='text-decoration:underline;'>" + item.displayName + "</span>");
      control.addListener("dblclick", function(e)
      {
        var currentEPG = tvproui.epgVersion.EPGVersionTable.currentEPG;
        if (currentEPG[item.nodeId])
        {
          currentEPG[item.nodeId].maximize();
          return;
        }
        var epgWindow = null;
        if (item.status == "已送审") {

          // 只读模式
          epgWindow = tvproui.Application.desktop.loadWindow(tvproui.EPG.viewTable.EPGViewWindow, item);
        } else {
          epgWindow = tvproui.Application.desktop.loadWindow(tvproui.EPG.editTable.EPGEditWindow, item);
        }
        currentEPG[item.nodeId] = epgWindow;
        epgWindow.addListener("close", function(e) {
          delete currentEPG[item.nodeId];
        }, this);
      }, this);
    },

    // apply method

    /**
     * TODOC
     *
     * @param value {var} TODOC
     * @param old {var} TODOC
     */
    _applyStatus : function(value, old)
    {
      var content = this.getChildControl("content").getValue();
      if (!content) {
        return;
      }
      if (value)
      {

        // 发送已经阅读请求
        var result = tvproui.AjaxPort.call("Message/setReadStatus", {
          ID : this.getDataID()
        });
        if (!result) {
          return;
        }

        // 变更界面
        var boldLeft = "<b class='listItemBold'>";
        var boldRight = "</b>";
        var content = this.getChildControl("content").getValue();
        content = content.substr(boldLeft.length, content.length - boldLeft.length - boldRight.length);
        this.getChildControl("content").setValue(content);
      }
    }
  }
});
