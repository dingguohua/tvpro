
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
   * Jonathan Weiß (jonathan_rass)

************************************************************************ */

/* ************************************************************************
************************************************************************ */
qx.Class.define("tvproui.messager.messenger.MessageModel",
{
  extend : qx.core.Object,
  include : qx.data.marshal.MEventBubbling,


  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */
  properties :
  {
    dataID :
    {
      check : "Integer",
      event : "changedataID",
      apply : "_applyEventPropagation"
    },
    name :
    {
      init : "(unnamed)",
      event : "changeName",
      check : "String",
      apply : "_applyEventPropagation"
    },
    avatar :
    {
      init : "icon/22/emotes/face-smile.png",
      event : "changeAvatar",
      check : "String",
      apply : "_applyEventPropagation"
    },
    status :
    {
      init : "read",
      event : "changeStatus",
      check : "Integer",
      apply : "_applyEventPropagation"
    },
    content :
    {
      init : "(无内容)",
      event : "changeContent",
      check : "String",
      apply : "_applyEventPropagation"
    },
    attachment :
    {
      init : "(无内容)",
      event : "changeAttachment",
      check : "String",
      apply : "_applyEventPropagation"
    }
  },
  statics :
  {


    /**
     * TODOC
     *
     * @return {var} TODOC
     */
    loadModel : function()
    {
      var result = tvproui.AjaxPort.call("Message/receiveMessage");
      if (null == result) {
        return new qx.data.Array([]);
      }
      var model = [];
      for (var i = 0, l = result.length; i < l; i++)
      {
        var message = result[i];
        var buddyModel = new tvproui.messager.messenger.MessageModel().set(
        {
          dataID : parseInt(message.ID),
          name : message.alias,
          avatar : tvproui.system.fileManager.path(message.imagepath),
          status : parseInt(message.status),
          content : message.subject,
          attachment : message.link
        });
        model.push(buddyModel);
      }
      return new qx.data.Array(model);
    },
    sendMessage : function(subject, receivers, link) {

      // 发送
      return tvproui.AjaxPort.call("Message/sendMessageToUsers",
      {
        subject : subject,
        receivers : receivers,
        link : link
      });
    }
  }
});
