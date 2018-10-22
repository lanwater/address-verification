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

(function () {
  var AddressValidator; // declare first, overwrite by include()
  include("AddressValidator");

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
      validate   = new QPushButton("Validate", mywidget);

  var netmgr     = new QNetworkAccessManager(mywidget);

  if (Array.isArray(AddressValidator[valname].hint))
    AddressValidator[valname].hint.forEach(function (e) {
      print(e);
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
    try {
      var response = AddressValidator.parseResponse(netreply);
      response = AddressValidator[valname].extractAddress(response);

      if (! response)
        markDirty();
      else if (response.requestStatus === 'error')
      {
        markInvalid();
        QMessageBox.critical(mywidget, "Address Validation Error",
                             valname + " reported an error:\n" +
                             response.lastError.text +
                             (response.lastError.number
                                ? " [" + response.lastError.number + "]"
                                : ""));
      }
      else if (response.requestStatus === 'warning')
      {
        markDirty();
        QMessageBox.warning(mywidget, "Address Validation Warning",
                            valname + " warning:\n" +
                            response.lastError.text +
                            (response.lastError.number
                                ? " [" + response.lastError.number + "]"
                                : ""));
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
      QMessageBox.critical(mywidget, "AddressCluster Script Failure",
                           "AddressCluster.sGetResponse Error @ "
                           + e.lineNumber + ": " + e.message);
    }
  }

  function markDirty()
  {
    validate.text    = "Check";
    validate.enabled = mywidget.enabled;
    validate.setStyleSheet("color: " + namedColor("warning") + ";");
  }

  function sValidate()
  {
    var url, message, request, params;

    validate.text    = "Wait";
    validate.enabled = false;
    validate.setStyleSheet("color: " + namedColor("expired") + ";");

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
      QMessageBox.information(mywidget, "Address Validation Error",
                              "Don't know how to process this: "
                              + JSON.stringify(message));
  }
   
  function markInvalid()
  {
    validate.text    = "Invalid";
    validate.enabled = mywidget.enabled;
    validate.setStyleSheet("color: " + namedColor("error") + ";");
  }

  function markValid()
  {
    validate.text    = "Good";
    validate.enabled = false;
    validate.setStyleSheet("color: " + namedColor("future") + ";");
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
