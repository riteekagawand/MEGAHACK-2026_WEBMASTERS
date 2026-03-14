import mongoose, { Schema, Document } from 'mongoose';

export interface IAgentMetrics extends Document {
  agentName: string;
  sessionId: string;
  userId: string;
  performance: {
    startTime: Date;
    endTime: Date;
    processingTime: number; // in milliseconds
    success: boolean;
    errorMessage?: string;
  };
  apiUsage: {
    model: string;
    tokensUsed?: number;
    cost?: number;
    responseTime: number;
  };
  qualityMetrics: {
    confidence?: number;
    accuracy?: number;
    relevance?: number;
  };
  createdAt: Date;
}

const AgentMetricsSchema = new Schema<IAgentMetrics>({
  agentName: {
    type: String,
    required: true,
    enum: ['Bhasha', 'Lakshan', 'Shodh', 'Suraksha', 'Nidan'],
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  performance: {
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    processingTime: { type: Number, required: true },
    success: { type: Boolean, required: true },
    errorMessage: String
  },
  apiUsage: {
    model: { type: String, required: true },
    tokensUsed: Number,
    cost: Number,
    responseTime: { type: Number, required: true }
  },
  qualityMetrics: {
    confidence: Number,
    accuracy: Number,
    relevance: Number
  }
}, {
  timestamps: true
});

// Indexes for performance
AgentMetricsSchema.index({ agentName: 1, createdAt: -1 });
AgentMetricsSchema.index({ userId: 1, createdAt: -1 });
AgentMetricsSchema.index({ sessionId: 1 });

export default mongoose.models.AgentMetrics || mongoose.model<IAgentMetrics>('AgentMetrics', AgentMetricsSchema);