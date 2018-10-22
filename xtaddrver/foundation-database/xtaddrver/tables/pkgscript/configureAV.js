/*
  This file is part of the xtaddrver Package for xTuple ERP,
  and is Copyright (c) 1999-2018 by OpenMFG LLC, d/b/a xTuple.  It
  is licensed to you under the xTuple End-User License Agreement ("the
  CPAL"), the full text of which is available at www.xtuple.com/EULA.
  While the CPAL gives you access to source code and encourages your
  involvement in the development process, this Package is not free
  software.  By using this software, you agree to be bound by the
  terms of the CPAL.
*/

include('AddressValidator');

(function () {

  var layout, tab, tabname, valname;
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
    for (valname in AddressValidator)
    {
      if (AddressValidator[valname].setup)
      {
        AddressValidator[valname].setup.forEach(function (e) {
          if (e.encrypted)
            metricsenc.set(e.metric, e._field.text);
          else if (e._field)
            metrics.set(e.metric, e._field.text);
        });
      }
    }
    metrics.set("AddressValidatorToUse", _avSelector.code);
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
        if (e.metric)
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
        } else if (e.text) {
          e._label = new XLabel(mywindow, "_" + e.metric + "Lit");
          e._label.text = e.label;

          e._text = toolbox.createWidget("QTextEdit", mywindow, "_" + e._label);
          e._text.readOnly = true;
          e._text.plainText = e.text;
          layout.addRow(e._label, e._text);
        }
      });
    }
  }

  if (metrics.value("AddressValidatorToUse"))
    _avSelector.code = metrics.value("AddressValidatorToUse");
  if (_setupwindow)
    _setupwindow.saving.connect(sSave);

  _avSelector["newID(int)"].connect(sServiceSelected);
})();
