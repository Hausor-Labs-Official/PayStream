'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle2, Clock, AlertCircle, Loader2, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AgentStep {
  id: string;
  agent: string;
  action: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  timestamp?: Date;
  details?: string;
  duration?: number;
}

interface AgentMonitorProps {
  isOpen: boolean;
  onClose: () => void;
  processType?: 'payroll' | 'onboarding' | 'funding' | 'custom';
  steps?: AgentStep[];
}

const PAYROLL_STEPS: AgentStep[] = [
  {
    id: '1',
    agent: 'Penny AI',
    action: 'Analyzing payroll requirements',
    status: 'pending',
    details: 'Reviewing employee data and payment schedules',
  },
  {
    id: '2',
    agent: 'Payroll Agent',
    action: 'Calculating payments',
    status: 'pending',
    details: 'Computing salaries, deductions, and bonuses',
  },
  {
    id: '3',
    agent: 'Funding Agent',
    action: 'Checking treasury balance',
    status: 'pending',
    details: 'Verifying USDC availability on Arc network',
  },
  {
    id: '4',
    agent: 'Executor Agent',
    action: 'Processing blockchain transactions',
    status: 'pending',
    details: 'Executing USDC transfers to employee wallets',
  },
  {
    id: '5',
    agent: 'Onboarding Agent',
    action: 'Updating employee records',
    status: 'pending',
    details: 'Marking payments as completed in system',
  },
];

export default function AgentMonitor({
  isOpen,
  onClose,
  processType = 'payroll',
  steps: customSteps,
}: AgentMonitorProps) {
  const [steps, setSteps] = useState<AgentStep[]>(customSteps || PAYROLL_STEPS);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);

  // Simulate process execution
  useEffect(() => {
    if (!isOpen) return;

    let timeoutId: NodeJS.Timeout;

    const executeNextStep = (index: number) => {
      if (index >= steps.length) return;

      // Mark current step as in progress
      setSteps((prev) =>
        prev.map((step, i) =>
          i === index
            ? { ...step, status: 'in_progress', timestamp: new Date() }
            : step
        )
      );
      setCurrentStepIndex(index);

      // Complete step after random duration (1-3 seconds)
      const duration = Math.random() * 2000 + 1000;
      timeoutId = setTimeout(() => {
        setSteps((prev) =>
          prev.map((step, i) =>
            i === index
              ? {
                  ...step,
                  status: 'completed',
                  duration: duration / 1000,
                }
              : step
          )
        );

        // Move to next step
        executeNextStep(index + 1);
      }, duration);
    };

    // Start execution
    const startDelay = setTimeout(() => {
      executeNextStep(0);
    }, 500);

    return () => {
      clearTimeout(startDelay);
      clearTimeout(timeoutId);
    };
  }, [isOpen, steps.length]);

  if (!isOpen) return null;

  const completedSteps = steps.filter((s) => s.status === 'completed').length;
  const progress = (completedSteps / steps.length) * 100;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Play className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Agent Execution Monitor</h2>
                <p className="text-sm text-blue-100">
                  {processType.charAt(0).toUpperCase() + processType.slice(1)} Process
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{completedSteps} of {steps.length} steps completed</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
                className="h-full bg-white rounded-full"
              />
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-200px)]">
          <div className="space-y-4">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-xl border-2 transition-all ${
                  step.status === 'in_progress'
                    ? 'border-blue-500 bg-blue-50'
                    : step.status === 'completed'
                    ? 'border-green-500 bg-green-50'
                    : step.status === 'failed'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Status Icon */}
                  <div className="mt-1">
                    {step.status === 'pending' && (
                      <Clock className="w-5 h-5 text-gray-400" />
                    )}
                    {step.status === 'in_progress' && (
                      <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                    )}
                    {step.status === 'completed' && (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    )}
                    {step.status === 'failed' && (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                        {step.agent}
                      </span>
                      {step.duration && (
                        <span className="text-xs text-gray-500">
                          {step.duration.toFixed(1)}s
                        </span>
                      )}
                    </div>
                    <h4 className="font-medium text-gray-900">{step.action}</h4>
                    {step.details && (
                      <p className="text-sm text-gray-600 mt-1">{step.details}</p>
                    )}
                    {step.timestamp && (
                      <p className="text-xs text-gray-400 mt-2">
                        {step.timestamp.toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {progress === 100 ? (
                <span className="text-green-600 font-medium">All steps completed successfully!</span>
              ) : (
                <span>Agents working autonomously...</span>
              )}
            </p>
            {progress === 100 && (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
