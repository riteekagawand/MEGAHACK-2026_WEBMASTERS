"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
    Coins,
    Percent,
    IndianRupee,
    CheckCircle,
    AlertCircle,
    Sparkles,
} from "lucide-react";

interface CoinDiscountProps {
    originalAmount: number;
    onDiscountChange: (discountData: {
        useCoinDiscount: boolean;
        discountAmount: number;
        finalAmount: number;
        coinsUsed: number;
    }) => void;
}

export default function CoinDiscount({
    originalAmount,
    onDiscountChange,
}: CoinDiscountProps) {
    const [useCoinDiscount, setUseCoinDiscount] = useState(false);
    const [discountData, setDiscountData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchDiscountInfo();
    }, [originalAmount]);

    useEffect(() => {
        if (discountData) {
            calculateDiscount();
        }
    }, [useCoinDiscount, discountData, originalAmount]);

    const fetchDiscountInfo = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/payment/calculate-discount", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    originalAmount,
                    useCoinDiscount: false,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setDiscountData(data);
                    setError(null);
                } else {
                    setError(data.error || "Failed to fetch discount information");
                }
            } else {
                setError("Failed to fetch discount information");
            }
        } catch (error) {
            console.error("Error fetching discount info:", error);
            setError("Failed to fetch discount information");
        } finally {
            setLoading(false);
        }
    };

    const calculateDiscount = async () => {
        if (!discountData) return;

        try {
            const response = await fetch("/api/payment/calculate-discount", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    originalAmount,
                    useCoinDiscount,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setDiscountData(data);
                    onDiscountChange({
                        useCoinDiscount,
                        discountAmount: data.discountAmount,
                        finalAmount: data.finalAmount,
                        coinsUsed: data.coinsUsed,
                    });
                }
            }
        } catch (error) {
            console.error("Error calculating discount:", error);
        }
    };

    const handleToggleDiscount = (checked: boolean) => {
        if (checked && !discountData?.canUseDiscount) {
            return; // Don't allow enabling if user doesn't have enough coins
        }
        setUseCoinDiscount(checked);
    };

    if (loading) {
        return (
            <Card className="border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616]">
                <CardContent className="p-4">
                    <div className="flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-[#151616]/30 border-t-[#151616] rounded-full animate-spin"></div>
                        <span className="ml-2 text-[#151616]/70 font-poppins">
                            Loading discount options...
                        </span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="border-2 border-red-300 bg-red-50">
                <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-red-600">
                        <AlertCircle className="h-5 w-5" />
                        <span className="font-poppins">{error}</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616]">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 font-instrument-serif font-bold text-[#151616]">
                    <Sparkles className="h-5 w-5 text-[#D6F32F]" />
                    Coin Discount Available
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-[#D6F32F]/10 rounded-xl border border-[#151616]/20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#D6F32F] rounded-xl border-2 border-[#151616] flex items-center justify-center">
                            <Coins className="h-5 w-5 text-[#151616]" />
                        </div>
                        <div>
                            <p className="font-poppins font-bold text-[#151616]">
                                Use 100 Coins for 20% Discount
                            </p>
                            <p className="text-sm text-[#151616]/70 font-poppins">
                                Save ₹{Math.floor(originalAmount * 0.2)} on this appointment
                            </p>
                        </div>
                    </div>
                    <Switch
                        checked={useCoinDiscount}
                        onCheckedChange={handleToggleDiscount}
                        disabled={!discountData?.canUseDiscount}
                        className="data-[state=checked]:bg-[#D6F32F]"
                    />
                </div>

                {/* Current Coin Balance */}
                <div className="flex items-center justify-between text-sm font-poppins">
                    <span className="text-[#151616]/70">Your coin balance:</span>
                    <div className="flex items-center gap-1">
                        <Coins className="h-4 w-4 text-yellow-500" />
                        <span className="font-bold text-[#151616]">
                            {discountData?.currentCoins || 0}
                        </span>
                    </div>
                </div>

                {/* Insufficient Coins Warning */}
                {!discountData?.canUseDiscount && (
                    <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200">
                        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm font-poppins">
                            <p className="text-amber-800 font-bold mb-1">Not enough coins</p>
                            <p className="text-amber-700">
                                You need {discountData?.coinsRequired || 100} coins to apply this
                                discount. Complete health tasks to earn more coins!
                            </p>
                        </div>
                    </div>
                )}

                {/* Discount Applied */}
                {useCoinDiscount && discountData?.canUseDiscount && (
                    <div className="space-y-3 p-3 bg-green-50 rounded-xl border border-green-200">
                        <div className="flex items-center gap-2 text-green-800">
                            <CheckCircle className="h-5 w-5" />
                            <span className="font-poppins font-bold">Discount Applied!</span>
                        </div>

                        <div className="space-y-2 text-sm font-poppins">
                            <div className="flex justify-between">
                                <span className="text-green-700">Original Amount:</span>
                                <span className="text-green-800 font-bold">
                                    ₹{originalAmount}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-green-700">Discount (20%):</span>
                                <span className="text-green-600 font-bold">
                                    -₹{discountData?.discountAmount || 0}
                                </span>
                            </div>
                            <div className="border-t border-green-200 pt-2">
                                <div className="flex justify-between">
                                    <span className="text-green-700 font-bold">Final Amount:</span>
                                    <span className="text-green-800 font-bold text-lg">
                                        ₹{discountData?.finalAmount || originalAmount}
                                    </span>
                                </div>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-green-700">Coins Used:</span>
                                <div className="flex items-center gap-1">
                                    <Coins className="h-4 w-4 text-yellow-500" />
                                    <span className="text-green-800 font-bold">100</span>
                                </div>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-green-700">Remaining Coins:</span>
                                <div className="flex items-center gap-1">
                                    <Coins className="h-4 w-4 text-yellow-500" />
                                    <span className="text-green-800 font-bold">
                                        {discountData?.remainingCoins || 0}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Earn More Coins CTA */}
                {discountData?.currentCoins < 100 && (
                    <div className="text-center">
                        <Button
                            variant="outline"
                            className="border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616] hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_#151616] transition-all"
                            onClick={() => (window.location.href = "/patient/dashboard")}
                        >
                            <Coins className="h-4 w-4 mr-2" />
                            Complete Tasks to Earn Coins
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
