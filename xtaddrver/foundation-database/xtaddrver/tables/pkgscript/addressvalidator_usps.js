/*
  This file is part of the xtaddrver Package for xTuple ERP,
  and is Copyright (c) 1999-2018 by OpenMFG LLC, d/b/a xTuple.
  It is licensed to you under the Common Public Attribution License
  version 1.0, the full text of which (including xTuple-specific Exhibits)
  is available at www.xtuple.com/CPAL.  By using this software, you agree
  to be bound by its terms.
*/

AddressValidator.USPS = {
  setup: [ { label: "User Id", metric: "USPSUserID" },
           { label: "URL",     metric: "USPSURL",      "default": "liveurl", width: 250 },
           { message: "How do you want to use the street address?"   },
           { label: "Line 1", metric: "USPSLine1", combobox: "fields" },
           { label: "Line 2", metric: "USPSLine2", combobox: "fields" },
           { label: "Line 3", metric: "USPSLine3", combobox: "fields" },
           { checkbox: "Show Hints", metric: "USPSHints" }
  ],
  servicecountry: [ 'US' ],
  // Address1 and Address2 are reversed from USPS docs; this seems to be how they're really handled
  fields: [ { code: "FirmName",     text: "Name of company at this address"         },
            { code: "Address2",     text: "Main street address"                     },
            { code: "Address1",     text: "Apartment, suite, etc."                  },
            { code: "Urbanization", text: "Urbanization (required for Puerto Rico)" },
            { code: "[]",           text: "[ unvalidated ]"                         }
  ],
  showhints: "USPSHints",
  liveurl: "http://production.shippingapis.com/ShippingAPI.dll",
  testurl: "http://production.shippingapis.com/ShippingAPITest.dll",

  getHint: function (pLine) {
    var hint = '', metricname;
    switch (pLine) {
      case 'line1': metricname = "USPSLine1"; break;
      case 'line2': metricname = "USPSLine2"; break;
      case 'line3': metricname = "USPSLine3"; break;
    }
    if (metrics.boolean("USPSHints") && metricname)
    {
      hint = this.fields.filter(function (e) { return e.code == metrics.value(metricname); });
      if (Array.isArray(hint))
        hint = hint[0].text;
    }
    return hint;
  },

  // find the property in the addr structure that corresponds to the given USPS API field
  getAddrValue: function (addr, pAPIFieldName) {
    var value;
    switch (pAPIFieldName) {
      case metrics.value("USPSLine1"): value = addr.addr_line1; break;
      case metrics.value("USPSLine2"): value = addr.addr_line2; break;
      case metrics.value("USPSLine3"): value = addr.addr_line3; break;
    };
    return value || "";
  },

  buildAddress: function (addr) {
    var zip4;
    var query = 'API=Verify&XML='
              + '<AddressValidateRequest USERID="'
              +   metrics.value("USPSUserID").trim() + '">'
              + '<Address ID="0">';

    query += AddressValidator.wrap('FirmName', this.getAddrValue(addr, 'FirmName'));
    query += AddressValidator.wrap('Address1', this.getAddrValue(addr, 'Address1'));
    query += AddressValidator.wrap('Address2', this.getAddrValue(addr, 'Address2'));
    query += AddressValidator.wrap('City',     addr.addr_city  || "");
    query += AddressValidator.wrap('State',    addr.addr_state || "");
    query += AddressValidator.wrap('Urbanization', this.getAddrValue(addr, 'Urbanization'));

    query += AddressValidator.wrap('Zip5', addr.addr_postalcode
                                                ? addr.addr_postalcode.substring(0, 5)
                                                : "");

    if (! addr.addr_postalcode)
      zip4 = "";
    else if (addr.addr_postalcode.indexOf('-') > 0)
      zip4 = addr.addr_postalcode.substring(addr.addr_postalcode.indexOf('-') + 1);
    else
      zip4 = addr.addr_postalcode.substring(5);
    query += AddressValidator.wrap('Zip4', zip4 || "");

    query += '</Address></AddressValidateRequest>';

    DEBUG && print('USPS.buildAddress', query);
    return {
      urlstr: AddressValidator.getUrl("USPSURL", this),
      query: query
    };
  },
  extractAddress: function (obj) {
    DEBUG && print('USPS extractAddress() entered with', JSON.stringify(obj));
    var result = { requestStatus: "unknown" },
        response = ("AddressValidateResponse" in obj) ? obj.AddressValidateResponse : obj;

    if (response.Error)
    {
      result.lastError = { text:   response.Error.Description.toString(),
                           number: response.Error.Number.toString() };
      result.requestStatus = "error";
    }
    else if (response.Address && response.Address.Error)
    {
      result.lastError = { text:   response.Address.Error.Description.toString(),
                           number: response.Address.Error.Number.toString() };
      result.requestStatus = "error";
    }
    else if (response.Address)
    {
      if (response.Address.ReturnText) {
        result.lastError     = { text: response.Address.ReturnText.toString() };
        result.requestStatus = "warning";
      } else
        result.requestStatus = "good";

      result.addr = {
        addr_city:       response.Address.City.toString(),
        addr_state:      response.Address.State.toString(),
        addr_postalcode: response.Address.Zip5
      };
      if (String(response.Address.Zip4.length) == 4)
        result.addr.addr_postalcode += "-" + String(response.Address.Zip4);
      if (metrics.value("USPSLine1") != "[]")
        result.addr.addr_line1 = response.Address[metrics.value("USPSLine1")];
      if (metrics.value("USPSLine2") != "[]")
        result.addr.addr_line2 = response.Address[metrics.value("USPSLine2")];
      if (metrics.value("USPSLine3") != "[]")
        result.addr.addr_line3 = response.Address[metrics.value("USPSLine3")];
    }
    DEBUG && print('USPS extractAddress() returning', JSON.stringify(result));
    return result;
  },
}

// copied from _ (underscore) to allow require()
// not sure this is the right way to handle this
if (typeof exports !== 'undefined') {
  if (typeof module !== 'undefined' && module.exports) {
    exports = module.exports = AddressValidator.USPS;
  }
  exports.USPS = AddressValidator.USPS;
}
