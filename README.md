The Bitcoin.com wallet is a fork of the Copay Wallet (https://github.com/bitpay/copay).

The Bitcoin.com wallet is a secure bitcoin wallet platform for both desktop and mobile devices. It uses [Bitcore Wallet Service](https://github.com/Bitcoin-com/bitcore-wallet-service) (our fork of the [Bitpay Bitcore Wallet Service](https://github.com/bitpay/bitcore-wallet-service)) (BWS) for peer synchronization and network interfacing.

Binary versions of The Bitcoin.com wallet are available for download at [Bitcoin.com](https://www.bitcoin.com/choose-your-wallet/bitcoin-com-wallet).

For a list of frequently asked questions please visit the [Bitcoin.com Wallet FAQ](https://walletsupport.bitcoin.com/).

## Main Features

- Multiple wallet creation and management in-app
- Creates both Bitcoin Cash (BCH) and Bitcoin Core (BTC) wallets by default
- Intuitive, multisignature security for personal or shared wallets
- Easy spending proposal flow for shared wallets and group payments
- [BIP32](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki) Hierarchical deterministic (HD) address generation and wallet backups
- Device-based security: all private keys are stored locally, not in the cloud
- Support for Bitcoin testnet wallets
- Synchronous access across all major mobile and desktop platforms
- Payment protocol (BIP70-BIP73) support: easily-identifiable payment requests and verifiable, secure bitcoin payments
- Support for over 150 currency pricing options and unit denomination in BTC or bits
- Mnemonic (BIP39) support for wallet backups
- Paper wallet sweep support (BIP38)
- Email notifications for payments and transfers
- Push notifications (only available for ios and android versions)
- Customizable wallet naming and background colors
- Multiple languages supported
- Available for [iOS](https://itunes.apple.com/us/app/bitcoin-wallet-by-bitcoin-com/id1252903728?ls=1), [Android](https://play.google.com/store/apps/details?id=com.bitcoin.mwallet), [Linux](https://www.bitcoin.com/api/rv/click?p=2&b=435&z=6&c=be81fd753f&dest=https://github.com/Bitcoin-com/Wallet/releases/download/4.0.4/bitcoin-com-wallet-4.0.4-linux-x64.tar.gz), [Windows](https://www.bitcoin.com/api/rv/click?p=2&b=435&z=6&c=be81fd753f&dest=https://github.com/Bitcoin-com/Wallet/releases/download/4.0.4/bitcoin-com-wallet-4.0.4-win-x64.zip) and [OS X](https://www.bitcoin.com/api/rv/click?p=2&b=435&z=6&c=be81fd753f&dest=https://github.com/Bitcoin-com/Wallet/releases/download/4.0.4/bitcoin-com-wallet-4.0.4-osx.dmg) devices

## Building the wallet
You don't need to run npm install, run apply:bitcoincom instead
```sh
npm run apply:bitcoincom
```
There is a bug when building the next step, you will need to go directly into one of the javascript files in node_modules
```sh
nano node_modules/asn1.js-rfc5280/index.js
```
Delete the whole try catch part at the top, replace it with only
```
var asn1 = require('asn1.js');
```
If you don't do this, you will get this error:
```sh
» <!doctype html>
» ^
» ParseError: Unexpected token
```

## Testing in a Browser

> **Note:** This method should only be used for development purposes. When running the Bitcoin.com wallet in a normal browser environment, browser extensions and other malicious code might have access to internal data and private keys.

Clone the repo and open the directory:

```sh
git clone https://github.com/Bitcoin-com/Wallet.git
cd Wallet
```

Ensure you have [Node](https://nodejs.org/) installed, then install and start the Bitcoin.com wallet:

```sh
npm run apply:bitcoincom
npm start
```

Visit [`localhost:8100`](http://localhost:8100/) to view the app.

A watch task is also available to rebuild components of the app as changes are made. This task can be run in a separate process – while the server started by `npm start` is running – to quickly test changes.

```
npm run watch
```

### External Config
When creating the production version, the build scripts expect a configuration file called `leanplum-config.json` to be in the directory that contains the project folder, with contents in the following format:

```json
{
  "dev": {
    "appId": "",
    "key": ""
  },
  "prod": {
    "appId": "",
    "key": ""
  }
}
```

## Testing on Real Devices

It's recommended that all final testing be done on a real device – both to assess performance and to enable features that are unavailable to the emulator (e.g. a device camera).

### Android

Follow the [Cordova Android Platform Guide](https://cordova.apache.org/docs/en/latest/guide/platforms/android/) to set up your development environment.

When your developement enviroment is ready, run the `start:android` npm package script.

```sh
npm run apply:bitcoincom
npm run start:android
```

### iOS

Follow the [Cordova iOS Platform Guide](https://cordova.apache.org/docs/en/latest/guide/platforms/ios/) to set up your development environment.

When your developement enviroment is ready, run the `start:ios` npm package script.

```sh
npm run apply:bitcoincom
npm run start:ios
```

### Desktop (Linux, macOS, and Windows)

The desktop version of the Bitcoin.com wallet currently uses NW.js, an app runtime based on Chromium. To get started, first install NW.js on your system from [the NW.js website](https://nwjs.io/).

When NW.js is installed, run the `start:desktop` npm package script.

```sh
npm run apply:bitcoincom
npm run start:desktop
```

## Build Bitcoin.com wallet App Bundles

Before building the release version for a platform, run the `clean-all` command to delete any untracked files in your current working directory. (Be sure to stash any uncommited changes you've made.) This guarantees consistency across builds for the current state of this repository.

The `build:*-release` commands build the production version of the app, and bundle it with the release version of the platform being built.

### Android

```sh
npm run clean-all
npm run apply:bitcoincom
npm run build:android-release
```

### iOS

```sh
npm run clean-all
npm run apply:bitcoincom
npm run build:ios-release
```

### Desktop (Linux, macOS, and Windows)

```sh
npm run clean-all
npm run apply:bitcoincom
npm run build:desktop-release
```

## About The Bitcoin.com Wallet

### General

The Bitcoin.com wallet implements a multisig wallet using [p2sh](https://en.bitcoin.it/wiki/Pay_to_script_hash) addresses.  It supports multiple wallets, each with its own configuration, such as 3-of-5 (3 required signatures from 5 participant peers) or 2-of-3.  To create a multisig wallet shared between multiple participants, the Bitcoin.com wallet requires the extended public keys of all the wallet participants.  Those public keys are then incorporated into the wallet configuration and combined to generate a payment address where funds can be sent into the wallet.  Conversely, each participant manages their own private key and that private key is never transmitted anywhere.

To unlock a payment and spend the wallet's funds, a quorum of participant signatures must be collected and assembled in the transaction.  The funds cannot be spent without at least the minimum number of signatures required by the wallet configuration (2-of-3, 3-of-5, 6-of-6, etc.).  Once a transaction proposal is created, the proposal is distributed among the wallet participants for each to sign the transaction locally.  Finally, when the transaction is signed, the last signing participant will broadcast the transaction to the Bitcoin network.

The Bitcoin.com wallet also implements [BIP32](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki) to generate new addresses for peers.  The public key that each participant contributes to the wallet is a BIP32 extended public key.  As additional public keys are needed for wallet operations (to produce new addresses to receive payments into the wallet, for example) new public keys can be derived from the participants' original extended public keys.  Once again, it's important to stress that each participant keeps their own private keys locally - private keys are not shared - and are used to sign transaction proposals to make payments from the shared wallet.

For more information regarding how addresses are generated using this procedure, see: [Structure for Deterministic P2SH Multisignature Wallets](https://github.com/bitcoin/bips/blob/master/bip-0045.mediawiki).

## Bitcoin.com Wallet Backups and Recovery

The Bitcoin.com wallet uses BIP39 mnemonics for backing up wallets.  The BIP44 standard is used for wallet address derivation. Multisig wallets use P2SH addresses, while non-multisig wallets use P2PKH.

## Wallet Export Format

The Bitcoin.com wallet encrypts the backup with the [Stanford JS Crypto Library](http://bitwiseshiftleft.github.io/sjcl/).  To extract the private key of your wallet you can use https://bitwiseshiftleft.github.io/sjcl/demo/, copy the backup to 'ciphertext' and enter your password.  The resulting JSON will have a key named: `xPrivKey`, that is the extended private key of your wallet.  That information is enough to sign any transaction from your wallet, so be careful when handling it!

Using a tool like [Bitcore PlayGround](http://bitcore.io/playground) all wallet addresses can be generated. (TIP: Use the `Address` section for P2PKH address type wallets and `Multisig Address` for P2SH address type wallets). For multisig addresses, the required number of signatures (key `m` on the export) is also needed to recreate the addresses.


## Bitcore Wallet Service

The Bitcoin.com wallet depends on [Bitcore Wallet Service](https://github.com/Bitcoin-com/bitcore-wallet-service) (BWS) for blockchain information, networking and synchronization.  A BWS instance can be setup and operational within minutes or you can use a public instance like `https://bws.bitcoin.com`.  Switching between BWS instances is very simple and can be done with a click from within the wallet.  BWS also allows the Bitcoin.com wallet to interoperate with other wallets like [Bitcore Wallet CLI] (https://github.com/bitpay/bitcore-wallet).

## Translations
The Bitcoin.com wallet uses standard gettext PO files for translations and [Crowdin](https://crowdin.com/project/bitcoincom-wallet) as the front-end tool for translators.  To join our team of translators, please create an account at [Crowdin](https://crowdin.com) and translate the Bitcoin.com wallet documentation and application text into your native language.

To download and build using the latest translations from Crowdin, please use the following commands:

```sh
cd i18n
node crowdin_download.js
```

This will download all partial and complete language translations while also cleaning out any untranslated ones.

## Contributing to this project

Anyone and everyone is welcome to contribute. Please take a moment to
review the [guidelines for contributing](CONTRIBUTING.md).

* [Bug reports](CONTRIBUTING.md#bugs)
* [Feature requests](CONTRIBUTING.md#features)
* [Pull requests](CONTRIBUTING.md#pull-requests)

## Support

 Please see [Support requests](CONTRIBUTING.md#support)
