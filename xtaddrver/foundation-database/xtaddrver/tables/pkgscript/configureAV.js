/*
  This file is part of the xtaddrver Package for xTuple ERP,
  and is Copyright (c) 1999-2018 by OpenMFG LLC, d/b/a xTuple.
  It is licensed to you under the Common Public Attribution License
  version 1.0, the full text of which (including xTuple-specific Exhibits)
  is available at www.xtuple.com/CPAL.  By using this software, you agree
  to be bound by its terms.
*/

include('AddressValidator');
var QTableWidget; // declare this because 4.11.x doesn't expose QTableWidget to scripting

(function () {
  const DEBUG = false;
  var layout, tab, tabname, valname;
  var countriesLit, countries; // temporary variables to hold widgets
  var _setupwindow = mainwindow.findChild("setup"),
      _avSelector  = mywindow.findChild("_avSelector"),
      tabwidget    = mywindow.findChild("_avTabWidget"),
      i = 0;

  function sServiceSelected()
  {
    var tab = tabwidget.findChild("_" + _avSelector.code.toLowerCase() + "Tab");
    tabwidget.setCurrentWidget(tab);
  }

  function sSave()
  {
    try {
      var qry, abbr = [], i;
      for (valname in AddressValidator)
      {
        if (AddressValidator[valname].setup)
        {
          AddressValidator[valname].setup.forEach(function (e) {
            DEBUG && print("saving", valname, JSON.stringify(e));
            if (e.encrypted)
              metricsenc.set(e.metric, e._widget.text);
            else if (e.checkbox)
              metrics.set(e.metric, e._widget.checked ? "t" : "f");
            else if (e.combobox)
              metrics.set(e.metric, e._widget.code);
            else if (e.message)
              ; // nothing to do
            else // assume it's a lineedit or textedit
              metrics.set(e.metric, e._widget.text);
          });
        }
      }
      metrics.set("AddressValidatorToUse", _avSelector.code);
    }
    catch (e) {
      QMessageBox.critical(mywindow, qsTr("Error Saving"),
                           qsTr("Error at line %1: %2").arg(e.lineNumber).arg(e.message));
    }
  }

  for (valname in AddressValidator)
  {
    if (AddressValidator[valname].setup)
    {
      _avSelector.append(i++, valname);
      tabname = "_" + valname.toLowerCase() + "Tab";
      tab = tabwidget.findChild(tabname);
      if (! tab)
        tab = toolbox.createWidget("QWidget", mywindow, tabname);

      layout = tab.layout();
      if (! layout)
      {
        layout = toolbox.createLayout("QFormLayout", tab, tabname + "Layout");
        layout.fieldGrowthPolicy = QFormLayout.AllNonFixedFieldsGrow;
        tab.setLayout(layout);
      }

      AddressValidator[valname].setup.forEach(function (e, idx) {
        var qry;
        if (e.checkbox)
        {
          e._widget = new XCheckBox(e.checkbox, mywindow);
          e._widget.setObjectName("_" + e.metric + "CB");
          e._widget.forgetful = true;
          e._widget.text      = e.checkbox;
          if (metrics.value(e.metric))
            e._widget.checked = metrics.boolean(e.metric);
          else if ("default" in e)
            e._widget.checked = (e["default"] === true || e["default"] === "t"); // guard against bad coding
          layout.addRow("", e._widget);
          DEBUG && print(e._widget);
        }
        else if (e.combobox)
        {
          e._label      = new XLabel(mywindow, "_" + e.metric + "Lit");
          e._label.text = e.label;
          e._widget     = new XComboBox(mywindow, "_" + e.metric + "CB");
          AddressValidator[valname][e.combobox].forEach(function (item, idx) {
            e._widget.append(idx, item.text, item.code);
          });
          e._widget.code = metrics.value(e.metric);
          layout.addRow(e._label, e._widget);
          DEBUG && print(e._label, e._widget);
        }
        else if (e.text)
        {
          e._label = new XLabel(mywindow, "_" + e.metric + "Lit");
          e._label.text = e.label;

          // XTextEdit constructors aren't available to scripts :-(
          e._widget = toolbox.createWidget("XTextEdit", mywindow, ''); //new QTextEdit(e.text, mywindow);
          e._widget.setObjectName("_" + e.metric);
          e._widget.readOnly   = true;
          layout.addRow(e._label, e._widget);
          DEBUG && print(e._label, e._widget);
        }
        else if (e.metric)
        {
          e._label      = new XLabel(mywindow, "_" + e.metric + "Lit");
          e._label.text = e.label;
          e._widget      = new XLineEdit(mywindow, "_" + e.metric);
          if ("width" in e) e._widget.minimumWidth = e.width;
          if ("default" in e)
            e._widget.placeholderText = AddressValidator[valname][e["default"]] ||
                                       e["default"];
          if (e.encrypted)
          {
            e._widget.text     = metricsenc.value(e.metric);
            e._widget.echoMode = XLineEdit.PasswordEchoOnEdit;
          } else
            e._widget.text = metrics.value(e.metric);

          layout.addRow(e._label, e._widget);
          DEBUG && print(e._label, e._widget);
        }
        else if (e.message)
        {
          e._label = new XLabel(mywindow, "_" + valname + idx + "Message");
          e._label.text = e.message;
          layout.addRow(e._label);
          DEBUG && print(e._label);
        }
        if (e._widget && "readOnly" in e._widget)
          e._widget.readOnly = ! privileges.check("MaintainAddressValidationSetup");
        else if (e._widget)
          e._widget.enabled = privileges.check("MaintainAddressValidationSetup");
      });
      if (AddressValidator[valname].servicecountry && QTableWidget)
      {
        countriesLit = new XLabel(mywindow, "_" + valname + "CountriesLit");
        countriesLit.text = qsTr("Supported Countries");

        countries  = new QTableWidget(mywindow);
        countries.setObjectName("_" + valname + "Countries");
        countries.columnCount        = 1;
        countries.rowCount           = AddressValidator[valname].servicecountry.length;
        countries.columnWidth        = -1;
        countries.verticalHeader && countries.verticalHeader().hide();
        if (countries.horizontalHeader)
        {
          countries.horizontalHeader().hide();
          countries.horizontalHeader().stretchLastSection = true;
        }
        else if (countries.setColumnWidth)
          countries.setColumnWidth(0, -1);

        AddressValidator[valname].servicecountry.forEach(function (abbr, i) {
          var item = new QTableWidgetItem(abbr, QTableWidgetItem.Type);
          countries.setItem(i, 0, item);
        });

        layout.addRow(countriesLit, countries);
      }
    }
  }

  if (metrics.value("AddressValidatorToUse"))
    _avSelector.code = metrics.value("AddressValidatorToUse");
  if (_setupwindow)
    _setupwindow.saving.connect(sSave);

  _avSelector["newID(int)"].connect(sServiceSelected);
})();
