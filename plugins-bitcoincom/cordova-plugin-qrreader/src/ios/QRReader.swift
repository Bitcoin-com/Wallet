//
//  QRReader.swift
//  Bitcoin.com
//
//  Copyright © 2019 Jean-Baptiste Dominguez
//  Copyright © 2019 Bitcoin Cash Supporters developers
//

// Migration Native to Cordova
// In progress

import UIKit
import AVKit


@objc(QRReader)
class QRReader: CDVPlugin, AVCaptureMetadataOutputObjectsDelegate {
        
    fileprivate var readingCommand: CDVInvokedUrlCommand?
    fileprivate var captureSession: AVCaptureSession!
    fileprivate var previewLayer: AVCaptureVideoPreviewLayer!
    fileprivate var cameraView: UIView!

    enum QRReaderError {
      case NO_PERMISSION
      case SCANNING_UNSUPPORTED
    }
    
    override var supportedInterfaceOrientations: UIInterfaceOrientationMask {
        return .portrait
    }

    override func pluginInitialize() {
        super.pluginInitialize()
        cameraView = CameraView(frame: CGRect(x: 0, y: 0, width: UIScreen.main.bounds.width, height: UIScreen.main.bounds.height))
        cameraView.autoresizingMask = [.flexibleWidth, .flexibleHeight];
    }

    func startReading(_ command: CDVInvokedUrlCommand){
        
        // Keep the callback
        readingCommand = command
        
        // If it is already initialized or webview missing, return
        guard let _ = self.previewLayer
            , let webView = self.webView
            , let superView = webView.superview else {
            return
        }
        
        backgroundColor = UIColor.black
        captureSession = AVCaptureSession()
        
        guard let videoCaptureDevice = AVCaptureDevice.default(for: .video) else {
            // TODO: Handle the case without permission "Permission"
            failed(QRReaderError.NO_PERMISSION)
            return
        }
        
        let videoInput: AVCaptureDeviceInput
        
        do {
            videoInput = try AVCaptureDeviceInput(device: videoCaptureDevice)
        } catch {
            // TODO: Handle this case "Retry"
            return
        }
        
        guard captureSession.canAddInput(videoInput) else {
            failed(QRReaderError.SCANNING_UNSUPPORTED)
            return
        }
        captureSession.addInput(videoInput)

        let metadataOutput = AVCaptureMetadataOutput()
        
        guard captureSession.canAddOutput(metadataOutput) else {
            failed(QRReaderError.SCANNING_UNSUPPORTED)
            return
        }
        captureSession.addOutput(metadataOutput)

        metadataOutput.setMetadataObjectsDelegate(self, queue: DispatchQueue.main)
        metadataOutput.metadataObjectTypes = [.qr]
        
        previewLayer = AVCaptureVideoPreviewLayer(session: captureSession)
        previewLayer.frame = self.layer.bounds
        previewLayer.videoGravity = .resizeAspectFill

        cameraView.addSublayer(previewLayer)
        superView.insertSubview(cameraView, belowSubview: webView)
        
        captureSession.startRunning()
    }

    func stopReading(_ command: CDVInvokedUrlCommand){
        captureSession.stopRunning()
    }
    
    func failed(error: QRReaderError) {
        print("Scanning unsupported")
        guard let readingCommand = self.readingCommand
            , let callbackId = readingCommand.callbackId
            , let commandDelegate = self.commandDelegate else {
            return
        }

        let pluginResult = CDVPluginResult(status: CDVCommandStatus_ERROR, messageAs: error.rawValue)
        commandDelegate.send(pluginResult, callbackId:callbackId)
    }
    
    func metadataOutput(_ output: AVCaptureMetadataOutput, didOutput metadataObjects: [AVMetadataObject], from connection: AVCaptureConnection) {
        captureSession.stopRunning()
        
        if let metadataObject = metadataObjects.first {
            guard let readableObject = metadataObject as? AVMetadataMachineReadableCodeObject else { return }
            guard let result = readableObject.stringValue
                , let readingCommand = self.readingCommand
                , let callbackId = readingCommand.callbackId
                , let commandDelegate = self.commandDelegate else {
                    return
            }
            
            // Vigration to test
            AudioServicesPlaySystemSound(SystemSoundID(kSystemSoundID_Vibrate))
            
            // Callback
            let pluginResult = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: result.stringValue)
            commandDelegate.send(pluginResult, callbackId: callbackId)
            readingCommand = nil
        }
    }
}
