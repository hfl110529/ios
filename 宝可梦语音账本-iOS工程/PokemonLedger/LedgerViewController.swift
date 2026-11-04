import UIKit
import WebKit

@MainActor private final class WeakMessageHandler: NSObject, WKScriptMessageHandler, WKScriptMessageHandlerWithReply {
    weak var owner: LedgerViewController?
    init(owner: LedgerViewController) { self.owner = owner }
    func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) { owner?.userContentController(controller, didReceive: message) }
    func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage, replyHandler: @escaping (Any?, String?) -> Void) {
        if let owner = owner { owner.userContentController(controller, didReceive: message, replyHandler: replyHandler) }
        else { replyHandler(nil, "应用已关闭，未写入数据。") }
    }
}

final class LedgerViewController: UIViewController, WKScriptMessageHandler, WKScriptMessageHandlerWithReply, WKNavigationDelegate, UIDocumentPickerDelegate {
    private var webView: WKWebView!
    private var webRoot: URL!
    private let speech = SpeechController()
    private let storageQueue = DispatchQueue(label: "cn.local.pokemonledger.storage")
    private var exportURL: URL?
    private var backgroundObserver: NSObjectProtocol?
    private var ledgerURL: URL {
        get throws {
            let root = try FileManager.default.url(for: .applicationSupportDirectory, in: .userDomainMask, appropriateFor: nil, create: true)
            let directory = root.appendingPathComponent("PokemonLedger", isDirectory: true)
            try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
            return directory.appendingPathComponent("ledger.json")
        }
    }

    override var preferredStatusBarStyle: UIStatusBarStyle { .darkContent }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 250/255, green: 248/255, blue: 242/255, alpha: 1)
        guard let indexURL = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "Web"),
              let bridgeURL = Bundle.main.url(forResource: "bridge", withExtension: "js"),
              let bridge = try? String(contentsOf: bridgeURL, encoding: .utf8) else {
            showLoadError("应用资源不完整，请重新安装。")
            return
        }
        webRoot = indexURL.deletingLastPathComponent()
        var initialData = "", readError = ""
        do {
            let url = try ledgerURL
            if FileManager.default.fileExists(atPath: url.path) { initialData = try String(contentsOf: url, encoding: .utf8) }
        } catch { readError = "无法读取本机账本，已停止写入以保护原有数据。" }
        let bootstrap: [String: String] = ["data": initialData, "readError": readError]
        guard let encoded = try? JSONSerialization.data(withJSONObject: bootstrap), let json = String(data: encoded, encoding: .utf8) else { return }
        let content = WKUserContentController()
        let handler = WeakMessageHandler(owner: self)
        content.add(handler, name: "ledgerActions")
        content.addScriptMessageHandler(handler, contentWorld: .page, name: "ledgerSave")
        content.addUserScript(WKUserScript(source: bridge.replacingOccurrences(of: "__LEDGER_BOOTSTRAP__", with: json), injectionTime: .atDocumentStart, forMainFrameOnly: true))
        let configuration = WKWebViewConfiguration()
        configuration.userContentController = content
        configuration.websiteDataStore = .default()
        webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = self
        webView.isOpaque = false
        webView.backgroundColor = view.backgroundColor
        webView.scrollView.backgroundColor = view.backgroundColor
        webView.scrollView.bounces = false
        webView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(webView)
        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            webView.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor),
            webView.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor)
        ])
        speech.onEvent = { [weak self] result in self?.sendEvent("speech", payload: result) }
        backgroundObserver = NotificationCenter.default.addObserver(forName: UIApplication.didEnterBackgroundNotification, object: nil, queue: .main) { [weak self] _ in self?.speech.cancel() }
        webView.loadFileURL(indexURL, allowingReadAccessTo: webRoot)
    }

    private func showLoadError(_ message: String) {
        let label = UILabel(frame: view.bounds.insetBy(dx: 28, dy: 80))
        label.text = message; label.numberOfLines = 0; label.textAlignment = .center
        label.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(label)
    }

    private func isTrusted(_ message: WKScriptMessage) -> Bool {
        guard message.frameInfo.isMainFrame, let url = message.frameInfo.request.url, url.isFileURL, let root = webRoot else { return false }
        return url.standardizedFileURL.path.hasPrefix(root.standardizedFileURL.path + "/")
    }

    // WebKit returns a Promise so the interface waits for the atomic disk write.
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage, replyHandler: @escaping (Any?, String?) -> Void) {
        guard isTrusted(message), message.name == "ledgerSave", let text = message.body as? String,
              let data = text.data(using: .utf8), data.count <= 32 * 1024 * 1024,
              let object = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any],
              object["version"] as? Int == 1, let records = object["records"] as? [[String: Any]], records.count <= 50000 else {
            replyHandler(nil, "账单数据无效，未覆盖原账本。")
            return
        }
        let destination: URL
        do { destination = try ledgerURL }
        catch { replyHandler(nil, "无法打开本机账本，未覆盖原数据。"); return }
        storageQueue.async {
            do {
                var url = destination
                try data.write(to: url, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
                var values = URLResourceValues(); values.isExcludedFromBackup = true
                try? url.setResourceValues(values)
                DispatchQueue.main.async { replyHandler(true, nil) }
            } catch { DispatchQueue.main.async { replyHandler(nil, "保存失败，请检查 iPhone 可用存储空间。") } }
        }
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard isTrusted(message), message.name == "ledgerActions", let body = message.body as? [String: Any], let method = body["method"] as? String else { return }
        switch method {
        case "startSpeech": speech.start(preferOffline: body["preferOffline"] as? Bool ?? false)
        case "finishSpeech": speech.finish()
        case "cancelSpeech": speech.cancel()
        case "export": exportFile(body)
        default: break
        }
    }

    private func sendEvent(_ name: String, payload: [String: Any]) {
        guard ["speech", "exportResult"].contains(name), let data = try? JSONSerialization.data(withJSONObject: payload), let json = String(data: data, encoding: .utf8) else { return }
        webView?.evaluateJavaScript("window.NativeEvents && window.NativeEvents.\(name)(\(json))", completionHandler: nil)
    }

    private func exportFile(_ body: [String: Any]) {
        guard exportURL == nil else { sendEvent("exportResult", payload: ["ok": false, "message": "已有文件等待保存，请先完成或取消。"]); return }
        guard let content = body["content"] as? String, let data = content.data(using: .utf8), data.count <= 32 * 1024 * 1024,
              let name = body["name"] as? String, name.count < 180,
              !name.contains("/"), !name.contains("\\"), !name.hasPrefix("."), name.hasSuffix(".csv") || name.hasSuffix(".json") else {
            sendEvent("exportResult", payload: ["ok": false, "message": "无法导出，请缩小日期范围后重试。"])
            return
        }
        do {
            let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString, isDirectory: true)
            try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
            let url = directory.appendingPathComponent(name)
            try data.write(to: url, options: .atomic)
            exportURL = url
            let picker = UIDocumentPickerViewController(forExporting: [url], asCopy: true)
            picker.delegate = self
            picker.shouldShowFileExtensions = true
            present(picker, animated: true)
        } catch { cleanExport(); sendEvent("exportResult", payload: ["ok": false, "message": "创建导出文件失败，请检查可用存储空间。"]) }
    }

    private func cleanExport() {
        if let url = exportURL { try? FileManager.default.removeItem(at: url.deletingLastPathComponent()) }
        exportURL = nil
    }

    func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
        cleanExport()
        sendEvent("exportResult", payload: ["ok": !urls.isEmpty, "cancelled": urls.isEmpty])
    }

    func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) {
        cleanExport()
        sendEvent("exportResult", payload: ["ok": false, "cancelled": true])
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url else { decisionHandler(.cancel); return }
        let allowed = url.isFileURL && url.standardizedFileURL.path.hasPrefix(webRoot.standardizedFileURL.path + "/")
        decisionHandler(allowed || url.absoluteString == "about:blank" ? .allow : .cancel)
    }

    deinit {
        if let observer = backgroundObserver { NotificationCenter.default.removeObserver(observer) }
        speech.cancel(notify: false)
        webView?.configuration.userContentController.removeScriptMessageHandler(forName: "ledgerActions")
        webView?.configuration.userContentController.removeScriptMessageHandler(forName: "ledgerSave")
        cleanExport()
    }
}
