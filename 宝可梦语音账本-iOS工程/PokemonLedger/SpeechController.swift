import AVFoundation
import Speech
import UIKit

final class SpeechController {
    var onEvent: (([String: Any]) -> Void)?
    private var engine: AVAudioEngine?
    private var request: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private var speechRecognizer: SFSpeechRecognizer?
    private var sessionID: UUID?
    private var latestText = ""
    private var hasTap = false
    private var limitTimer: DispatchWorkItem?
    private var finishTimer: DispatchWorkItem?

    func start(preferOffline: Bool) {
        guard sessionID == nil else { return }
        let id = UUID()
        sessionID = id
        latestText = ""
        SFSpeechRecognizer.requestAuthorization { [weak self] status in
            DispatchQueue.main.async {
                guard let self = self, self.sessionID == id else { return }
                guard status == .authorized else {
                    self.fail("请在 iPhone 设置中允许本应用使用语音识别，也可以使用键盘听写。")
                    return
                }
                AVAudioSession.sharedInstance().requestRecordPermission { [weak self] allowed in
                    DispatchQueue.main.async {
                        guard let self = self, self.sessionID == id else { return }
                        guard allowed else {
                            self.fail("麦克风权限未开启，可在 iPhone 设置中开启，或使用键盘输入。")
                            return
                        }
                        self.beginAudio(id: id, preferOffline: preferOffline)
                    }
                }
            }
        }
    }

    private func beginAudio(id: UUID, preferOffline: Bool) {
        guard let recognizer = SFSpeechRecognizer(locale: Locale(identifier: "zh-CN")), recognizer.isAvailable else {
            fail("iOS 中文语音识别当前不可用，请稍后重试或使用键盘听写。")
            return
        }
        if preferOffline && !recognizer.supportsOnDeviceRecognition {
            fail("当前设备尚不支持离线中文识别，请关闭“离线优先”后重试，或使用键盘听写。")
            return
        }
        do {
            speechRecognizer = recognizer
            let audioSession = AVAudioSession.sharedInstance()
            try audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
            try audioSession.setActive(true)
            let audioEngine = AVAudioEngine()
            engine = audioEngine
            let recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
            recognitionRequest.shouldReportPartialResults = true
            recognitionRequest.requiresOnDeviceRecognition = preferOffline
            recognitionRequest.taskHint = .dictation
            request = recognitionRequest
            let input = audioEngine.inputNode
            let format = input.outputFormat(forBus: 0)
            guard format.sampleRate > 0, format.channelCount > 0 else {
                fail("没有可用的麦克风，请在真实 iPhone 上重试。")
                return
            }
            recognitionTask = recognizer.recognitionTask(with: recognitionRequest) { [weak self] result, error in
                DispatchQueue.main.async {
                    guard let self = self, self.sessionID == id else { return }
                    if let result = result {
                        self.latestText = result.bestTranscription.formattedString
                        if result.isFinal {
                            self.complete()
                            return
                        }
                        self.onEvent?(["status": "partial", "text": self.latestText, "message": "正在聆听，点击按钮可结束并整理。"])
                    }
                    if error != nil {
                        if !self.latestText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty { self.complete() }
                        else { self.fail("没有识别成功，请检查网络或离线语音设置，也可以使用键盘听写。") }
                    }
                }
            }
            input.installTap(onBus: 0, bufferSize: 1024, format: format) { buffer, _ in recognitionRequest.append(buffer) }
            hasTap = true
            audioEngine.prepare()
            try audioEngine.start()
            onEvent?(["status": "listening", "message": "正在聆听，请说出用途、金额和时间…"])
            let timer = DispatchWorkItem { [weak self] in self?.finish() }
            limitTimer = timer
            DispatchQueue.main.asyncAfter(deadline: .now() + 30, execute: timer)
        } catch {
            fail("无法启动麦克风，请关闭其他录音应用后再试。")
        }
    }

    func finish() {
        guard sessionID != nil else { return }
        guard request != nil else { cancel(); return }
        limitTimer?.cancel()
        stopAudio()
        request?.endAudio()
        onEvent?(["status": "processing", "message": "正在整理语音，请稍候…"])
        finishTimer?.cancel()
        let id = sessionID
        let timer = DispatchWorkItem { [weak self] in
            guard let self = self, self.sessionID == id else { return }
            self.complete()
        }
        finishTimer = timer
        DispatchQueue.main.asyncAfter(deadline: .now() + 5, execute: timer)
    }

    func cancel(notify: Bool = true) {
        let wasActive = sessionID != nil
        cleanUp()
        if notify && wasActive { onEvent?(["status": "cancelled"]) }
    }

    private func complete() {
        let text = latestText.trimmingCharacters(in: .whitespacesAndNewlines)
        cleanUp()
        if text.isEmpty { onEvent?(["status": "error", "message": "没有听清，请再试一次或直接输入。"]) }
        else { onEvent?(["status": "ok", "text": text]) }
    }

    private func fail(_ message: String) {
        cleanUp()
        onEvent?(["status": "error", "message": message])
    }

    private func stopAudio() {
        engine?.stop()
        if hasTap { engine?.inputNode.removeTap(onBus: 0); hasTap = false }
    }

    private func cleanUp() {
        sessionID = nil
        limitTimer?.cancel(); limitTimer = nil
        finishTimer?.cancel(); finishTimer = nil
        stopAudio()
        request?.endAudio()
        recognitionTask?.cancel(); recognitionTask = nil
        request = nil; engine = nil; speechRecognizer = nil
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    }
}
