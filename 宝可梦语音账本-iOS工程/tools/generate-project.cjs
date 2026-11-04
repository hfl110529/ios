const fs=require('node:fs');const path=require('node:path');const sharp=require('./dependencies.cjs')('sharp');
const root=path.resolve(__dirname,'..');
function write(name,text){const file=path.join(root,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,text);}
const plist=body=>`<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0"><dict>${body}</dict></plist>\n`;
write('PokemonLedger/Info.plist',plist(`
<key>CFBundleDisplayName</key><string>宝可梦语音账本</string>
<key>CFBundleExecutable</key><string>$(EXECUTABLE_NAME)</string>
<key>CFBundleIdentifier</key><string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
<key>CFBundleInfoDictionaryVersion</key><string>6.0</string>
<key>CFBundleName</key><string>$(PRODUCT_NAME)</string>
<key>CFBundlePackageType</key><string>APPL</string>
<key>CFBundleShortVersionString</key><string>$(MARKETING_VERSION)</string>
<key>CFBundleVersion</key><string>$(CURRENT_PROJECT_VERSION)</string>
<key>LSRequiresIPhoneOS</key><true/>
<key>NSMicrophoneUsageDescription</key><string>使用麦克风听取你说的消费、收入和时间，确认后生成账单。</string>
<key>NSSpeechRecognitionUsageDescription</key><string>将你说的记账内容转为文字。在线识别可能由 Apple 处理音频，支持的设备可选择离线识别。</string>
<key>ITSAppUsesNonExemptEncryption</key><false/>
<key>UIUserInterfaceStyle</key><string>Light</string>
<key>UILaunchScreen</key><dict><key>UIColorName</key><string>LaunchBackground</string></dict>
<key>UIApplicationSceneManifest</key><dict><key>UIApplicationSupportsMultipleScenes</key><false/><key>UISceneConfigurations</key><dict><key>UIWindowSceneSessionRoleApplication</key><array><dict><key>UISceneConfigurationName</key><string>Default Configuration</string><key>UISceneDelegateClassName</key><string>$(PRODUCT_MODULE_NAME).SceneDelegate</string></dict></array></dict></dict>
<key>UISupportedInterfaceOrientations</key><array><string>UIInterfaceOrientationPortrait</string><string>UIInterfaceOrientationLandscapeLeft</string><string>UIInterfaceOrientationLandscapeRight</string></array>
<key>UISupportedInterfaceOrientations~ipad</key><array><string>UIInterfaceOrientationPortrait</string><string>UIInterfaceOrientationPortraitUpsideDown</string><string>UIInterfaceOrientationLandscapeLeft</string><string>UIInterfaceOrientationLandscapeRight</string></array>`));
write('PokemonLedger/PrivacyInfo.xcprivacy',plist(`<key>NSPrivacyTracking</key><false/><key>NSPrivacyTrackingDomains</key><array/><key>NSPrivacyCollectedDataTypes</key><array/><key>NSPrivacyAccessedAPITypes</key><array/>`));
const uuid=n=>n.toString(16).toUpperCase().padStart(24,'0');
const objects={};function obj(n,value){objects[uuid(n)]=value;return uuid(n);}
const files=[['AppDelegate.swift','sourcecode.swift'],['LedgerViewController.swift','sourcecode.swift'],['SpeechController.swift','sourcecode.swift'],['bridge.js','sourcecode.javascript'],['Info.plist','text.plist.xml'],['PrivacyInfo.xcprivacy','text.xml'],['Assets.xcassets','folder.assetcatalog']];
files.forEach(([name,type],i)=>obj(100+i,`{ isa = PBXFileReference; lastKnownFileType = ${type}; path = ${name}; sourceTree = "<group>"; }`));
obj(110,'{ isa = PBXFileReference; lastKnownFileType = folder; path = Web; sourceTree = "<group>"; }');
obj(111,'{ isa = PBXFileReference; explicitFileType = wrapper.application; includeInIndex = 0; path = PokemonLedger.app; sourceTree = BUILT_PRODUCTS_DIR; }');
[100,101,102,103,105,106,110].forEach((ref,i)=>obj(200+i,`{ isa = PBXBuildFile; fileRef = ${uuid(ref)}; }`));
obj(300,`{ isa = PBXGroup; children = (${uuid(301)}, ${uuid(110)}, ${uuid(302)},); sourceTree = "<group>"; }`);
obj(301,`{ isa = PBXGroup; children = (${files.map((_,i)=>uuid(100+i)).join(', ')},); path = PokemonLedger; sourceTree = "<group>"; }`);
obj(302,`{ isa = PBXGroup; children = (${uuid(111)},); name = Products; sourceTree = "<group>"; }`);
obj(400,`{ isa = PBXSourcesBuildPhase; buildActionMask = 2147483647; files = (${[200,201,202].map(uuid).join(', ')},); runOnlyForDeploymentPostprocessing = 0; }`);
obj(401,`{ isa = PBXResourcesBuildPhase; buildActionMask = 2147483647; files = (${[203,204,205,206].map(uuid).join(', ')},); runOnlyForDeploymentPostprocessing = 0; }`);
obj(402,'{ isa = PBXFrameworksBuildPhase; buildActionMask = 2147483647; files = (); runOnlyForDeploymentPostprocessing = 0; }');
obj(500,`{ isa = PBXNativeTarget; buildConfigurationList = ${uuid(601)}; buildPhases = (${uuid(400)}, ${uuid(402)}, ${uuid(401)},); buildRules = (); dependencies = (); name = PokemonLedger; productName = PokemonLedger; productReference = ${uuid(111)}; productType = "com.apple.product-type.application"; }`);
obj(600,`{ isa = XCConfigurationList; buildConfigurations = (${uuid(700)}, ${uuid(701)},); defaultConfigurationIsVisible = 0; defaultConfigurationName = Release; }`);
obj(601,`{ isa = XCConfigurationList; buildConfigurations = (${uuid(702)}, ${uuid(703)},); defaultConfigurationIsVisible = 0; defaultConfigurationName = Release; }`);
const base='CLANG_ENABLE_MODULES = YES; CLANG_ENABLE_OBJC_ARC = YES; IPHONEOS_DEPLOYMENT_TARGET = 16.0; SDKROOT = iphoneos; SWIFT_VERSION = 5.0; SWIFT_STRICT_CONCURRENCY = minimal; ENABLE_USER_SCRIPT_SANDBOXING = YES;';
obj(700,`{ isa = XCBuildConfiguration; buildSettings = { ${base} DEBUG_INFORMATION_FORMAT = dwarf; ENABLE_TESTABILITY = YES; SWIFT_ACTIVE_COMPILATION_CONDITIONS = DEBUG; SWIFT_OPTIMIZATION_LEVEL = "-Onone"; }; name = Debug; }`);
obj(701,`{ isa = XCBuildConfiguration; buildSettings = { ${base} DEBUG_INFORMATION_FORMAT = "dwarf-with-dsym"; SWIFT_COMPILATION_MODE = wholemodule; SWIFT_OPTIMIZATION_LEVEL = "-O"; VALIDATE_PRODUCT = YES; }; name = Release; }`);
const app='ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon; CODE_SIGN_STYLE = Automatic; DEVELOPMENT_TEAM = ""; CURRENT_PROJECT_VERSION = 1; GENERATE_INFOPLIST_FILE = NO; INFOPLIST_FILE = PokemonLedger/Info.plist; MARKETING_VERSION = 1.0.0; PRODUCT_BUNDLE_IDENTIFIER = cn.local.pokemonledger.ios; PRODUCT_NAME = "$(TARGET_NAME)"; SUPPORTED_PLATFORMS = "iphoneos iphonesimulator"; SUPPORTS_MACCATALYST = NO; TARGETED_DEVICE_FAMILY = "1,2"; SWIFT_EMIT_LOC_STRINGS = NO; LD_RUNPATH_SEARCH_PATHS = "$(inherited) @executable_path/Frameworks";';
obj(702,`{ isa = XCBuildConfiguration; buildSettings = { ${app} }; name = Debug; }`);obj(703,`{ isa = XCBuildConfiguration; buildSettings = { ${app} }; name = Release; }`);
obj(1,`{ isa = PBXProject; attributes = { BuildIndependentTargetsInParallel = YES; LastSwiftUpdateCheck = 1600; LastUpgradeCheck = 1600; TargetAttributes = { ${uuid(500)} = { CreatedOnToolsVersion = 16.0; }; }; }; buildConfigurationList = ${uuid(600)}; compatibilityVersion = "Xcode 14.0"; developmentRegion = zh_CN; hasScannedForEncodings = 0; knownRegions = (zh_CN, en, Base,); mainGroup = ${uuid(300)}; productRefGroup = ${uuid(302)}; projectDirPath = ""; projectRoot = ""; targets = (${uuid(500)},); }`);
write('PokemonLedger.xcodeproj/project.pbxproj',`// !$*UTF8*$!\n{ archiveVersion = 1; classes = {}; objectVersion = 56; objects = {\n${Object.entries(objects).map(([id,v])=>id+' = '+v+';').join('\n')}\n}; rootObject = ${uuid(1)}; }\n`);
write('PokemonLedger.xcodeproj/project.xcworkspace/contents.xcworkspacedata','<?xml version="1.0" encoding="UTF-8"?><Workspace version="1.0"><FileRef location="self:"></FileRef></Workspace>');
const buildable=`<BuildableReference BuildableIdentifier="primary" BlueprintIdentifier="${uuid(500)}" BuildableName="PokemonLedger.app" BlueprintName="PokemonLedger" ReferencedContainer="container:PokemonLedger.xcodeproj"/>`;
write('PokemonLedger.xcodeproj/xcshareddata/xcschemes/PokemonLedger.xcscheme',`<?xml version="1.0" encoding="UTF-8"?><Scheme LastUpgradeVersion="1600" version="1.3"><BuildAction parallelizeBuildables="YES" buildImplicitDependencies="YES"><BuildActionEntries><BuildActionEntry buildForTesting="YES" buildForRunning="YES" buildForProfiling="YES" buildForArchiving="YES" buildForAnalyzing="YES">${buildable}</BuildActionEntry></BuildActionEntries></BuildAction><TestAction buildConfiguration="Debug" selectedDebuggerIdentifier="Xcode.DebuggerFoundation.Debugger.LLDB" selectedLauncherIdentifier="Xcode.IDEFoundation.Launcher.LLDB" shouldUseLaunchSchemeArgsEnv="YES"/><LaunchAction buildConfiguration="Debug" selectedDebuggerIdentifier="Xcode.DebuggerFoundation.Debugger.LLDB" selectedLauncherIdentifier="Xcode.IDEFoundation.Launcher.LLDB" launchStyle="0" useCustomWorkingDirectory="NO" ignoresPersistentStateOnLaunch="NO" debugServiceExtension="internal" allowLocationSimulation="YES"><BuildableProductRunnable runnableDebuggingMode="0">${buildable}</BuildableProductRunnable></LaunchAction><ProfileAction buildConfiguration="Release" shouldUseLaunchSchemeArgsEnv="YES" savedToolIdentifier="" useCustomWorkingDirectory="NO" debugServiceExtension="internal"><BuildableProductRunnable runnableDebuggingMode="0">${buildable}</BuildableProductRunnable></ProfileAction><AnalyzeAction buildConfiguration="Debug"/><ArchiveAction buildConfiguration="Release" revealArchiveInOrganizer="YES"/></Scheme>`);
(async()=>{
 const asset='PokemonLedger/Assets.xcassets';write(asset+'/Contents.json',JSON.stringify({info:{author:'xcode',version:1}},null,2));
 write(asset+'/LaunchBackground.colorset/Contents.json',JSON.stringify({colors:[{idiom:'universal',color:{'color-space':'srgb',components:{red:'0.980',green:'0.973',blue:'0.949',alpha:'1.000'}}}],info:{author:'xcode',version:1}},null,2));
 const specs=[['iphone',20,2],['iphone',20,3],['iphone',29,2],['iphone',29,3],['iphone',40,2],['iphone',40,3],['iphone',60,2],['iphone',60,3],['ipad',20,1],['ipad',20,2],['ipad',29,1],['ipad',29,2],['ipad',40,1],['ipad',40,2],['ipad',76,1],['ipad',76,2],['ipad',83.5,2],['ios-marketing',1024,1]];
 const images=[];for(const[idiom,size,scale]of specs){const file=`icon-${idiom}-${size}@${scale}x.png`,pixels=Math.round(size*scale);await sharp(path.join(root,'app-icon.png')).resize(pixels,pixels).flatten({background:'#F8D969'}).removeAlpha().png().toFile(path.join(root,asset,'AppIcon.appiconset',file));images.push({filename:file,idiom,size:`${size}x${size}`,scale:`${scale}x`});}
 write(asset+'/AppIcon.appiconset/Contents.json',JSON.stringify({images,info:{author:'xcode',version:1}},null,2));
 for(const size of [180,192,512]){fs.mkdirSync(path.join(root,'Web','icons'),{recursive:true});await sharp(path.join(root,'app-icon.png')).resize(size,size).flatten({background:'#F8D969'}).removeAlpha().png().toFile(path.join(root,'Web','icons',`icon-${size}.png`));}
 console.log('Generated Xcode project, scheme, privacy and permission plists, all iOS/PWA icons.');
})().catch(e=>{console.error(e);process.exit(1);});
