/*
  This file is part of the xtaddrver Package for xTuple ERP,
  and is Copyright (c) 1999-2017 by OpenMFG LLC, d/b/a xTuple.  It
  is licensed to you under the xTuple End-User License Agreement ("the
  EULA"), the full text of which is available at www.xtuple.com/EULA.
  While the EULA gives you access to source code and encourages your
  involvement in the development process, this Package is not free
  software.  By using this software, you agree to be bound by the
  terms of the EULA.
*/

AddressValidator.USPS = {
  setup: [ { label: "User Id", metric: "USPSUserID" },
           { label: "URL",     metric: "USPSURL", "default": "testurl", width: 250 }
  ],
  liveurl: "http://production.shippingapis.com/ShippingAPI.dll",
  testurl: "http://production.shippingapis.com/ShippingAPITest.dll",
  hint:    [ { key: "addr_line3", value: "Urbanization in PR" } ],

  buildAddress: function (addr) {
    var zip4, urlsetup;
    var query = 'API=Verify&XML='
              + '<AddressValidateRequest USERID="'
              +   metrics.value("USPSUserID").trim() + '">'
              + '<Address ID="0">';

    if (addr.addr_company) query += AddressValidator.wrap('FirmName', addr.addr_company);
    query += AddressValidator.wrap('Address1', addr.addr_line2 ? addr.addr_line2 : "");
    query += AddressValidator.wrap('Address2', addr.addr_line1 ? addr.addr_line1 : "");
    query += AddressValidator.wrap('City',     addr.addr_city  ? addr.addr_city  : "");
    query += AddressValidator.wrap('State',    addr.addr_state ? addr.addr_state : "");
    if (addr.addr_state == "PR" && addr.addr_line3)
      query += AddressValidator.wrap('Urbanization', addr.addr_line3);

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

    return {
      urlstr: AddressValidator.getUrl("USPSURL", this),
      query: query
    };
  },
  extractAddress: function (obj) {
    var result = { requestStatus: "unknown" },
        response = obj.AddressValidateResponse || obj;

    if (response.Error)
    {
      result.lastError = { text:   response.Error.Description,
                           number: response.Error.Number };
      result.requestStatus = "error";
    }
    else if (response.Address && response.Address.Error)
    {
      result.lastError = { text:   response.Address.Error.Description,
                           number: response.Address.Error.Number };
      result.requestStatus = "error";
    }
    else if (response.Address)
    {
      if (response.Address.ReturnText) {
        result.lastError     = { text: response.Address.ReturnText };
        result.requestStatus = "warning";
      } else
        result.requestStatus = "good";

      result.addr = {
        addr_line1:      response.Address.Address2,
        addr_line2:      response.Address.Address1,
        addr_city:       response.Address.City,
        addr_state:      response.Address.State,
        addr_postalcode: response.Address.Zip4 && typeof response.Address.Zip4 == "string"
                           ? response.Address.Zip5 + "-" + response.Address.Zip4
                           : response.Address.Zip5
      };
      if (response.Address.Urbanization)
        result.addr.addr_line3 = response.Address.Urbanization;
    }
    return result;
  },
  /* needs debugging, a way to call, and an extract function
  buildZipCode: function (addr) {
    var url   = metrics.value("USPSURL").trim() || this.liveurl;
    var query = '?API=ZipCodeLookup&XML='
               + '<ZipCodeLookupRequest USERID="'
                 + metrics.value("USPSUserID").trim() + '">'
               + '<Address ID="0">';

    if (addr.addr_company) query += AddressValidator.wrap('FirmName', addr.addr_company);
    query += AddressValidator.wrap('Address1', addr.addr_line2 ? addr.addr_line2 : "");
    query += AddressValidator.wrap('Address2', addr.addr_line1 ? addr.addr_line1 : "");
    if (addr.addr_city)    query += AddressValidator.wrap('City',     addr.addr_city);
    if (addr.addr_state)   query += AddressValidator.wrap('State',    addr.addr_state);

    query += '</Address></ZipCodeLookupRequest>'

    return { urlstr: url, query: query };
  }, */
  /* needs debugging, a way to call, and an extract function
  buildCityState: function () {
    var url   = metrics.value("USPSURL").trim() || this.liveurl;
    var query = '?API=CityStateLookup&XML='
               + '<CityStateLookupRequest USERID="'
               + metrics.value("USPSUserID").trim() + '">'
               + '<ZipCode ID="0">'
               + AddressValidator.wrap('Zip5', addr.addr_postalcode.substring(0, 5))
               + '</ZipCode></CityStateLookupRequest>';

    return { urlstr: url, query: query };
  } */
}
