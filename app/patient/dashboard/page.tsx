"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useSession } from "next-auth/react";
import {
    Trophy,
    Coins,
    Target,
    CheckCircle,
    Clock,
    Flame,
    Star,
    Award,
    TrendingUp,
    Users,
    Calendar,
    Plus,
    Zap,
    Heart,
    Activity,
    Stethoscope,
    UserCheck,
    CreditCard,
} from "lucide-react";
import { PaymentHistory } from "@/components/patient/payment-history";
import { AppointmentHistory } from "@/components/patient/appointment-history";
import VideoTaskVerification from "@/components/dashboard/video-task-verification";

interface Task {
    id: string;
    title: string;
    description: string;
    category: "fitness" | "nutrition" | "wellness" | "medical";
    coins: number;
    difficulty: "easy" | "medium" | "hard";
    completed: boolean;
    streak: number;
    icon: React.ComponentType<any>;
}

interface User {
    id: string;
    name: string;
    coins: number;
    level: number;
    streak: number;
    completedTasks: number;
    avatar: string;
}

export default function PatientDashboard() {
    const { data: session } = useSession();
    const [userCoins, setUserCoins] = useState(0);
    const [userLevel, setUserLevel] = useState(1);
    const [userStreak, setUserStreak] = useState(0);
    const [userCompletedTasks, setUserCompletedTasks] = useState(0);
    const [userTotalEarned, setUserTotalEarned] = useState(0);
    const [userBestStreak, setUserBestStreak] = useState(0);
    const [showCoinAnimation, setShowCoinAnimation] = useState(false);
    const [earnedCoins, setEarnedCoins] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [showVideoVerification, setShowVideoVerification] = useState(false);

    // Function to render avatar icons with thematic colors
    const renderAvatarIcon = (iconName: string) => {
        switch (iconName) {
            case "Trophy":
                return <Trophy className="w-6 h-6 text-yellow-600" />; // Gold for winner
            case "Stethoscope":
                return <Stethoscope className="w-6 h-6 text-blue-600" />; // Blue for medical
            case "UserCheck":
                return <UserCheck className="w-6 h-6 text-green-600" />; // Green for verified
            case "Zap":
                return <Zap className="w-6 h-6 text-orange-500" />; // Orange for energy
            case "Heart":
                return <Heart className="w-6 h-6 text-red-500" />; // Red for health/heart
            default:
                return <Users className="w-6 h-6 text-gray-600" />; // Gray for default
        }
    };

    const [dailyTasks, setDailyTasks] = useState<Task[]>([]);
    const [leaderboard, setLeaderboard] = useState<User[]>([]);

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            if (!session?.user?.email) return;

            try {
                // Load user data and coins
                const userResponse = await fetch('/api/dashboard/coins');
                if (userResponse.ok) {
                    const userData = await userResponse.json();
                    if (userData.success) {
                        setUserCoins(userData.userData.coins);
                        setUserLevel(userData.userData.level);
                        setUserStreak(userData.userData.streak);
                        setUserCompletedTasks(userData.userData.completedTasks);
                        setUserTotalEarned(userData.userData.totalEarned);
                        setUserBestStreak(userData.userData.bestStreak);
                    }
                }

                // Load daily tasks
                const tasksResponse = await fetch('/api/dashboard/daily-tasks');
                if (tasksResponse.ok) {
                    const tasksData = await tasksResponse.json();
                    if (tasksData.success) {
                        const tasksWithIcons = tasksData.tasks.map((task: any) => ({
                            ...task,
                            icon: getIconComponent(task.icon)
                        }));
                        setDailyTasks(tasksWithIcons);
                    }
                }

                // Load leaderboard
                const leaderboardResponse = await fetch('/api/dashboard/leaderboard');
                if (leaderboardResponse.ok) {
                    const leaderboardData = await leaderboardResponse.json();
                    if (leaderboardData.success) {
                        setLeaderboard(leaderboardData.leaderboard);
                    }
                }
            } catch (error) {
                console.error('Error loading dashboard data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [session]);

    // Function to map icon strings to components
    const getIconComponent = (iconName: string) => {
        switch (iconName) {
            case 'Activity': return Activity;
            case 'Heart': return Heart;
            case 'Star': return Star;
            case 'Plus': return Plus;
            case 'TrendingUp': return TrendingUp;
            default: return Activity;
        }
    };

    const handleTaskComplete = (task: Task) => {
        // Check if task requires video verification
        if (task.category === 'fitness' || task.category === 'wellness') {
            setSelectedTask(task);
            setShowVideoVerification(true);
        } else {
            // Complete task directly for medical/nutrition tasks
            completeTaskDirectly(task.id);
        }
    };

    const completeTaskDirectly = async (taskId: string) => {
        const task = dailyTasks.find(t => t.id === taskId);
        if (!task || task.completed) return;

        try {
            const response = await fetch('/api/dashboard/daily-tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    taskId: task.id,
                }),
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    updateTaskCompletion(taskId, result);
                }
            }
        } catch (error) {
            console.error('Error completing task:', error);
        }
    };

    const onVideoTaskCompleted = (result: any) => {
        if (selectedTask && result.taskCompleted) {
            updateTaskCompletion(selectedTask.id, result);
        }
        setShowVideoVerification(false);
        setSelectedTask(null);
    };

    const updateTaskCompletion = async (taskId: string, result: any) => {
        // Update local state
        setEarnedCoins(result.transaction.coinsEarned);
        setUserCoins(result.userData.coins);
        setUserLevel(result.userData.level);
        setUserStreak(result.userData.streak);
        setUserCompletedTasks(result.userData.completedTasks);
        setUserTotalEarned(result.userData.totalEarned);

        setDailyTasks((prev) =>
            prev.map((t) => {
                if (t.id === taskId) {
                    return { ...t, completed: true, streak: result.transaction.streak || 0 };
                }
                return t;
            })
        );

        setShowCoinAnimation(true);
        setTimeout(() => setShowCoinAnimation(false), 2000);

        // Refresh leaderboard
        try {
            const leaderboardResponse = await fetch('/api/dashboard/leaderboard');
            if (leaderboardResponse.ok) {
                const leaderboardData = await leaderboardResponse.json();
                if (leaderboardData.success) {
                    setLeaderboard(leaderboardData.leaderboard);
                }
            }
        } catch (error) {
            console.error('Error refreshing leaderboard:', error);
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case "fitness":
                return "bg-red-100 text-red-800 border-red-200";
            case "nutrition":
                return "bg-green-100 text-green-800 border-green-200";
            case "wellness":
                return "bg-blue-100 text-blue-800 border-blue-200";
            case "medical":
                return "bg-purple-100 text-purple-800 border-purple-200";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case "easy":
                return "text-green-600";
            case "medium":
                return "text-yellow-600";
            case "hard":
                return "text-red-600";
            default:
                return "text-gray-600";
        }
    };

    const completedTasksCount = dailyTasks.filter((task) => task.completed).length;
    const totalTasks = dailyTasks.length;
    const progressPercentage = (completedTasksCount / totalTasks) * 100;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#FFFFF4] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-[#151616]/30 border-t-[#151616] rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-[#151616]/70 font-poppins">Loading your health dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FFFFF4] p-6 relative">
            {/* Coins Display - Upper Right Corner */}
            <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="fixed top-20 right-6 z-50"
            >
                <div className="bg-white border-2 border-[#151616] rounded-2xl shadow-[4px_4px_0px_0px_#D6F32F] px-4 py-2 flex items-center gap-2">
                    <Coins className="w-6 h-6 text-yellow-500" />
                    <span className="font-bold text-[#151616] text-lg">{userCoins.toLocaleString()}</span>
                </div>
            </motion.div>

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                >
                    <h1 className="text-4xl font-instrument-serif font-bold text-[#151616] mb-2">
                        Health Challenge Hub
                    </h1>
                    <p className="text-[#151616]/70 font-poppins">
                        Complete daily health tasks, earn coins, and climb the leaderboard!
                    </p>
                </motion.div>

                {/* Coin Animation */}
                <AnimatePresence>
                    {showCoinAnimation && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0, y: 50 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0, y: -50 }}
                            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
                        >
                            <div className="bg-[#D6F32F] text-[#151616] px-6 py-4 rounded-2xl border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616] flex items-center gap-2">
                                <Coins className="w-6 h-6" />
                                <span className="font-bold text-xl">+{earnedCoins} Coins!</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Card className="border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616]">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-[#D6F32F] rounded-xl border-2 border-[#151616] flex items-center justify-center">
                                        <Trophy className="w-6 h-6 text-yellow-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-[#151616]/70 font-poppins">Level</p>
                                        <p className="text-2xl font-bold text-[#151616]">{userLevel}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Card className="border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616]">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-[#D6F32F] rounded-xl border-2 border-[#151616] flex items-center justify-center">
                                        <Flame className="w-6 h-6 text-orange-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-[#151616]/70 font-poppins">Streak</p>
                                        <p className="text-2xl font-bold text-[#151616]">{userStreak} days</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Card className="border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616]">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-[#D6F32F] rounded-xl border-2 border-[#151616] flex items-center justify-center">
                                        <Target className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-[#151616]/70 font-poppins">Today's Progress</p>
                                        <p className="text-2xl font-bold text-[#151616]">{completedTasksCount}/{totalTasks}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Daily Tasks */}
                    <div className="lg:col-span-2">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <Card className="border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616]">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="font-instrument-serif font-bold text-[#151616] flex items-center gap-2">
                                            <Calendar className="w-6 h-6 text-green-600" />
                                            Daily Health Tasks
                                        </CardTitle>
                                        <Badge className="bg-[#D6F32F] text-[#151616] border-[#151616]">
                                            {completedTasksCount}/{totalTasks} Complete
                                        </Badge>
                                    </div>
                                    <Progress value={progressPercentage} className="mt-2" />
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {dailyTasks.map((task, index) => {
                                        const Icon = task.icon;
                                        return (
                                            <motion.div
                                                key={task.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.6 + index * 0.1 }}
                                                className={`p-4 rounded-xl border-2 border-[#151616] transition-all duration-200 ${task.completed
                                                    ? "bg-[#D6F32F]/20 shadow-[2px_2px_0px_0px_#151616]"
                                                    : "bg-white shadow-[4px_4px_0px_0px_#151616] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_#151616]"
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-12 h-12 rounded-xl border-2 border-[#151616] flex items-center justify-center ${task.completed ? "bg-[#D6F32F]" : "bg-white"
                                                            }`}>
                                                            {task.completed ? (
                                                                <CheckCircle className="w-6 h-6 text-[#151616]" />
                                                            ) : (
                                                                <Icon className={`w-6 h-6 ${task.category === "fitness" ? "text-red-600" :
                                                                    task.category === "nutrition" ? "text-green-600" :
                                                                        task.category === "wellness" ? "text-blue-600" :
                                                                            task.category === "medical" ? "text-purple-600" :
                                                                                "text-[#151616]"
                                                                    }`} />
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <h3 className="font-poppins font-bold text-[#151616] mb-1">
                                                                {task.title}
                                                            </h3>
                                                            <p className="text-sm text-[#151616]/70 mb-2">
                                                                {task.description}
                                                            </p>
                                                            <div className="flex items-center gap-2">
                                                                <Badge className={getCategoryColor(task.category)}>
                                                                    {task.category}
                                                                </Badge>
                                                                <span className={`text-sm font-medium ${getDifficultyColor(task.difficulty)}`}>
                                                                    {task.difficulty}
                                                                </span>
                                                                {task.streak > 0 && (
                                                                    <div className="flex items-center gap-1 text-orange-600">
                                                                        <Flame className="w-4 h-4 text-orange-500" />
                                                                        <span className="text-sm font-medium">{task.streak}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="flex items-center gap-1 mb-2">
                                                            <Coins className="w-4 h-4 text-yellow-500" />
                                                            <span className="font-bold text-[#151616]">{task.coins}</span>
                                                        </div>
                                                        {!task.completed && (
                                                            <Button
                                                                onClick={() => handleTaskComplete(task)}
                                                                className="bg-[#D6F32F] text-[#151616] border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616] hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_#151616] transition-all duration-200 font-poppins font-medium"
                                                            >
                                                                {task.category === 'fitness' || task.category === 'wellness' ? 'Verify with Video' : 'Complete'}
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>

                    {/* Leaderboard */}
                    <div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                        >
                            <Card className="border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616]">
                                <CardHeader>
                                    <CardTitle className="font-instrument-serif font-bold text-[#151616] flex items-center gap-2">
                                        <Trophy className="w-6 h-6 text-yellow-600" />
                                        Leaderboard
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {leaderboard.map((user, index) => (
                                        <motion.div
                                            key={user.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.8 + index * 0.1 }}
                                            className={`p-3 rounded-xl border-2 border-[#151616] ${user.name === "You"
                                                ? "bg-[#D6F32F]/30 shadow-[2px_2px_0px_0px_#151616]"
                                                : "bg-white shadow-[2px_2px_0px_0px_#151616]"
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl font-bold text-[#151616]">
                                                        #{index + 1}
                                                    </span>
                                                    <div className={`w-8 h-8 rounded-lg border-2 border-[#151616] flex items-center justify-center ${user.avatar === "Trophy" ? "bg-yellow-100" :
                                                        user.avatar === "Stethoscope" ? "bg-blue-100" :
                                                            user.avatar === "UserCheck" ? "bg-green-100" :
                                                                user.avatar === "Zap" ? "bg-orange-100" :
                                                                    user.avatar === "Heart" ? "bg-red-100" :
                                                                        "bg-gray-100"
                                                        }`}>
                                                        {renderAvatarIcon(user.avatar)}
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-poppins font-bold text-[#151616]">
                                                        {user.name}
                                                    </p>
                                                    <div className="flex items-center gap-4 text-sm text-[#151616]/70">
                                                        <div className="flex items-center gap-1">
                                                            <Coins className="w-3 h-3 text-yellow-500" />
                                                            <span>{user.coins.toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Award className="w-3 h-3 text-purple-600" />
                                                            <span>Lv.{user.level}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Flame className="w-3 h-3 text-orange-500" />
                                                            <span>{user.streak}d</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Quick Stats */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.2 }}
                            className="mt-6"
                        >
                            <Card className="border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616]">
                                <CardHeader>
                                    <CardTitle className="font-instrument-serif font-bold text-[#151616] flex items-center gap-2">
                                        <Zap className="w-6 h-6 text-purple-600" />
                                        Quick Stats
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[#151616]/70 font-poppins">Tasks Completed</span>
                                        <span className="font-bold text-[#151616]">{userCompletedTasks}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[#151616]/70 font-poppins">Best Streak</span>
                                        <span className="font-bold text-[#151616]">{userBestStreak} days</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[#151616]/70 font-poppins">Current Level</span>
                                        <span className="font-bold text-[#151616]">Level {userLevel}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[#151616]/70 font-poppins">Total Earned</span>
                                        <span className="font-bold text-[#151616]">{userTotalEarned.toLocaleString()} coins</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </div>

                {/* Appointment and Payment History */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.3 }}
                    >
                        <AppointmentHistory />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.4 }}
                    >
                        <PaymentHistory />
                    </motion.div>
                </div>

                {/* Video Task Verification Modal */}
                {selectedTask && (
                    <VideoTaskVerification
                        task={selectedTask}
                        isOpen={showVideoVerification}
                        onClose={() => {
                            setShowVideoVerification(false);
                            setSelectedTask(null);
                        }}
                        onTaskCompleted={onVideoTaskCompleted}
                    />
                )}
            </div>
        </div>
    );
}