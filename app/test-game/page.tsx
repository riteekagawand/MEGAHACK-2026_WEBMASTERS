"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";

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

const HealthGamePage = () => {
    const [userCoins, setUserCoins] = useState(1250);
    const [userLevel, setUserLevel] = useState(8);
    const [userStreak, setUserStreak] = useState(12);
    const [showCoinAnimation, setShowCoinAnimation] = useState(false);
    const [earnedCoins, setEarnedCoins] = useState(0);

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

    const [dailyTasks, setDailyTasks] = useState<Task[]>([
        {
            id: "1",
            title: "Complete 7 Push-ups",
            description: "Build upper body strength with 7 push-ups",
            category: "fitness",
            coins: 50,
            difficulty: "easy",
            completed: false,
            streak: 0,
            icon: Activity,
        },
        {
            id: "2",
            title: "Drink 8 Glasses of Water",
            description: "Stay hydrated throughout the day",
            category: "wellness",
            coins: 30,
            difficulty: "easy",
            completed: true,
            streak: 5,
            icon: Heart,
        },
        {
            id: "3",
            title: "10-Minute Meditation",
            description: "Practice mindfulness and reduce stress",
            category: "wellness",
            coins: 40,
            difficulty: "medium",
            completed: false,
            streak: 0,
            icon: Star,
        },
        {
            id: "4",
            title: "Take Daily Vitamins",
            description: "Don't forget your daily supplements",
            category: "medical",
            coins: 25,
            difficulty: "easy",
            completed: false,
            streak: 0,
            icon: Plus,
        },
        {
            id: "5",
            title: "30-Minute Walk",
            description: "Get your daily cardio exercise",
            category: "fitness",
            coins: 60,
            difficulty: "medium",
            completed: false,
            streak: 0,
            icon: TrendingUp,
        },
        {
            id: "6",
            title: "Eat 5 Servings of Fruits/Vegetables",
            description: "Maintain a balanced, nutritious diet",
            category: "nutrition",
            coins: 45,
            difficulty: "medium",
            completed: false,
            streak: 0,
            icon: Heart,
        },
    ]);

    const [leaderboard, setLeaderboard] = useState<User[]>([
        {
            id: "1",
            name: "You",
            coins: userCoins,
            level: userLevel,
            streak: userStreak,
            completedTasks: 156,
            avatar: "Trophy",
        },
        {
            id: "2",
            name: "Sarah Chen",
            coins: 1180,
            level: 7,
            streak: 8,
            completedTasks: 142,
            avatar: "Stethoscope",
        },
        {
            id: "3",
            name: "Dr. Mike",
            coins: 1050,
            level: 6,
            streak: 15,
            completedTasks: 128,
            avatar: "UserCheck",
        },
        {
            id: "4",
            name: "Alex Runner",
            coins: 980,
            level: 6,
            streak: 6,
            completedTasks: 119,
            avatar: "Zap",
        },
        {
            id: "5",
            name: "Wellness Guru",
            coins: 875,
            level: 5,
            streak: 22,
            completedTasks: 105,
            avatar: "Heart",
        },
    ]);

    const completeTask = (taskId: string) => {
        setDailyTasks((prev) =>
            prev.map((task) => {
                if (task.id === taskId && !task.completed) {
                    const newCoins = task.coins;
                    setEarnedCoins(newCoins);
                    setUserCoins((prevCoins) => prevCoins + newCoins);
                    setShowCoinAnimation(true);

                    setTimeout(() => setShowCoinAnimation(false), 2000);

                    return { ...task, completed: true, streak: task.streak + 1 };
                }
                return task;
            })
        );
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

    return (
        <div className="min-h-screen bg-[#FFFFF4] p-6 relative">
            {/* Coins Display - Upper Right Corner */}
            <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="fixed top-6 right-6 z-50"
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
                                                                onClick={() => completeTask(task.id)}
                                                                className="bg-[#D6F32F] text-[#151616] border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616] hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_#151616] transition-all duration-200 font-poppins font-medium"
                                                            >
                                                                Complete
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
                                        <span className="font-bold text-[#151616]">156</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[#151616]/70 font-poppins">Best Streak</span>
                                        <span className="font-bold text-[#151616]">28 days</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[#151616]/70 font-poppins">Rank This Week</span>
                                        <span className="font-bold text-[#151616]">#1</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[#151616]/70 font-poppins">Total Earned</span>
                                        <span className="font-bold text-[#151616]">12,450 coins</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default HealthGamePage;