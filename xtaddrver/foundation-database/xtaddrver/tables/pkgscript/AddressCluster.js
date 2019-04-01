/*
  This file is part of the xtaddrver Package for xTuple ERP,
  and is Copyright (c) 1999-2018 by OpenMFG LLC, d/b/a xTuple.
  It is licensed to you under the Common Public Attribution License
  version 1.0, the full text of which (including xTuple-specific Exhibits)
  is available at www.xtuple.com/CPAL.  By using this software, you agree
  to be bound by its terms.
*/

(function () {
  var AddressValidator; // declare first, overwrite by include()
  include("AddressValidator");

  var DEBUG   = false;
  var valname = metrics.value("AddressValidatorToUse");
  if (valname.length == 0 || ! valname in AddressValidator)
    return;

  // would mapping widgets to names to addr record fields simplify anything?
  var _addr1      = mywidget.findChild("_addr1"),
      _addr2      = mywidget.findChild("_addr2"),
      _addr3      = mywidget.findChild("_addr3"),
      _city       = mywidget.findChild("_city"),
      _list       = mywidget.findChild("_list"),
      _state      = mywidget.findChild("_state"),
      _postalcode = mywidget.findChild("_postalcode"),
      _country    = mywidget.findChild("_country");

  var layout     = widgetGetLayout(_list),
      validate   = new QPushButton(qsTr("Check"), mywidget);

  var netmgr     = new QNetworkAccessManager(mywidget);

  if (Array.isArray(AddressValidator[valname].hint))
    AddressValidator[valname].hint.forEach(function (e) {
      var widget;
      switch (e.key) {
        case "addr_line1":      widget = _addr1;        break;
        case "addr_line2":      widget = _addr2;        break;
        case "addr_line3":      widget = _addr3;        break;
        case "addr_city":       widget = _city;         break;
        case "addr_state":      widget = _state;        break;
        case "addr_postalcode": widget = _postalcode;   break;
        case "addr_country":    widget = _country;      break;
      };
      if (widget && e.value) widget.placeholderText = e.value;
    });

  // scripted version of toolbox.widgetGetLayout(w)
  function widgetGetLayout(w)
  {
    var p = w, list, result;
    for (p = ("parentWidget" in p && p.parentWidget());
         p && ! result;
         p = ("parentWidget" in p && p.parentWidget()))
    {
      list = ("findChildren" in p && p.findChildren(null, Qt.FindChildrenRecursively, "QLayout"));
      if (list && list.length > 0)
        result = list.filter(function(e) { return (e.indexOf(w) != -1); })[0];
    }
    return result;
  }

  function sGetResponse(netreply)
  {
    DEBUG && print('sGetResponse(', netreply, ') entered with', JSON.stringify(netreply));
    try {
      var response = AddressValidator.parseResponse(netreply);
      DEBUG && print("parsed:", JSON.stringify(response));
      if (response)
      {
        response = AddressValidator[valname].extractAddress(response);
        DEBUG && print("extracted:", JSON.stringify(response));
      }

      if (! response)
      {
        DEBUG && print('falsey response');
        markDirty();
      }
      else if (response.requestStatus === 'error')
      {
        markInvalid();
        QMessageBox.critical(mywidget, qsTr("Address Validation Error"),
                             qsTr("%1 reported an error [%2]:<br/>%3")
                                 .arg(valname)
                                 .arg(response.lastError.number)
                                 .arg(response.lastError.text));

      }
      else if (response.requestStatus === 'warning')
      {
        markDirty();
        QMessageBox.critical(mywidget, qsTr("Address Validation Warning"),
                             qsTr("%1 reported a warning [%2]:<br/>%3")
                                 .arg(valname)
                                 .arg(response.lastError.number)
                                 .arg(response.lastError.text));
        if (response.addr) {
          mywidget.setLine1(response.addr.addr_line1);
          mywidget.setLine2(response.addr.addr_line2);
          if (typeof response.addr.addr_line3 == "string")
            mywidget.setLine3(response.addr.addr_line3);

          mywidget.setCity(response.addr.addr_city);
          mywidget.setState(response.addr.addr_state);
          mywidget.setPostalCode(response.addr.addr_postalcode);
        }
      }
      else if (response.requestStatus === 'good')
      {
        markValid();
        mywidget.setLine1(response.addr.addr_line1);
        mywidget.setLine2(response.addr.addr_line2);
        if (typeof response.addr.addr_line3 == "string")
          mywidget.setLine3(response.addr.addr_line3);

        mywidget.setCity(response.addr.addr_city);
        mywidget.setState(response.addr.addr_state);
        mywidget.setPostalCode(response.addr.addr_postalcode);
      }
      else
        throw new Error(JSON.stringify(response));
    } catch (e) {
      QMessageBox.critical(mywidget, qsTr("AddressCluster Script Failure"),
                           qsTr("AddressCluster.sGetResponse Error @ %1: %2")
                               .arg(e.lineNumber).arg(e.message));
    }
  }

  function canValidate()
  {
    if (DEBUG)
      print("canValidate() entered",
            _country.isValid(), _country.code || '?', _country.text || '?');
    var qry, result = false;
    if (AddressValidator[valname].servicecountry.indexOf(_country.code) >= 0)
      result = true;
    else if (AddressValidator[valname].servicecountry.indexOf(_country.text) >= 0)
      result = true;
    else
    {
      DEBUG && print("querying");
      qry = QSqlQuery();
      qry.prepare("SELECT country_abbr, country_name"
                + "  FROM country"
                + " WHERE :country::TEXT IN (country_abbr, country_name);");
      qry.bindValue(':country', _country.text);
      qry.exec();
      if (qry.first())
      {
        DEBUG && print("qry retrieved", qry.value('country_abbr'), qry.value('country_name'));
        result = AddressValidator[valname].servicecountry.indexOf(qry.value('country_abbr')) >= 0
              || AddressValidator[valname].servicecountry.indexOf(qry.value('country_name')) >= 0;
      }
    }

    DEBUG && print("canValidate() returning", result);
    return result;
  }

  function markDirty()
  {
    validate.text    = qsTr("Check");
    validate.enabled = mywidget.enabled && canValidate();
    validate.setStyleSheet("color: %1;".arg(namedColor("warning")));
  }

  function sValidate()
  {
    var url, message, request, params;

    validate.text    = qsTr("Wait");
    validate.enabled = false;
    validate.setStyleSheet("color: %1;".arg(namedColor("expired")));

    params = {
      addr_id:         mywidget.id(),
      addr_number:     mywidget.number,
      addr_line1:      mywidget.line1(),
      addr_line2:      mywidget.line2(),
      addr_line3:      mywidget.line3(),
      addr_city:       mywidget.city(),
      addr_state:      mywidget.state(),
      addr_postalcode: mywidget.postalCode(),
      addr_country:    mywidget.country()
    };

    message = AddressValidator[valname].buildAddress(params);
    if (message.urlstr)
    {
      request = new QNetworkRequest();
      url     = new QUrl(message.urlstr);

      if ("query" in message)
        url.setQuery(message.query);

      request.setUrl(url);
      if ("post" in message)
        netmgr.put(request, message.post);
      else
        netmgr.get(request);
    }
    else
      QMessageBox.information(mywidget, qsTr("Address Validation Error"),
                              qsTr("Don't know how to process this: %1")
                                  .arg(JSON.stringify(message)));
  }

  function markInvalid()
  {
    validate.text    = qsTr("Invalid");
    validate.enabled = mywidget.enabled && canValidate();
    validate.setStyleSheet("color: %1;".arg(namedColor("error")));
  }

  function markValid()
  {
    validate.text    = qsTr("Good");
    validate.enabled = false;
    validate.setStyleSheet("color: %1;".arg(namedColor("future")));
  }

  validate.objectName = "validate";
  layout.addWidget(validate);

  _addr1.textEdited.connect(markDirty);
  _addr2.textEdited.connect(markDirty);
  _addr3.textEdited.connect(markDirty);
  _city.textEdited.connect(markDirty);
  _state["valid(bool)"].connect(markDirty);
  _postalcode.textEdited.connect(markDirty);
  _country["newID(int)"].connect(markDirty);

  validate.clicked.connect(sValidate);
  netmgr.finished.connect(sGetResponse);

  markDirty();
})();
