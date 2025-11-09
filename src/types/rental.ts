export interface RentalDuration {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  hours: number;
  days?: number; // Optional field for backward compatibility
}