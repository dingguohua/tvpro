
/* ************************************************************************
************************************************************************ */
qx.Class.define('tvproui.utils.Storage',
{
  type : "static",
  statics : {
    storage: null,

    init: function()
    {
      var storage = qx.bom.storage.Web.getLocal();
      if(null == storage)
      {
        dialog.Dialog.error("您的浏览器不支持本地存储功能，为了保证数据编辑安全，请使用Chrome浏览器!");
      }

       tvproui.utils.Storage.storage = storage;
    },

    get : function(key)
    {
      var storage = tvproui.utils.Storage.storage;
      if(!storage)
      {
        return null;
      }

      key = location.host + "_" + key;
      return storage.getItem(key);
    },

    set : function(key, value)
    {
      var storage = tvproui.utils.Storage.storage;
      if(!storage)
      {
        return;
      }

      key = location.host + "_" + key;
      return storage.setItem(key, value);
    },

    remove: function(key)
    {
      var storage = tvproui.utils.Storage.storage;
      if(!storage)
      {
        return;
      }

      key = location.host + "_" + key;
      return storage.removeItem(key);
    }
  }
});
