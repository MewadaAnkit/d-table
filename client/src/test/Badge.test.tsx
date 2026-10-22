import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Badge } from '../components/common/Badge';

describe('Badge Component', () => {
  it('renders completed status badge correctly', () => {
    render(<Badge status="completed" />);
    const badge = screen.getByText('Completed');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('text-emerald-700');
  });

  it('renders in_progress badge with formatted label', () => {
    render(<Badge status="in_progress" />);
    const badge = screen.getByText('In Progress');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('text-amber-700');
  });

  it('renders incomplete status badge', () => {
    render(<Badge status="incomplete" />);
    const badge = screen.getByText('Incomplete');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('text-rose-700');
  });

  it('renders custom label when provided', () => {
    render(<Badge status="valid" label="Approved Shift" />);
    expect(screen.getByText('Approved Shift')).toBeInTheDocument();
  });
});
