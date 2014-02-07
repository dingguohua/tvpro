
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
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * A *date field* is like a combo box with the date as popup. As button to
 * open the calendar a calendar icon is shown at the right to the textfield.
 *
 * To be conform with all form widgets, the {@link qx.ui.form.IForm} interface
 * is implemented.
 *
 * The following example creates a date field and sets the current
 * date as selected.
 *
 * <pre class='javascript'>
 * var dateField = new qx.ui.form.DateField();
 * this.getRoot().add(dateField, {top: 20, left: 20});
 * dateField.setValue(new Date());
 * </pre>
 *
 * @childControl list {qx.ui.control.DateChooser} date chooser component
 * @childControl popup {qx.ui.popup.Popup} popup which shows the list control
 */
qx.Class.define("tvproui.control.ui.form.DateField",
{
  extend : qx.ui.form.DateField,


  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */
  construct : function() {
    this.base(arguments);
  },


  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */
  properties : {

    /** 最小日期 **/
    minDate :
    {
      nullable : true,
      check : "Date",
      apply : "_minDateChanged"
    },

    /** 最大日期 **/
    maxDate :
    {
      nullable : true,
      check : "Date",
      apply : "_maxDateChanged"
    }
  },


  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */
  members :
  {


    /*
    ---------------------------------------------------------------------------
      EVENT LISTENERS
    ---------------------------------------------------------------------------
    */

    /**
     * Handler method which handles the click on the calender popup.
     *
     * @param e {qx.event.type.Mouse} The mouse event of the click.
     */
    _onChangeDate : function(e)
    {
      var textField = this.getChildControl("textfield");
      var selectedDate = this.getChildControl("list").getValue();
      var minDate = this.getMinDate();

      selectedDate.setHours(0);
      selectedDate.setMinutes(0);
      selectedDate.setSeconds(0);

      if ((null != minDate) && (selectedDate < minDate)) {
        dialog.Dialog.error("您选取的日期小于" + tvproui.utils.Time.formatDate(minDate) + "这是不允许的!")
        return;
      }

      var maxDate = this.getMaxDate();
      if ((null != maxDate) && (selectedDate > maxDate)) {
        dialog.Dialog.error("您选取的日期大于" + tvproui.utils.Time.formatDate(maxDate) + "这是不允许的!")
        return;
      }

      textField.setValue(this.getDateFormat().format(selectedDate));
      this.close();
    },


    /**
     * TODOC
     *
     * @param minDate {var} TODOC
     */
    _minDateChanged : function(minDate)
    {
      if (minDate)
      {
        minDate.setHours(0);
        minDate.setMinutes(0);
        minDate.setSeconds(0);
      }

      var current = this.getValue();
      if (current >= minDate) {
        return;
      }
      this.setValue(minDate);
    },


    /**
     * TODOC
     *
     * @param minDate {var} TODOC
     */
    _maxDateChanged : function(maxDate)
    {
      if (maxDate)
      {
        maxDate.setHours(0);
        maxDate.setMinutes(0);
        maxDate.setSeconds(0);
      }

      var current = this.getValue();
      if (current <= maxDate) {
        return;
      }
      this.setValue(maxDate);
    }
  }
});
