const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');const vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=name=>fs.readFileSync(path.join(root,name),'utf8');
const tokens=read('PokemonLedger.xcodeproj/project.pbxproj').match(/\s+|\/\/[^\n]*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|[{}()=;,]|[^\s{}()=;,]+/g).filter(t=>!/^\s|^\/\//.test(t)&&!t.startsWith('/*'));
let index=0;const consume=t=>assert.equal(tokens[index++],t);
function value(){const token=tokens[index++];if(token==='{'){const result={};while(tokens[index]!=='}'){const key=tokens[index++];consume('=');result[key]=value();consume(';');}consume('}');return result;}if(token==='('){const result=[];while(tokens[index]!==')'){result.push(value());if(tokens[index]===',')index++;else assert.equal(tokens[index],')');}consume(')');return result;}return token.startsWith('"')?JSON.parse(token):token;}
const project=value();assert.equal(index,tokens.length);const objects=project.objects;assert(objects[project.rootObject]);
for(const [id,item]of Object.entries(objects)){assert(/^[A-F0-9]{24}$/.test(id));for(const prop of ['fileRef','buildConfigurationList','productReference','mainGroup','productRefGroup'])if(item[prop])assert(objects[item[prop]],prop+' must resolve');for(const prop of ['children','buildConfigurations','buildPhases','targets'])if(item[prop])item[prop].forEach(ref=>assert(objects[ref],prop+' must resolve'));}
const target=Object.values(objects).find(o=>o.isa==='PBXNativeTarget');assert.equal(target.name,'PokemonLedger');assert.equal(target.productType,'com.apple.product-type.application');
const sourcePhase=Object.values(objects).find(o=>o.isa==='PBXSourcesBuildPhase');assert.equal(sourcePhase.files.length,3);
sourcePhase.files.forEach(ref=>{const file=objects[objects[ref].fileRef];assert(fs.existsSync(path.join(root,'PokemonLedger',file.path)));});
assert(read('PokemonLedger/Info.plist').includes('NSMicrophoneUsageDescription'));assert(read('PokemonLedger/Info.plist').includes('NSSpeechRecognitionUsageDescription'));
assert(read('PokemonLedger/Info.plist').includes('$(PRODUCT_MODULE_NAME).SceneDelegate'));assert(read('PokemonLedger.xcodeproj/xcshareddata/xcschemes/PokemonLedger.xcscheme').includes('0000000000000000000001F4'));
const icons=JSON.parse(read('PokemonLedger/Assets.xcassets/AppIcon.appiconset/Contents.json'));assert.equal(icons.images.length,18);icons.images.forEach(image=>assert(fs.existsSync(path.join(root,'PokemonLedger/Assets.xcassets/AppIcon.appiconset',image.filename))));
const manifest=JSON.parse(read('Web/manifest.webmanifest'));assert.equal(manifest.display,'standalone');manifest.icons.forEach(icon=>assert(fs.existsSync(path.join(root,'Web',icon.src))));
for(const name of ['app.js','engine.js','pwa.js','sw.js'])new vm.Script(read('Web/'+name),{filename:name});
new vm.Script(read('PokemonLedger/bridge.js').replace('__LEDGER_BOOTSTRAP__',JSON.stringify({data:'中文"\n账本',readError:''})));
assert(!read('Web/app.js').includes('window.Android'));assert(read('.github/workflows/ios-build.yml').includes('runs-on: macos-latest'));assert(read('.github/workflows/web-publish.yml').includes('workflow_dispatch'));
console.log('PASS: Xcode project syntax/references, scheme, Swift source membership, icons, permissions, privacy resources, web manifest and JavaScript syntax. Apple compilation has not run.');
