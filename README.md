# address-verification

The xTuple ERP Address Validation package is an extension
to xTuple ERP that allows dynamic checking and updating of addresses,
typically using web services APIs.

## Installation

This extension has not yet been formally released (Oct 2018). There is a
pre-release package build in the `packages` directory. If you want the latest
code, you can [build the Updater package yourself](#building).

After the extension has been released you will be able to download the Updater package
from [GitHub](https://github.com/xtuple/address-verification/releases), SourceForge.
or xTuple's [commercial-downloads](https://xtuple.org/webfm)

## Building

This is typically necessary if you are a developer about to release a
new version of the address-verification extension:

```
Linux$ cd address-verification
Linux$ make
```

This creates an Updater package in the `packages` directory.
