import { ethers } from 'ethers';
import { getSigner, getUSDCContract } from './arc';
import { updateEmployee, Employee } from './supabase';
import { PayrollResult} from './payroll-agent';

export interface BatchPaymentEmployee {
  id: number; // DB ID
  employee_id: string;
  wallet_address: string;
  net_pay: number;
}

export interface BatchPaymentResult {
  txHash: string;
  totalPaid: number;
  employeeCount: number;
  explorerUrl: string;
  gasUsed?: string;
  blockNumber?: number;
}

// BatchPayer contract ABI (simplified version using native USDC)
const BATCH_PAYER_ABI = [
  'function batchPay(address[] calldata recipients, uint256[] calldata amounts) external payable',
  'function owner() external view returns (address)',
];

/**
 * ExecutorAgent - Handles batch payment execution on Arc blockchain
 */
export class ExecutorAgent {
  private signer: ethers.Wallet;
  private usdcContract: ethers.Contract;
  private batchPayerContract: ethers.Contract | null = null;

  constructor() {
    this.signer = getSigner();
    this.usdcContract = getUSDCContract();

    // Initialize BatchPayer contract if address is set
    const batchPayerAddress = process.env.BATCH_PAYER_ADDRESS;
    if (batchPayerAddress && batchPayerAddress !== 'NOT_DEPLOYED') {
      this.batchPayerContract = new ethers.Contract(
        batchPayerAddress,
        BATCH_PAYER_ABI,
        this.signer
      );
    }
  }

  /**
   * Execute batch payment to employees
   * @param employees Array of employees with payment info
   * @returns Transaction result
   */
  async executeBatchPay(employees: BatchPaymentEmployee[]): Promise<BatchPaymentResult> {
    if (!this.batchPayerContract) {
      throw new Error(
        'BatchPayer contract not deployed. Run: npx tsx scripts/deploy-batch-payer.ts'
      );
    }

    if (employees.length === 0) {
      throw new Error('No employees to pay');
    }

    console.log(`💰 Executing batch payment for ${employees.length} employees...`);

    try {
      // Prepare arrays for batch payment
      const addresses: string[] = [];
      const amounts: bigint[] = [];
      let totalAmount = 0;

      for (const emp of employees) {
        if (!emp.wallet_address) {
          throw new Error(`Employee ${emp.employee_id} has no wallet address`);
        }

        if (!ethers.isAddress(emp.wallet_address)) {
          throw new Error(`Invalid wallet address for ${emp.employee_id}: ${emp.wallet_address}`);
        }

        if (emp.net_pay <= 0) {
          throw new Error(`Invalid payment amount for ${emp.employee_id}: ${emp.net_pay}`);
        }

        addresses.push(emp.wallet_address);
        // Convert to USDC wei (6 decimals)
        const amountWei = ethers.parseUnits(emp.net_pay.toFixed(6), 6);
        amounts.push(amountWei);
        totalAmount += emp.net_pay;
      }

      console.log(`📊 Payment Summary:`);
      console.log(`   Employees: ${employees.length}`);
      console.log(`   Total: $${totalAmount.toFixed(2)} USDC`);

      // Step 1: Check native USDC balance (Arc uses USDC as native currency)
      const provider = this.signer.provider;
      if (!provider) {
        throw new Error('Provider not available from signer');
      }
      const balance = await provider.getBalance(this.signer.address);
      const balanceFormatted = parseFloat(ethers.formatEther(balance));

      console.log(`\n💵 Native USDC Balance: ${balanceFormatted.toFixed(2)}`);

      if (balanceFormatted < totalAmount) {
        throw new Error(
          `Insufficient USDC balance. Need ${totalAmount.toFixed(2)}, have ${balanceFormatted.toFixed(2)}`
        );
      }

      // Step 2: Execute batch payment with native USDC
      console.log(`\n💸 Executing batch payment...`);
      const totalAmountWei = ethers.parseUnits(totalAmount.toFixed(6), 6);

      const batchTx = await this.batchPayerContract.batchPay(addresses, amounts, {
        value: totalAmountWei, // Send native USDC with the transaction
        gasLimit: 500000 + employees.length * 100000, // Dynamic gas limit
      });

      console.log(`   Transaction: ${batchTx.hash}`);
      console.log(`   ⏳ Waiting for confirmation...`);

      const receipt = await batchTx.wait();

      console.log(`   ✅ Payment confirmed!`);
      console.log(`   Block: ${receipt.blockNumber}`);
      console.log(`   Gas Used: ${receipt.gasUsed.toString()}`);

      // Step 4: Update database
      console.log(`\n📝 Updating employee records...`);

      for (const emp of employees) {
        try {
          await updateEmployee(emp.id, {
            status: 'paid',
          });
        } catch (error) {
          console.error(`Failed to update employee ${emp.employee_id}:`, error);
        }
      }

      console.log(`   ✓ Updated ${employees.length} records`);

      // Create result
      const result: BatchPaymentResult = {
        txHash: batchTx.hash,
        totalPaid: totalAmount,
        employeeCount: employees.length,
        explorerUrl: `https://testnet.arcscan.app/tx/${batchTx.hash}`,
        gasUsed: receipt.gasUsed.toString(),
        blockNumber: receipt.blockNumber,
      };

      console.log(`\n🎉 Batch payment complete!`);
      console.log(`   Explorer: ${result.explorerUrl}`);

      return result;
    } catch (error) {
      console.error('❌ Batch payment failed:', error);
      throw new Error(`Batch payment execution failed: ${(error as Error).message}`);
    }
  }

  /**
   * Get USDC balance of deployer wallet
   * @returns Balance in USDC
   */
  async getUSDCBalance(): Promise<number> {
    const balance = await this.usdcContract.balanceOf(this.signer.address);
    return parseFloat(ethers.formatUnits(balance, 6));
  }

  /**
   * Get BatchPayer contract stats
   * @returns Contract statistics
   */
  async getBatchPayerStats(): Promise<{
    totalPayments: number;
    totalAmountPaid: number;
  }> {
    if (!this.batchPayerContract) {
      throw new Error('BatchPayer contract not deployed');
    }

    const [totalPayments, totalAmountPaid] = await this.batchPayerContract.getStats();

    return {
      totalPayments: Number(totalPayments),
      totalAmountPaid: parseFloat(ethers.formatUnits(totalAmountPaid, 6)),
    };
  }

  /**
   * Check if executor is ready
   * @returns true if BatchPayer contract is deployed
   */
  isReady(): boolean {
    return this.batchPayerContract !== null;
  }
}

// Export singleton instance (lazy initialization)
let executorAgentInstance: ExecutorAgent | null = null;

export function getExecutorAgent(): ExecutorAgent {
  if (!executorAgentInstance) {
    executorAgentInstance = new ExecutorAgent();
  }
  return executorAgentInstance;
}

// Export function for easy use
export async function executeBatchPay(
  employees: BatchPaymentEmployee[]
): Promise<BatchPaymentResult> {
  return getExecutorAgent().executeBatchPay(employees);
}
