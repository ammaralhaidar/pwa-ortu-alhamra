import React from 'react';
import { render, screen, act } from '@testing-library/react';
import CountdownTimer from './CountdownTimer';

// Mock timer functions
jest.useFakeTimers();

describe('CountdownTimer Component', () => {
  beforeEach(() => {
    // Set system time to a fixed point: 2026-05-19T10:00:00Z
    jest.setSystemTime(new Date('2026-05-19T10:00:00Z').getTime());
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('renders countdown values correctly when time is remaining', () => {
    // Target is 1 hour, 15 minutes, 30 seconds ahead of mock time
    const targetDate = '2026-05-19 11:15:30'; 
    render(<CountdownTimer targetDateStr={targetDate} />);

    // Since mock time is 10:00:00 UTC and target is 11:15:30 UTC
    // diff is 1 hour 15 mins 30 secs
    expect(screen.getByText('01')).toBeInTheDocument(); // Jam
    expect(screen.getByText('15')).toBeInTheDocument(); // Menit
    expect(screen.getByText('30')).toBeInTheDocument(); // Detik
  });

  it('updates the countdown every second', () => {
    const targetDate = '2026-05-19 10:00:10'; // 10 seconds ahead
    render(<CountdownTimer targetDateStr={targetDate} />);

    expect(screen.getByText('10')).toBeInTheDocument(); // 10 Detik
    
    act(() => {
      jest.advanceTimersByTime(1000); // advance 1 second
    });

    expect(screen.getByText('09')).toBeInTheDocument(); // 9 Detik
  });

  it('displays "Kode Kedaluwarsa" when target date is in the past', () => {
    const targetDate = '2026-05-19 09:00:00'; // 1 hour behind mock time
    render(<CountdownTimer targetDateStr={targetDate} />);

    expect(screen.getByText('Kode Kedaluwarsa')).toBeInTheDocument();
  });
});
