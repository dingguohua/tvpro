
/* ************************************************************************

   Copyright:

   License:

   Authors:

************************************************************************ */
qx.Theme.define("tvproui.theme.Appearance",
{
  extend : qx.theme.modern.Appearance,
  appearances :
  {
    "window/minimize-button" :
    {
      alias : "atom",
      style : function(states) {
        return {
          icon : states.active ? states.hovered ? "decoration/window/minimize-active-hovered.png" : "tvproui/window/minimize-active.png" : "decoration/window/minimize-inactive.png",
          margin : [4, 8, 2, 0]
        };
      }
    },
    "window/restore-button" :
    {
      alias : "atom",
      style : function(states) {
        return {
          icon : states.active ? states.hovered ? "decoration/window/restore-active-hovered.png" : "tvproui/window/restore-active.png" : "decoration/window/restore-inactive.png",
          margin : [5, 8, 2, 0]
        };
      }
    },
    "window/maximize-button" :
    {
      alias : "atom",
      style : function(states) {
        return {
          icon : states.active ? states.hovered ? "decoration/window/maximize-active-hovered.png" : "tvproui/window/maximize-active.png" : "decoration/window/maximize-inactive.png",
          margin : [4, 8, 2, 0]
        };
      }
    },
    "window/close-button" :
    {
      alias : "atom",
      style : function(states) {
        return {
          icon : states.active ? states.hovered ? "decoration/window/close-active-hovered.png" : "tvproui/window/close-active.png" : "decoration/window/close-inactive.png",
          margin : [4, 8, 2, 0]
        };
      }
    },
    "treevirtual-folder" : {
      style : function(states) {
        return {
          icon : states.opened ? "icon/22/places/folder-open.png" : "icon/22/places/folder.png"
        };
      }
    },
    "treevirtual-file" :
    {
      include : "treevirtual-folder",
      alias : "treevirtual-folder",
      style : function(states) {
        return {
          icon : "icon/22/mimetypes/office-document.png"
        };
      }
    },
    "tvproLogin" : {
      style : function(states) {
        return {
          shadow : "shadow-login-window"
        };
      }
    },
    "tvproLogin/captionbar" : {
      style : function(states) {
        return {
          minHeight : 0,
          height : 0
        };
      }
    },
    "tvproAbout" :
    {
      alias : "window",
      style : function(states) {
        return {
          contentPadding : [0, 10, 20, 10],
          backgroundColor : "white",
          shadow : "shadow-about-window"
        };
      }
    },
    "tvproAbout/pane" :
    {
      alias : "window/pane",
      style : function(states) {
        return {
          backgroundColor : "white"
        };
      }
    }
  }
});
