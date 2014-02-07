
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Andreas Ecker (ecker)
     * Martin Wittemann (martinwittemann)
     * Jonathan Weiß (jonathan_rass)

************************************************************************ */

/**
 * A *spinner* is a control that allows you to adjust a numerical value,
 * typically within an allowed range. An obvious example would be to specify the
 * month of a year as a number in the range 1 - 12.
 *
 * To do so, a spinner encompasses a field to display the current value (a
 * textfield) and controls such as up and down buttons to change that value. The
 * current value can also be changed by editing the display field directly, or
 * using mouse wheel and cursor keys.
 *
 * An optional {@link #numberFormat} property allows you to control the format of
 * how a value can be entered and will be displayed.
 *
 * A brief, but non-trivial example:
 *
 * <pre class='javascript'>
 * var s = new qx.ui.form.Spinner();
 * s.set({
 *   maximum: 3000,
 *   minimum: -3000
 * });
 * var nf = new qx.util.format.NumberFormat();
 * nf.setMaximumFractionDigits(2);
 * s.setNumberFormat(nf);
 * </pre>
 *
 * A spinner instance without any further properties specified in the
 * constructor or a subsequent *set* command will appear with default
 * values and behaviour.
 *
 * @childControl textfield {qx.ui.form.TextField} holds the current value of the spinner
 * @childControl upbutton {qx.ui.form.Button} button to increase the value
 * @childControl downbutton {qx.ui.form.Button} button to decrease the value
 *
 */
qx.Class.define("tvproui.control.ui.form.TimeSpinner",
{
  extend : qx.ui.core.Widget,
  implement : [qx.ui.form.IForm],
  include : [qx.ui.core.MContentPadding, qx.ui.form.MForm],


  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param min {Number} Minimum value
   * @param value {Number} Current value
   * @param max {Number} Maximum value
   */
  construct : function(value)
  {
    this.base(arguments);

    // MAIN LAYOUT
    var layout = new qx.ui.layout.Grid();
    layout.setColumnFlex(0, 1);
    layout.setRowFlex(0, 1);
    layout.setRowFlex(1, 1);
    this._setLayout(layout);

    // EVENTS
    this.addListener("keydown", this._onKeyDown, this);
    this.addListener("keyup", this._onKeyUp, this);
    this.addListener("mousewheel", this._onMouseWheel, this);

    // CREATE CONTROLS
    this._createChildControl("textfield");
    this._createChildControl("upbutton");
    this._createChildControl("downbutton");
    if (value !== undefined) {
      this.setValue(value);
    } else {
      this.initValue();
    }
  },

  events :
  {
    /** Whenever the value is changed this event is fired
     *
     *  Event data: The new text value of the field.
     */
    "changeValue" : "qx.event.type.Data"
  },

  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */
  properties :
  {

    // overridden
    appearance :
    {
      refine : true,
      init : "spinner"
    },

    // overridden
    focusable :
    {
      refine : true,
      init : true
    },

    /** The amount to increment on each event (keypress or mousedown) */
    singleStep :
    {
      check : "Number",
      init : 1
    },

    /** The amount to increment on each pageup/pagedown keypress */
    pageStep :
    {
      check : "Number",
      init : 60
    },

    /** Controls whether the textfield of the spinner is editable or not */
    editable :
    {
      check : "Boolean",
      init : true,
      apply : "_applyEditable"
    },

    // overridden
    allowShrinkY :
    {
      refine : true,
      init : false
    }
  },


  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */
  members :
  {

    /** Saved last value in case invalid text is entered */
    __lastValidValue : null,

    /** Whether the page-up button has been pressed */
    __pageUpMode : false,

    /** Whether the page-down button has been pressed */
    __pageDownMode : false,
    __value : null,


    /*
    ---------------------------------------------------------------------------
      WIDGET INTERNALS
    ---------------------------------------------------------------------------
    */
    // overridden
    _createChildControlImpl : function(id, hash)
    {
      var control;
      switch (id)
      {
        case "textfield":control = new qx.ui.form.TextField();
        control.addState("inner");
        control.setWidth(40);
        control.setFocusable(false);
        control.addListener("changeValue", this._onTextChange, this);
        this._add(control,
        {
          column : 0,
          row : 0,
          rowSpan : 2
        });
        break;
        case "upbutton":control = new qx.ui.form.RepeatButton();
        control.addState("inner");
        control.setFocusable(false);
        control.addListener("execute", this._countUp, this);
        this._add(control,
        {
          column : 1,
          row : 0
        });
        break;
        case "downbutton":control = new qx.ui.form.RepeatButton();
        control.addState("inner");
        control.setFocusable(false);
        control.addListener("execute", this._countDown, this);
        this._add(control,
        {
          column : 1,
          row : 1
        });
        break;
      }
      return control || this.base(arguments, id);
    },

    // overridden
    tabFocus : function()
    {
      var field = this.getChildControl("textfield");
      field.getFocusElement().focus();
      field.selectAllText();
    },
    selectAllText : function() {
      this.tabFocus();
    },


    /*
    ---------------------------------------------------------------------------
      APPLY METHODS
    ---------------------------------------------------------------------------
    */
    // overridden
    _applyEnabled : function(value, old)
    {
      this.base(arguments, value, old);
      this._updateButtons();
    },


    /**
     * Apply routine for the value property.
     *
     * It checks the min and max values, disables / enables the
     * buttons and handles the wrap around.
     *
     * @param value {Number} The new value of the spinner
     * @param old {Number} The former value of the spinner
     */
    _applyValue : function(value, old)
    {
      if ((old && value.equal(old)) || (this.__lastValidValue && value.equal(this.__lastValidValue))) {
        return;
      }
      var textField = this.getChildControl("textfield");
      this._updateButtons();

      // save the last valid value of the spinner
      this.__lastValidValue = value;

      // write the value of the spinner to the textfield
      if (value !== null) {
        textField.setValue(value.toDayString());
      } else {
        textField.setValue("00:00:00");
      }

      // Fire event
      this.fireDataEvent("changeValue", this.getValue());
    },


    /**
     * Apply routine for the editable property.<br/>
     * It sets the textfield of the spinner to not read only.
     *
     * @param value {Boolean} The new value of the editable property
     * @param old {Boolean} The former value of the editable property
     */
    _applyEditable : function(value, old)
    {
      var textField = this.getChildControl("textfield");
      if (textField) {
        textField.setReadOnly(!value);
      }
    },


    /**
     * Returns the element, to which the content padding should be applied.
     *
     * @return {qx.ui.core.Widget} The content padding target.
     */
    _getContentPaddingTarget : function() {
      return this.getChildControl("textfield");
    },


    /**
     * Checks the min and max values, disables / enables the
     * buttons and handles the wrap around.
     */
    _updateButtons : function()
    {
      var upButton = this.getChildControl("upbutton");
      var downButton = this.getChildControl("downbutton");
      if (!this.getEnabled())
      {

        // If Spinner is disabled -> disable buttons
        upButton.setEnabled(false);
        downButton.setEnabled(false);
      } else
      {

        // If wraped -> always enable buttons
        upButton.setEnabled(true);
        downButton.setEnabled(true);
      }
    },


    /*
    ---------------------------------------------------------------------------
      KEY EVENT-HANDLING
    ---------------------------------------------------------------------------
    */

    /**
     * Callback for "keyDown" event.<br/>
     * Controls the interval mode ("single" or "page")
     * and the interval increase by detecting "Up"/"Down"
     * and "PageUp"/"PageDown" keys.<br/>
     * The corresponding button will be pressed.
     *
     * @param e {qx.event.type.KeySequence} keyDown event
     */
    _onKeyDown : function(e)
    {
      switch (e.getKeyIdentifier())
      {
        case "PageUp":// mark that the spinner is in page mode and process further
        this.__pageUpMode = true;
        case "Up":this.getChildControl("upbutton").press();
        break;
        case "PageDown":// mark that the spinner is in page mode and process further
        this.__pageDownMode = true;
        case "Down":this.getChildControl("downbutton").press();
        break;
        default :// Do not stop unused events
        return;
      }
      e.stopPropagation();
      e.preventDefault();
    },


    /**
     * Callback for "keyUp" event.<br/>
     * Detecting "Up"/"Down" and "PageUp"/"PageDown" keys.<br/>
     * Releases the button and disabled the page mode, if necessary.
     *
     * @param e {qx.event.type.KeySequence} keyUp event
     * @return {void}
     */
    _onKeyUp : function(e) {
      switch (e.getKeyIdentifier())
      {
        case "PageUp":this.getChildControl("upbutton").release();
        this.__pageUpMode = false;
        break;
        case "Up":this.getChildControl("upbutton").release();
        break;
        case "PageDown":this.getChildControl("downbutton").release();
        this.__pageDownMode = false;
        break;
        case "Down":this.getChildControl("downbutton").release();
        break;
      }
    },


    /*
    ---------------------------------------------------------------------------
      OTHER EVENT HANDLERS
    ---------------------------------------------------------------------------
    */

    /**
     * Callback method for the "mouseWheel" event.<br/>
     * Increments or decrements the value of the spinner.
     *
     * @param e {qx.event.type.Mouse} mouseWheel event
     */
    _onMouseWheel : function(e)
    {
      var delta = e.getWheelDelta("y");
      if (delta > 0) {
        this._countDown();
      } else if (delta < 0) {
        this._countUp();
      }

      e.stop();
    },
    setValue : function(value)
    {
      this._applyValue(value, this.__value);
      this.__value = value;
    },
    getValue : function()
    {
      var textField = this.getChildControl("textfield");
      var value = tvproui.utils.Time.fromComplexString(textField.getValue());
      return value;
    },
    initValue : function(value) {
      this.__value = value;
    },


    /**
     * Callback method for the "change" event of the textfield.
     *
     * @param e {qx.event.type.Event} text change event or blur event
     */
    _onTextChange : function(e)
    {
      var textField = this.getChildControl("textfield");
      var value = tvproui.utils.Time.fromComplexString(textField.getValue());

      // if the result is a number
      if (this.__lastValidValue && value && !this.__lastValidValue.equal(value)) {

        // set the value in the spinner
        this.setValue(value);
      } else {

        // otherwise, reset the last valid value
        this._applyValue(this.__lastValidValue, undefined);
      }
    },


    /*
    ---------------------------------------------------------------------------
      INTERVAL HANDLING
    ---------------------------------------------------------------------------
    */

    /**
     * Checks if the spinner is in page mode and counts either the single
     * or page Step up.
     *
     */
    _countUp : function()
    {
      var time = this.getValue().getTime();
      var newValue;
      if (this.__pageUpMode) {
        newValue = tvproui.utils.Time.fromOffset(time + this.getPageStep());
      } else {
        newValue = tvproui.utils.Time.fromOffset(time + this.getSingleStep());
      }
      this.gotoValue(newValue);
    },


    /**
     * Checks if the spinner is in page mode and counts either the single
     * or page Step down.
     *
     */
    _countDown : function()
    {
      var time = this.getValue().getTime();
      var newValue;
      if (this.__pageDownMode) {
        newValue = tvproui.utils.Time.fromOffset(time - this.getPageStep());
      } else {
        newValue = tvproui.utils.Time.fromOffset(time - this.getSingleStep());
      }
      this.gotoValue(newValue);
    },


    /**
     * Normalizes the incoming value to be in the valid range and
     * applies it to the {@link #value} afterwards.
     *
     * @param value {Number} Any number
     * @return {Number} The normalized number
     */
    gotoValue : function(value) {
      return this.setValue(value);
    }
  },
  destruct : function() {
  }
});
