# 没有 Mac，怎样在 iPhone 上使用

你当前有两份交付：iPhone 主屏幕网页版，以及带云端构建流程的原生 iOS 工程。**ZIP 是源文件，不是可以点一下安装的 IPA。现在没有已发布的网址，也没有已签名 IPA。**

## 路线一：主屏幕网页版，不需要 Mac 或 Apple 签名

如果你已经有 HTTPS 网站，把“iPhone主屏幕版.zip”解压后的所有文件上传到同一个网站目录，使 `index.html` 可以打开，然后直接跳到第 5 步。

如果没有网站，可在自己的 GitHub 账号下使用附带的 GitHub Pages 流程：

1. 在 Windows 上解压“iOS工程.zip”，在自己的 GitHub 账号下创建仓库。
2. 把解压后的工程内容上传到仓库根目录。根目录必须直接包含 `Web`、`PokemonLedger.xcodeproj` 和 `.github/workflows`，不要把 ZIP 当成一个文件上传，也不要额外包一层目录。上传时请保留 `.github` 文件夹。
3. 在仓库 **Settings → Pages → Build and deployment → Source** 中选择 **GitHub Actions**。仓库与账号需要具备使用 Pages 的权限。
4. 在仓库 **Actions** 中选择 **Publish iPhone home screen web app**，点击 **Run workflow**。成功后，流程的部署环境中会显示你自己的 HTTPS 网址。此步骤会公开发布应用静态页面。
5. 在 iPhone **Safari** 中打开该网址，首次保持联网，等待应用和离线资源加载完成。
6. 点 Safari 的 **分享** 按钮，选择 **添加到主屏幕**，确认添加。之后从桌面图标进入账本。
7. 点击“说一句，记一笔”。如果 Safari 不能直接识音，可点击文本框，使用键盘上的听写麦克风，说完后点击“整理成账单”。

这个版本支持离线记账和 CSV / JSON 导出。语音是否可离线工作由 Safari / iOS 决定；网页自身不包含离线语音模型。账单保存在该设备、该网址的本地存储中，卸载主屏幕应用或清除浏览器数据前请先导出。

## 路线二：云端构建原生 iOS 版本

无需拥有 Mac，但仍然需要 Apple 签名才能安装：

1. 将完整 iOS 工程上传到自己的 GitHub 仓库，保留 `.github/workflows/ios-build.yml`。
2. 打开 **Actions → Build iOS project and unsigned IPA → Run workflow**。
3. 等待 macOS 云端编译完成。若失败，查看日志；这个工程尚未在 Apple 构建环境验证。
4. 成功后在该次运行的 **Artifacts** 中下载 **PokemonLedger-unsigned-IPA**。
5. 使用你自己的 Apple ID / 证书与相应签名安装工具完成签名和安装。

未签名的 IPA 无法直接在 iPhone 安装；当前交付也没有 TestFlight 或 App Store 下载链接。

## 如果以后有 Mac

打开 `PokemonLedger.xcodeproj`，在 **Signing & Capabilities** 中选择自己的开发团队，必要时更改 Bundle Identifier 为自己的唯一标识，连接 iPhone 后运行。iPhone 需要 iOS 16 或以上。发布可更新的版本需要持续使用相同的应用标识与签名配置。
