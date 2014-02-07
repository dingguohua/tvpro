
/* ************************************************************************

   Copyright:

   License:

   Authors:

************************************************************************
#asset(tvproui/window/*)
*/
qx.Theme.define("tvproui.theme.Decoration",
{
  extend : qx.theme.modern.Decoration,
  decorations :
  {
    "shadow-login-window" :
    {
      decorator : qx.ui.decoration.Background,
      style : {
        backgroundImage : "tvproui/login/login.png"
      }
    },
    "shadow-about-window" :
    {
      decorator : qx.ui.decoration.Grid,
      style :
      {
        baseImage : "decoration/shadow/shadow.png",
        insets : [4, 8, 8, 0]
      }
    }
  }
});
