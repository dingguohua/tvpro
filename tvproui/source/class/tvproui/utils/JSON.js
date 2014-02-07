
/* ************************************************************************
************************************************************************ */
qx.Class.define('tvproui.utils.JSON',
{
  type : "static",
  statics : {


    /**
     * TODOC
     *
     * @param map {Map} TODOC
     * @return {var} TODOC
     */
    stringify : function(map)
    {
      var Data = qx.lang.Json.stringify(map);
      Data = Data.replace(/\+/g, "%2B");
      Data = Data.replace(/\&/g, "%26");
      return Data;
    }
  }
});
