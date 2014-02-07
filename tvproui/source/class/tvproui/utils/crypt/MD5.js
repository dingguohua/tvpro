
/* ************************************************************************
************************************************************************ */
qx.Class.define('tvproui.utils.crypt.MD5',
{
  type : "static",
  statics : {


    /**
     * TODOC
     *
     * @param info {var} TODOC
     * @return {var} TODOC
     */
    calculate : function(info) {
      return eval("hex_md5('" + info + "')");
    }
  }
});
