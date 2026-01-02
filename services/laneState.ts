
import { Lane, SimulationResult } from '../types';

export class LaneManager {
  private lanes: Lane[];

  constructor(numLanes: number = 8, baseCapacity: number = 1000) {
    this.lanes = Array.from({ length: numLanes }, (_, i) => ({
      id: i,
      capacity: baseCapacity,
      maxCapacity: baseCapacity,
      spreadPpm: 50 + i * 150, // 5bps starting spread
      isDepleted: false,
      wasConsumedLastSlot: false,
    }));
  }

  getLanes(): Lane[] {
    return this.lanes.map(l => ({ ...l }));
  }

  onNewSlot(): void {
    this.lanes = this.lanes.map(lane => {
      let newCapacity = lane.capacity;
      const missing = lane.maxCapacity - lane.capacity;

      if (lane.wasConsumedLastSlot) {
        // Half-backfill logic: only refill 50% if consumed in prev slot
        newCapacity = lane.capacity + (missing * 0.5);
      } else {
        // Full refill only after an idle slot
        newCapacity = lane.maxCapacity;
      }

      // Reset tracking for next slot calculation
      const stillMissing = (lane.maxCapacity - newCapacity) > 1;

      return {
        ...lane,
        capacity: newCapacity,
        isDepleted: newCapacity < lane.maxCapacity * 0.9,
        wasConsumedLastSlot: false, // Will be set by executeSwap if hit in this slot
      };
    });
  }

  simulateSwap(amount: number, oraclePrice: number): SimulationResult {
    let remainingAmount = amount;
    let totalOutput = 0;
    const touchedLanes: number[] = [];
    
    const simulatedLanes = this.lanes.map(l => ({ ...l }));

    for (const lane of simulatedLanes) {
      if (remainingAmount <= 0) break;

      const fillable = Math.min(remainingAmount, lane.capacity);
      if (fillable > 0) {
        const laneSpread = 1 - (lane.spreadPpm / 1_000_000);
        const laneOutput = (fillable * oraclePrice) * laneSpread;
        
        totalOutput += laneOutput;
        remainingAmount -= fillable;
        touchedLanes.push(lane.id);
      }
    }

    const expectedOutput = amount * oraclePrice;
    const slippage = expectedOutput > 0 ? (expectedOutput - totalOutput) / expectedOutput : 0;

    return {
      expectedOutput,
      realizedOutput: totalOutput,
      slippage,
      lanesTouched: touchedLanes,
    };
  }

  executeSwap(amount: number): void {
    let remaining = amount;
    for (let i = 0; i < this.lanes.length; i++) {
      if (remaining <= 0) break;
      const fill = Math.min(remaining, this.lanes[i].capacity);
      if (fill > 0) {
        this.lanes[i].capacity -= fill;
        this.lanes[i].wasConsumedLastSlot = true;
        remaining -= fill;
      }
    }
  }
}
