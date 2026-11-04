#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
plutil -lint PokemonLedger/Info.plist PokemonLedger/PrivacyInfo.xcprivacy
xcodebuild -project PokemonLedger.xcodeproj -scheme PokemonLedger -configuration Debug -destination 'generic/platform=iOS Simulator' -derivedDataPath build/simulator CODE_SIGNING_ALLOWED=NO build
xcodebuild -project PokemonLedger.xcodeproj -scheme PokemonLedger -configuration Release -destination 'generic/platform=iOS' -derivedDataPath build/device CODE_SIGNING_ALLOWED=NO build
mkdir -p build/package/Payload
ditto build/device/Build/Products/Release-iphoneos/PokemonLedger.app build/package/Payload/PokemonLedger.app
cd build/package
ditto -c -k --sequesterRsrc --keepParent Payload PokemonLedger-unsigned.ipa
echo 'Unsigned IPA created. It still needs your own Apple signing before installation.'
