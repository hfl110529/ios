# 宝可梦语音账本 · iOS 适配版

已提供原生 iOS 工程和可添加到 iPhone 主屏幕的网页版本。功能包括语音记账确认、自选账单日期时间、收入/支出分类、时间范围筛选、统计、CSV / JSON 导出和三种宝可梦伙伴主题。

**当前交付没有已签名 IPA，也没有已发布的网站地址。当前电脑是 Windows，无法运行 Xcode；原生 Swift 尚未编译或经过真机测试。**

## 没有 Mac 时使用

最快的路线是将 `Web/` 部署到自己的 HTTPS 网站，在 iPhone Safari 中打开，然后选择“分享 → 添加到主屏幕”。项目附有可手动启动的 GitHub Pages 发布流程，见 `没有Mac-使用说明.md`。

网页版首次联网打开并完成缓存后，可以离线打开、录入、查看和导出账单。语音识别仍取决于 Safari / iOS 的支持和网络状态；不可用时，可点击 iPhone 键盘上的听写麦克风输入一句话，再点“整理成账单”。网页没有 iOS 原生的离线识别开关。

浏览器账单保存在当前设备、当前网址的本地存储中，原生版账单则保存在应用私有文件中。两者不会自动同步。换设备、换网站地址、清除浏览器数据或卸载前应导出记录。预览图是独立测试数据，实际应用初始账本为空。

## 原生工程

使用 Xcode 15 或以上打开 `PokemonLedger.xcodeproj`，选择 `PokemonLedger` scheme。目标系统为 iOS 16.0 及以上，支持 iPhone 和 iPad。

原生接口包括：

- `SFSpeechRecognizer` 中文语音识别和 `AVAudioEngine` 麦克风采集，支持权限处理、部分转写、手动结束、取消、30 秒上限和离线优先。
- `WKWebView` 本地界面，包含可信主框架校验和弱引用消息代理。
- 应用私有账本使用原子写入，并在写入成功后才更新页面；写入失败不会把未保存记录显示为已保存。
- `UIDocumentPickerViewController` 将 CSV / JSON 保存到“文件”中的自选位置。
- 图标、启动背景、麦克风和语音权限说明、隐私清单和共享 scheme。

`PokemonLedger/bridge.js` 由原生层在页面脚本运行前注入，`Web/` 同时可独立部署。语音可能通过 Apple 在线处理，选择离线优先时要求设备支持离线中文识别。

## 云端构建和签名

`.github/workflows/ios-build.yml` 可在你自己的 GitHub 仓库中手动启动，在 macOS runner 上编译模拟器和真机目标，然后导出 **未签名** IPA。

这个流程尚未在当前会话运行。只有编译成功后才会有 IPA 下载产物；未签名 IPA 不能直接安装到 iPhone。还需要你自己的 Apple ID / 证书及匹配的描述文件，使用合适的签名安装流程。工程没有内置任何账号、密码、证书或描述文件。公开上架和 TestFlight 分发也未执行。

## 目录与检查

- `PokemonLedger/`：Swift 原生层、权限、隐私与图标。
- `PokemonLedger.xcodeproj/`：原生 Xcode 工程和共享 scheme。
- `Web/`：界面、金额解析、PWA 清单、离线缓存和静态图像。
- `tools/build-unsigned.sh`：macOS / Xcode 编译和打包脚本。
- `.github/workflows/`：手动云端构建、手动网页发布流程。

本机已完成：中文金额解析检查、Xcode 工程语法和引用检查、权限/隐私 XML 检查、图标与 scheme 检查、JavaScript 语法检查、离线打开/新增/持久化、日期筛选和 CSV 下载、18 组布局，以及原生保存失败/成功、语音和文件导出的模拟回调检查。

界面验证使用 Windows Chrome 模拟手机尺寸，不代表已在 Safari 或 iPhone 上运行。Swift 编译、真实麦克风识别、iOS 文件保存和签名仍需 Apple 构建环境与目标设备验证。

开发时先安装 npm 开发依赖，然后运行 `npm test`、`npm run test:ui`。图标与工程配置可用 `npm run generate` 重新生成。测试数据仅写入测试浏览器上下文。
