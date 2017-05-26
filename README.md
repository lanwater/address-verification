# address-verification

The xTuple ERP Address Validation package is a commercial extension
to xTuple ERP that allows dynamic checking and updating of addresses,
typically using web services APIs.

## To install the extension

You need access to commercial downloads on either github or xtuple.org.

1. Download the latest release of the `xtaddrver-`**VER**`.gz` file from
   [github](https://github.com/xtuple/address-verification/releases)
   or xTuple's [commercial-downloads](https://xtuple.org/webfm)
2. Launch xTuple's [Updater](https://github.com/xtuple/updater/releases) application
3. **File > Open** and select the `xtaddrver-`**VER**`.gz` you just downloaded
4. Click **Update**

## To build the extension

This is only necessary if you are a developer about to release a
new version of the address-verification extension:

```
Linux$ cd address-verification
Linux$ make
```

This creates an Updater package in the `packages` directory.
