qx.Class.define('tvproui.system.taskBarButton',
{
  extend : qx.ui.form.ToggleButton,
  construct : function(label, icon)
  {
    this.base(arguments, label);
    this.setLabel('<span style="font-weight:bold;">' + label + '</span>');
    this.setIcon(icon);
    this.getChildControl('label').set(
    {
      rich : true,
      marginLeft : 15
    });

    //
    // This disallows the focus on the button to avoid errors with relationated window focus.
    this.set(
    {
      focusable : false,
      keepFocus : true,
      paddingTop : 1,
      paddingBottom : 1,
      paddingLeft : 5,
      paddingRight : 5,
      height : 29,
      maxHeight : 29,
      alignY : 'middle',
      textColor : '#c6d4d3',
      minWidth : 130,
      center : false
    });

    // BUTTON DECORATORS
    this._decoratorWindowActive = new qx.ui.decoration.Beveled().set(
    {
      backgroundColor : '#e8f3f8',
      innerColor : '#24568e'
    });
    this._decoratorWindowInactive = new qx.ui.decoration.Single(1, null, '#24568e');
  },
  members :
  {
    _miniButtonStyle : false,
    _miniButtonStyleOver : false,


    /**
     * TODOC
     *
     */
    _buttonWithFocus : function()
    {
      this._miniButtonStyle = this._decoratorWhiteNone;
      this._miniButtonStyleOver = this._decoratorWhiteBlue;
      this.set(
      {
        textColor : '#333333',
        decorator : this._decoratorWindowActive
      });
    },


    /**
     * TODOC
     *
     */
    _buttonWithoutFocus : function()
    {
      this._miniButtonStyle = this._decoratorBlueNone;
      this._miniButtonStyleOver = this._decoratorWhiteLightBlue;
      this.set(
      {
        textColor : '#c6d4d3',
        decorator : this._decoratorWindowInactive
      });
    }
  }
});
