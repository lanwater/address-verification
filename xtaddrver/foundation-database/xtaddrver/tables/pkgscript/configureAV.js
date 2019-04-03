/*
  This file is part of the xtaddrver Package for xTuple ERP,
  and is Copyright (c) 1999-2018 by OpenMFG LLC, d/b/a xTuple.
  It is licensed to you under the Common Public Attribution License
  version 1.0, the full text of which (including xTuple-specific Exhibits)
  is available at www.xtuple.com/CPAL.  By using this software, you agree
  to be bound by its terms.
*/

include('AddressValidator');

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
              metricsenc.set(e.metric, e._field.text);
            else if (e._field)
              metrics.set(e.metric, e._field.text);
            else if (e._checkbox)
              metrics.set(e.metric, e._checkbox.checked ? "t" : "f");
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

      AddressValidator[valname].setup.forEach(function (e) {
        var qry;
        if (e.checkbox)
        {
          e._checkbox = new XCheckBox(e.checkbox, mywindow);
          e._checkbox.setObjectName("_" + e.metric + "CB");
          e._checkbox.forgetful = true;
          e._checkbox.text = e.checkbox;
          if (metrics.value(e.metric))
            e._checkbox.checked = metrics.boolean(e.metric);
          else if ("default" in e)
            e._checkbox.checked = (e["default"] === true || e["default"] === "t"); // guard against bad coding
          layout.addRow("", e._checkbox);
        }
        else if (e.metric)
        {
          e._label = new XLabel(mywindow, "_" + e.metric + "Lit");
          e._label.text = e.label;

          e._field = new XLineEdit(mywindow, "_" + e.metric);
          if ("width" in e) e._field.minimumWidth = e.width;
          if ("default" in e)
            e._field.placeholderText = AddressValidator[valname][e["default"]] ||
                                       e["default"];
          if (e.encrypted)
          {
            e._field.text     = metricsenc.value(e.metric);
            e._field.echoMode = XLineEdit.PasswordEchoOnEdit;
          } else
            e._field.text = metrics.value(e.metric);

          layout.addRow(e._label, e._field);
        }
        else if (e.text)
        {
          e._label = new XLabel(mywindow, "_" + e.metric + "Lit");
          e._label.text = e.label;

          e._text = new QTextEdit(e.text, mywindow);
          e._text.setObjectName("_" + e.metric);
          e._text.readOnly   = true;
          layout.addRow(e._label, e._text);
        }
      });
      if (AddressValidator[valname].servicecountry)
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
