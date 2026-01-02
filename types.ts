
export interface Lane {
  id: number;
  capacity: number;
  maxCapacity: number;
  spreadPpm: number;
  isDepleted: boolean;
  wasConsumedLastSlot: boolean;
}

export type TransactionType = 'SWAP' | 'ARBITRAGE' | 'LIQUIDATION' | 'CANCELLATION' | 'SYSTEM';

export interface Transaction {
  signature: string;
  slot: number;
  timestamp: number;
  computeUnits: number;
  type: TransactionType;
  inputAmount: number;
  outputAmount: number;
  realizedPrice: number;
  isToxic: boolean;
  reason?: string;
  programId: string;
  status: 'SUCCESS' | 'FAILED';
}

export interface SimulationResult {
  expectedOutput: number;
  realizedOutput: number;
  slippage: number;
  lanesTouched: number[];
}
