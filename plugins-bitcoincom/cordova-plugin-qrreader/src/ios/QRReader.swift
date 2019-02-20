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

class QRReader: CDVPlugin, AVCaptureMetadataOutputObjectsDelegate {
    
    fileprivate var captureSession: AVCaptureSession!
    fileprivate var previewLayer: AVCaptureVideoPreviewLayer!
    
    fileprivate var readingCommand: CDVInvokedUrlCommand?
    
    override var supportedInterfaceOrientations: UIInterfaceOrientationMask {
        return .portrait
    }

    override func pluginInitialize() {
        super.pluginInitialize()
    }
    
    func startReading(_ command: CDVInvokedUrlCommand){
        
        // Keep the callback
        readingCommand = command
        
        // If it is already initialized, return
        guard let _ = self.previewLayer else {
            return
        }
        
        backgroundColor = UIColor.black
        captureSession = AVCaptureSession()
        
        guard let videoCaptureDevice = AVCaptureDevice.default(for: .video) else {
            // TODO: Handle the case without permission "Permission"
            return
        }
        
        let videoInput: AVCaptureDeviceInput
        
        do {
            videoInput = try AVCaptureDeviceInput(device: videoCaptureDevice)
        } catch {
            // TODO: Handle this case "Retry"
            return
        }
        
        if (captureSession.canAddInput(videoInput)) {
            captureSession.addInput(videoInput)
        } else {
            failed()
            return
        }
        
        let metadataOutput = AVCaptureMetadataOutput()
        
        if (captureSession.canAddOutput(metadataOutput)) {
            captureSession.addOutput(metadataOutput)
            
            metadataOutput.setMetadataObjectsDelegate(self, queue: DispatchQueue.main)
            metadataOutput.metadataObjectTypes = [.qr]
        } else {
            failed()
            return
        }
        
        previewLayer = AVCaptureVideoPreviewLayer(session: captureSession)
        previewLayer.frame = self.layer.bounds
        previewLayer.videoGravity = .resizeAspectFill
        self.layer.addSublayer(previewLayer)
        
        captureSession.startRunning()
    }

    func stopReading(_ command: CDVInvokedUrlCommand){
        captureSession.stopRunning()
    }
    
    func failed() {
        print("Scanning unsupported")
        captureSession = nil
    }
    
    // override func viewWillAppear(_ animated: Bool) {
    //     super.viewWillAppear(animated)
    
    //     if (captureSession?.isRunning == false) {
    //         captureSession.startRunning()
    //     }
    // }
    
    // override func viewWillDisappear(_ animated: Bool) {
    //     super.viewWillDisappear(animated)
    
    //     if (captureSession?.isRunning == true) {
    //         captureSession.stopRunning()
    //     }
    // }
    
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
