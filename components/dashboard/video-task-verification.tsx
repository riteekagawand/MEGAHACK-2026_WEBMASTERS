"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Camera,
    Upload,
    CheckCircle,
    XCircle,
    Loader2,
    Play,
    Square,
    RotateCcw,
    Award,
    AlertCircle
} from "lucide-react";

interface Task {
    id: string;
    title: string;
    description: string;
    category: string;
    coins: number;
    difficulty: string;
}

interface VideoTaskVerificationProps {
    task: Task;
    isOpen: boolean;
    onClose: () => void;
    onTaskCompleted: (result: any) => void;
}

export default function VideoTaskVerification({
    task,
    isOpen,
    onClose,
    onTaskCompleted,
}: VideoTaskVerificationProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [recordedVideo, setRecordedVideo] = useState<Blob | null>(null);
    const [videoUrl, setVideoUrl] = useState<string>("");
    const [isUploading, setIsUploading] = useState(false);
    const [verification, setVerification] = useState<any>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [recordingTime, setRecordingTime] = useState(0);

    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 },
                audio: false,
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            streamRef.current = stream;
        } catch (error) {
            console.error("Error accessing camera:", error);
            alert("Could not access camera. Please check permissions.");
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    const startRecording = () => {
        if (!streamRef.current) return;

        const mediaRecorder = new MediaRecorder(streamRef.current);
        const chunks: BlobPart[] = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                chunks.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            const videoBlob = new Blob(chunks, { type: "video/webm" });
            setRecordedVideo(videoBlob);
            setVideoUrl(URL.createObjectURL(videoBlob));
            stopCamera();
        };

        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start();
        setIsRecording(true);
        setRecordingTime(0);

        // Start timer
        timerRef.current = setInterval(() => {
            setRecordingTime(prev => prev + 1);
        }, 1000);
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);

            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    };

    const resetRecording = () => {
        setRecordedVideo(null);
        setVideoUrl("");
        setVerification(null);
        setRecordingTime(0);

        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Check file size (50MB limit)
            if (file.size > 50 * 1024 * 1024) {
                alert("File size exceeds 50MB limit. Please choose a smaller file.");
                return;
            }

            // Check file type
            const allowedTypes = ["video/mp4", "video/mpeg", "video/mov", "video/avi", "video/webm"];
            if (!allowedTypes.includes(file.type)) {
                alert("Unsupported video format. Please use MP4, MOV, AVI, or WebM.");
                return;
            }

            setRecordedVideo(file);
            setVideoUrl(URL.createObjectURL(file));
        }
    };

    const submitForVerification = async () => {
        if (!recordedVideo) return;

        setIsUploading(true);
        setUploadProgress(0);

        try {
            const formData = new FormData();
            formData.append("taskId", task.id);
            formData.append("video", recordedVideo);

            const response = await fetch("/api/dashboard/verify-task", {
                method: "POST",
                body: formData,
            });

            setUploadProgress(100);

            if (response.ok) {
                const result = await response.json();
                setVerification(result);

                if (result.taskCompleted) {
                    onTaskCompleted(result);
                }
            } else {
                const error = await response.json();
                alert(`Verification failed: ${error.error}`);
            }
        } catch (error) {
            console.error("Error uploading video:", error);
            alert("Failed to upload video. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const getTaskInstructions = () => {
        switch (task.category) {
            case "fitness":
                return "Record yourself performing the exercise with proper form. Ensure the camera can see your full body movement.";
            case "wellness":
                return "Record yourself during the wellness activity. Make sure you're in a quiet, comfortable environment.";
            default:
                return "Record yourself completing the task as described.";
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl border-2 border-[#151616] bg-white shadow-[4px_4px_0px_0px_#151616] rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-instrument-serif font-bold text-[#151616] flex items-center gap-2">
                        <Camera className="h-6 w-6" />
                        Verify Task Completion
                    </DialogTitle>
                    <DialogDescription className="text-[#151616]/70 font-poppins">
                        Record a video to verify you completed: <strong>{task.title}</strong>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Task Info */}
                    <Card className="border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616]">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-poppins font-bold text-[#151616]">
                                    {task.title}
                                </CardTitle>
                                <Badge className="bg-[#D6F32F] text-[#151616] border-[#151616]">
                                    {task.coins} coins + bonus
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-[#151616]/70 font-poppins mb-3">{task.description}</p>
                            <p className="text-sm text-[#151616]/60 font-poppins italic">
                                {getTaskInstructions()}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Video Recording/Upload Section */}
                    {!verification && (
                        <div className="space-y-4">
                            {videoUrl ? (
                                // Video Preview
                                <div className="space-y-4">
                                    <video
                                        src={videoUrl}
                                        controls
                                        className="w-full h-64 rounded-xl border-2 border-[#151616] object-cover"
                                    />
                                    <div className="flex gap-3 justify-center">
                                        <Button
                                            onClick={resetRecording}
                                            variant="outline"
                                            className="border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616] hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_#151616] transition-all"
                                        >
                                            <RotateCcw className="w-4 h-4 mr-2" />
                                            Record Again
                                        </Button>
                                        <Button
                                            onClick={submitForVerification}
                                            disabled={isUploading}
                                            className="bg-[#D6F32F] hover:bg-[#D6F32F]/80 text-[#151616] font-poppins font-bold border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616] hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_#151616] transition-all"
                                        >
                                            {isUploading ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Verifying...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                    Verify Task
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                // Recording Interface
                                <div className="space-y-4">
                                    <div className="relative">
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            muted
                                            playsInline
                                            className="w-full h-64 rounded-xl border-2 border-[#151616] object-cover bg-gray-100"
                                        />
                                        {isRecording && (
                                            <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full font-poppins font-bold">
                                                REC {formatTime(recordingTime)}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-3 justify-center">
                                        {!streamRef.current ? (
                                            <Button
                                                onClick={startCamera}
                                                className="bg-[#D6F32F] hover:bg-[#D6F32F]/80 text-[#151616] font-poppins font-bold border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616] hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_#151616] transition-all"
                                            >
                                                <Camera className="w-4 h-4 mr-2" />
                                                Start Camera
                                            </Button>
                                        ) : !isRecording ? (
                                            <Button
                                                onClick={startRecording}
                                                className="bg-red-500 hover:bg-red-600 text-white font-poppins font-bold border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616] hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_#151616] transition-all"
                                            >
                                                <Play className="w-4 h-4 mr-2" />
                                                Start Recording
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={stopRecording}
                                                className="bg-gray-600 hover:bg-gray-700 text-white font-poppins font-bold border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616] hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_#151616] transition-all"
                                            >
                                                <Square className="w-4 h-4 mr-2" />
                                                Stop Recording
                                            </Button>
                                        )}
                                    </div>

                                    <div className="text-center">
                                        <p className="text-[#151616]/60 font-poppins text-sm mb-2">Or upload a video file</p>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="video/*"
                                            onChange={handleFileUpload}
                                            className="hidden"
                                        />
                                        <Button
                                            onClick={() => fileInputRef.current?.click()}
                                            variant="outline"
                                            className="border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616] hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_#151616] transition-all"
                                        >
                                            <Upload className="w-4 h-4 mr-2" />
                                            Upload Video
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {isUploading && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm text-[#151616]/70 font-poppins">
                                        <span>Uploading and analyzing...</span>
                                        <span>{uploadProgress}%</span>
                                    </div>
                                    <Progress value={uploadProgress} className="h-2" />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Verification Results */}
                    {verification && (
                        <Card className={`border-2 ${verification.taskCompleted ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 font-poppins font-bold">
                                    {verification.taskCompleted ? (
                                        <>
                                            <CheckCircle className="h-6 w-6 text-green-600" />
                                            <span className="text-green-800">Task Completed Successfully!</span>
                                        </>
                                    ) : (
                                        <>
                                            <XCircle className="h-6 w-6 text-red-600" />
                                            <span className="text-red-800">Task Not Completed</span>
                                        </>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {verification.taskCompleted && verification.transaction && (
                                    <div className="flex items-center gap-2 p-3 bg-[#D6F32F]/20 rounded-xl border border-[#151616]/20">
                                        <Award className="h-5 w-5 text-[#151616]" />
                                        <span className="font-poppins font-bold text-[#151616]">
                                            +{verification.transaction.coinsEarned} coins earned!
                                        </span>
                                        {verification.transaction.bonusCoins > 0 && (
                                            <Badge className="bg-[#D6F32F] text-[#151616] border-[#151616]">
                                                +{verification.transaction.bonusCoins} bonus
                                            </Badge>
                                        )}
                                    </div>
                                )}

                                {verification.verification && (
                                    <div className="space-y-3">
                                        {verification.verification.qualityScore && (
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-sm font-poppins">
                                                    <span>Quality Score</span>
                                                    <span>{verification.verification.qualityScore}/100</span>
                                                </div>
                                                <Progress value={verification.verification.qualityScore} className="h-2" />
                                            </div>
                                        )}

                                        {verification.verification.detectedCount !== undefined && (
                                            <div className="text-sm font-poppins">
                                                <span className="text-[#151616]/70">Detected: </span>
                                                <span className="font-bold">{verification.verification.detectedCount}</span>
                                                <span className="text-[#151616]/70"> / {verification.verification.requiredCount} required</span>
                                            </div>
                                        )}

                                        <div className="text-sm font-poppins">
                                            <p className="text-[#151616]/70 mb-1">AI Feedback:</p>
                                            <p className="text-[#151616]">{verification.verification.feedback}</p>
                                        </div>

                                        {verification.verification.failureReason && (
                                            <div className="flex items-start gap-2 p-3 bg-red-100 rounded-xl border border-red-200">
                                                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                                <div className="text-sm font-poppins">
                                                    <p className="text-red-800 font-bold mb-1">Why it failed:</p>
                                                    <p className="text-red-700">{verification.verification.failureReason}</p>
                                                </div>
                                            </div>
                                        )}

                                        {verification.verification.suggestions && (
                                            <div className="text-sm font-poppins">
                                                <p className="text-[#151616]/70 mb-1">Suggestions for improvement:</p>
                                                <p className="text-[#151616]">{verification.verification.suggestions}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex justify-end gap-3">
                                    {!verification.taskCompleted && (
                                        <Button
                                            onClick={resetRecording}
                                            className="bg-[#D6F32F] hover:bg-[#D6F32F]/80 text-[#151616] font-poppins font-bold border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616] hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_#151616] transition-all"
                                        >
                                            Try Again
                                        </Button>
                                    )}
                                    <Button
                                        onClick={onClose}
                                        variant="outline"
                                        className="border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616] hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_#151616] transition-all"
                                    >
                                        {verification.taskCompleted ? "Great!" : "Close"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
