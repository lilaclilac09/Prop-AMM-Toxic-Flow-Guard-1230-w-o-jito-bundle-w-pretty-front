
import { Lane, SimulationResult } from '../types';

export class LaneManager {
  private lanes: Lane[];
  private wasDepletedLastSlot: boolean = false;

  constructor(numLanes: number = 10, baseCapacity: number = 1000) {
    this.lanes = Array.from({ length: numLanes }, (_, i) => ({
      id: i,
      capacity: baseCapacity,
      maxCapacity: baseCapacity,
      spreadPpm: 10 + i * 50,
      isDepleted: false,
    }));
  }

  getLanes(): Lane[] {
    // Return deep clones to prevent accidental UI-side mutation
    return this.lanes.map(l => ({ ...l }));
  }

  onNewSlot(): void {
    const currentDepleted = this.lanes.some(l => l.capacity < l.maxCapacity * 0.95);
    
    this.lanes = this.lanes.map(lane => {
      let newCapacity = lane.capacity;
      if (this.wasDepletedLastSlot) {
        const missing = lane.maxCapacity - lane.capacity;
        newCapacity = lane.capacity + (missing * 0.5);
      } else {
        newCapacity = lane.maxCapacity;
      }
      return {
        ...lane,
        capacity: newCapacity,
        isDepleted: newCapacity < lane.maxCapacity * 0.9,
      };
    });

    this.wasDepletedLastSlot = currentDepleted;
  }

  simulateSwap(amount: number, oraclePrice: number): SimulationResult {
    let remainingAmount = amount;
    let totalOutput = 0;
    const touchedLanes: number[] = [];
    
    // Create a local clone for simulation to avoid mutating class state
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
        lane.capacity -= fillable;
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
      this.lanes[i].capacity -= fill;
      remaining -= fill;
    }
  }
}
