'use client';

import { useState, useEffect } from 'react';
import { Employee } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  User,
  Mail,
  Wallet,
  DollarSign,
  Calendar,
  TrendingUp,
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface EmployeeDashboardProps {
  employee: Employee;
}

interface PaymentHistory {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  tx_hash?: string;
}

export default function EmployeeDashboard({ employee }: EmployeeDashboardProps) {
  const router = useRouter();
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await fetch(`/api/employee/${employee.id}/payments`);
        const data = await response.json();

        if (data.success) {
          setPayments(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching payment history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayments();
  }, [employee.id]);

  const totalPaid = payments
    .filter(p => p.status === 'confirmed')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingPayments = payments.filter(p => p.status === 'pending').length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push('/dashboard/employees')}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Employees
      </Button>

      {/* Employee Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-semibold">
            {employee.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-black">{employee.name}</h1>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="w-4 h-4" />
                {employee.email}
              </div>
              <Badge
                className={
                  employee.status === 'active' || employee.status === 'paid'
                    ? 'bg-green-100 text-green-800 border-green-200'
                    : employee.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                    : 'bg-red-100 text-red-800 border-red-200'
                }
              >
                {employee.status || 'pending'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-[#737E9C] flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Annual Salary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-black">
              ${employee.salary_usd?.toLocaleString() || 0}
            </p>
            <p className="text-xs text-[#737E9C] mt-1">Per year</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-[#737E9C] flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Total Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-green-600">
              ${totalPaid.toLocaleString()}
            </p>
            <p className="text-xs text-[#737E9C] mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-[#737E9C] flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-black">{pendingPayments}</p>
            <p className="text-xs text-[#737E9C] mt-1">In queue</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal text-[#737E9C] flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Joined
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-black">
              {employee.created_at
                ? new Date(employee.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : '-'}
            </p>
            <p className="text-xs text-[#737E9C] mt-1">Member since</p>
          </CardContent>
        </Card>
      </div>

      {/* Employee Details */}
      <Card className="border-gray-200 mb-8">
        <CardHeader>
          <CardTitle>Employee Details</CardTitle>
          <CardDescription>Personal and payment information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-700">Full Name</label>
              <div className="mt-1 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm font-medium text-black">{employee.name}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Email Address</label>
              <div className="mt-1 p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <p className="text-sm font-medium text-black">{employee.email}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Wallet Address</label>
              <div className="mt-1 p-3 bg-gray-50 rounded-lg border border-gray-200">
                {employee.wallet_address ? (
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-gray-400" />
                    <code className="text-xs font-mono text-black break-all">
                      {employee.wallet_address}
                    </code>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No wallet connected</p>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Monthly Salary</label>
              <div className="mt-1 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-semibold text-blue-900">
                  ${Math.round((employee.salary_usd || 0) / 12).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>View all payments made to this employee</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading payment history...</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No payments yet</p>
              <p className="text-sm text-gray-400">Payment history will appear here</p>
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 border-gray-200">
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Amount</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Transaction Hash</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id} className="border-gray-200 hover:bg-gray-50">
                      <TableCell>
                        {new Date(payment.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell className="font-semibold text-black">
                        ${payment.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(payment.status)}
                          <Badge
                            className={
                              payment.status === 'confirmed'
                                ? 'bg-green-100 text-green-800 border-green-200'
                                : payment.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                : 'bg-red-100 text-red-800 border-red-200'
                            }
                          >
                            {payment.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {payment.tx_hash ? (
                          <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded border border-gray-200">
                            {payment.tx_hash.slice(0, 10)}...{payment.tx_hash.slice(-8)}
                          </code>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
